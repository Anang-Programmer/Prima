import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * API Pengirim Notifikasi (dipanggil cron tiap 1 menit).
 *
 * Alur:
 *  1. Verifikasi CRON_SECRET (header Authorization Bearer, atau ?secret=)
 *  2. Query timer jatuh tempo (active_timers, belum notified)
 *  3. Ambil user_id pemilik kolam + FCM token devicenya
 *  4. Kirim push via FCM HTTP v1 (OAuth2 JWT dari service account)
 *  5. Tandai timer notified_at agar tidak dikirim dua kali
 *
 * Env wajib: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL,
 *            SUPABASE_SERVICE_ROLE_KEY, FIREBASE_SERVICE_ACCOUNT_JSON
 */

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

// Tukar JWT service account menjadi OAuth2 access token untuk FCM.
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(sa.private_key.replace(/\\n/g, "\n"));
  const jwt = `${unsigned}.${signature.toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth Google gagal: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) - 60) * 1000,
  };
  return cachedToken.token;
}

async function sbSelect(table: string, query: Record<string, string>) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?` +
    new URLSearchParams(query).toString();
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET belum diset - fitur mati" }, { status: 503 });
  }
  const provided =
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") ||
    req.nextUrl.searchParams.get("secret") ||
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saRaw || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Env belum lengkap" }, { status: 500 });
  }
  const sa = JSON.parse(saRaw) as ServiceAccount;

  // 1) Timer jatuh tempo yang belum dinotifikasi
  const nowIso = new Date().toISOString();
  const timers: any[] = await sbSelect("active_timers", {
    is_completed: "eq.false",
    notified_at: "is.null",
    due_time: `lte.${nowIso}`,
    select: "id,type,due_time,pond_id",
  });
  if (!timers.length) {
    return NextResponse.json({ ok: true, sent: 0, detail: "Tidak ada timer jatuh tempo" });
  }

  // 2) Kolam -> user_id + nama
  const pondIds = [...new Set(timers.map((t) => t.pond_id))].join(",");
  const ponds: any[] = await sbSelect("ponds", {
    id: `in.(${pondIds})`,
    select: "id,user_id,name",
  });
  const pondMap = new Map(ponds.map((p) => [p.id, p]));

  // 3) FCM token per user
  const userIds = [...new Set(ponds.map((p) => p.user_id))].join(",");
  let tokens: any[] = [];
  if (userIds) {
    tokens = await sbSelect("fcm_tokens", {
      user_id: `in.(${userIds})`,
      select: "token,user_id",
    });
  }
  const tokensByUser = new Map<string, string[]>();
  for (const t of tokens) {
    tokensByUser.set(t.user_id, [...(tokensByUser.get(t.user_id) ?? []), t.token]);
  }

  const accessToken = await getAccessToken(sa);
  let sent = 0;
  const errors: string[] = [];

  for (const timer of timers) {
    const pond = pondMap.get(timer.pond_id) as { user_id: string; name: string } | undefined;
    const pondName = pond?.name ?? "Kolam";
    const copy =
      ({
        Pakan: {
          title: "Waktunya Memberi Pakan!",
          body: `Sesi pakan kolam ${pondName} telah jatuh tempo. Buka aplikasi untuk konfirmasi.`,
        },
        "Cek Anco": {
          title: "Waktunya Cek Anco!",
          body: `Periksa sisa pakan di anco kolam ${pondName}.`,
        },
        Probiotik: {
          title: "Waktunya Beri Probiotik!",
          body: `Aplikasikan probiotik pada kolam ${pondName}.`,
        },
      } as Record<string, { title: string; body: string }>)[timer.type] ?? {
        title: "Pengingat Prima",
        body: `Ada pengingat untuk kolam ${pondName}.`,
      };

    const deviceTokens = pond ? tokensByUser.get(pond.user_id) ?? [] : [];
    for (const tk of deviceTokens) {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: tk,
                // Muatan notification: ditampilkan OLEH SISTEM (Play Services),
                // tetap masuk walau app tertutup total. Tampilan lokal di
                // background handler DINONAKTIFKAN agar tidak dobel.
                notification: copy,
                data: {
                  pond_id: String(timer.pond_id),
                  type: String(timer.type),
                  title: copy.title,
                  body: copy.body,
                },
                android: {
                  priority: "HIGH",
                  notification: {
                    icon: "@mipmap/launcher_icon",
                    channel_id: "prima_timers",
                  },
                },
              },
            }),
          }
        );
        if (res.ok) {
          sent++;
        } else {
          errors.push(`${timer.type}/${pondName}: ${res.status} ${await res.text()}`);
        }
      } catch (e: any) {
        errors.push(`${timer.type}/${pondName}: ${e?.message}`);
      }
    }

    // 5) Tandai notified walau token kosong/sebagian gagal (hindari retry storm)
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/active_timers?id=eq.${timer.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ notified_at: nowIso }),
      }
    );
  }

  return NextResponse.json({
    ok: true,
    processed: timers.length,
    sent,
    errors: errors.slice(0, 5),
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}