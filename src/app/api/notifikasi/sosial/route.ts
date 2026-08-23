import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

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

export async function POST(req: NextRequest) {
  try {
    const { post_id, actor_name, type, current_user_id } = await req.json();

    if (!post_id || !actor_name || !type) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!saRaw || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Env belum lengkap" }, { status: 500 });
    }
    const sa = JSON.parse(saRaw) as ServiceAccount;

    // 1) Cari pemilik postingan
    const posts: any[] = await sbSelect("posts", {
      id: `eq.${post_id}`,
      select: "user_id",
    });
    if (!posts.length) return NextResponse.json({ ok: false, detail: "Post not found" });
    
    const postOwnerId = posts[0].user_id;

    // Jangan kirim notifikasi kalau action ke post sendiri
    if (current_user_id && current_user_id === postOwnerId) {
       return NextResponse.json({ ok: true, detail: "Self action, ignored" });
    }

    // 2) Ambil FCM token pemilik post
    const tokens: any[] = await sbSelect("fcm_tokens", {
      user_id: `eq.${postOwnerId}`,
      select: "token",
    });

    if (!tokens.length) {
      return NextResponse.json({ ok: true, detail: "No FCM tokens for owner" });
    }

    const accessToken = await getAccessToken(sa);
    let sent = 0;

    const title = type === "LIKE" ? "Ada yang menyukai postinganmu!" : "Komentar Baru!";
    const body = type === "LIKE" 
      ? `${actor_name} menyukai postingan komunitas Anda.`
      : `${actor_name} memberikan komentar pada postingan Anda.`;

    for (const tk of tokens) {
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
              token: tk.token,
              notification: { title, body },
              data: {
                type: "SOCIAL",
                post_id: String(post_id),
                title,
                body,
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
      if (res.ok) sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
