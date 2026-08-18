"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronRight,
  Home,
  MessageCircle,
  Plus,
  Search,
  Smile,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LogoutButton } from "@/components/LogoutButton";
import TambahKolamSheet from "@/components/tambah-kolam-sheet";

/* ============================================================
   KONSTANTA & HELPER
============================================================ */
const TARGET_HARI = 120; // TODO: ambil dari field target kalau nanti ada

const NAV = [
  { label: "Beranda", icon: Home, href: "/", active: true },
  { label: "Proyeksi", icon: BarChart3, href: "/proyeksi", active: false },
  { label: "Komunitas", icon: MessageCircle, href: "/komunitas", active: false },
  { label: "Profil", icon: User, href: "/profil", active: false },
];

const round2 = (n: number) => Math.round(n * 100) / 100;
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

function fmtMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function stageOf(doc: number) {
  if (doc <= 30) return { label: "Benur", cls: "bg-[#FDEBDD] text-[#F2811B]" };
  if (doc <= 70) return { label: "Juvenil", cls: "bg-sky-100 text-sky-600" };
  return { label: "Pembesaran", cls: "bg-[#E3F1F2] text-[#2F6E7B]" };
}

/* ============================================================
   TYPES
============================================================ */
type PondDash = {
  pond_id: string;
  pond_name: string;
  area_m2: number;
  doc: number;
  cycle_id: string | null;
  current_biomass_kg: number;
  initial_shrimp_count: number | null;
  stage?: string; // override untuk mode demo
};
type Timer = { id: string; pond_id: string; type: string; due_time: string };
type DashData = {
  fullName: string;
  stats?: { totalKolam: number; sr: number; fcr: number };
  ponds: PondDash[];
  fcrByCycle: Record<string, number>;
  srByCycle: Record<string, number>;
  timers: Timer[];
};

/* ============================================================
   DATA CONTOH (persis seperti screenshot UI/UX) —
   dipakai hanya kalau user belum login / env belum diisi,
   supaya tampilan bisa langsung di-review.
============================================================ */
const pastDue = () => new Date(Date.now() - 1000).toISOString();
const DEMO: DashData = {
  fullName: "Matta Muhammad",
  stats: { totalKolam: 3, sr: 84, fcr: 0.41 },
  ponds: [
    { pond_id: "d1", pond_name: "Kolam A1", area_m2: 1000, doc: 78, cycle_id: "c1", current_biomass_kg: 300, initial_shrimp_count: 100000, stage: "Benur" },
    { pond_id: "d2", pond_name: "Kolam A1", area_m2: 800, doc: 120, cycle_id: "c2", current_biomass_kg: 250, initial_shrimp_count: 80000, stage: "Benur" },
    { pond_id: "d3", pond_name: "Kolam B1", area_m2: 1200, doc: 45, cycle_id: "c3", current_biomass_kg: 400, initial_shrimp_count: 120000, stage: "Benur" },
  ],
  fcrByCycle: { c1: 0.35, c2: 1.9, c3: 0.98 },
  srByCycle: { c1: 84, c2: 84, c3: 84 },
  timers: [
    { id: "t1", pond_id: "d1", type: "Cek Anco", due_time: pastDue() },
    { id: "t2", pond_id: "d1", type: "Pakan", due_time: pastDue() },
  ],
};

/* ============================================================
   KOMPONEN-KOMPONEN UI
============================================================ */
function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-3 text-center shadow-sm ${highlight ? "bg-[#D9EDF0]" : "bg-white"}`}>
      <p className={`text-[11px] font-medium ${highlight ? "text-[#2F6E7B]" : "text-slate-500"}`}>{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-[22px] font-extrabold leading-none text-slate-800">
        {value}
        {highlight && <Smile size={18} className="text-[#4C9AA6]" />}
      </p>
    </div>
  );
}

function AlarmBox({ label, due, now }: { label: string; due?: string; now: number }) {
  return (
    <div className="rounded-xl bg-[#F9D9CE] px-3 py-3 text-center">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-[#F2811B]">
        {due ? fmtMs(new Date(due).getTime() - now) : "00:00:00"}
      </p>
    </div>
  );
}

function PondCard({ pond, fcr }: { pond: PondDash; fcr?: number }) {
  const router = useRouter();
  const stage = pond.stage ? { label: pond.stage, cls: "bg-[#FDEBDD] text-[#F2811B]" } : stageOf(pond.doc);
  const pct = Math.min(100, Math.round((pond.doc / TARGET_HARI) * 100));
  const fcrColor = fcr != null && fcr > 1.5 ? "text-[#F2811B]" : "text-[#3E97A5]";
  return (
    <button type="button" onClick={() => router.push(`/kolam/${pond.pond_id}`)} className="w-full rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">{pond.pond_name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stage.cls}`}>{stage.label}</span>
        </div>
        <span className={`flex items-center gap-0.5 text-sm font-bold ${fcrColor}`}>
          {fcr != null ? `FCR ${fcr.toFixed(2)}` : "FCR –"}
          <ChevronRight size={16} className="text-slate-400" />
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#4C9AA6]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>Hari ke-{pond.doc}</span>
        <span>Target {TARGET_HARI} hari</span>
      </div>
      
      {/* Informasi Ekstra (Khusus Desktop) */}
      <div className="mt-4 hidden md:flex flex-col gap-2.5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Luas Kolam</span>
          <span className="text-[11px] font-extrabold text-slate-700">{pond.area_m2.toLocaleString('id-ID')} m²</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Populasi Awal</span>
          <span className="text-[11px] font-extrabold text-slate-700">{pond.initial_shrimp_count ? pond.initial_shrimp_count.toLocaleString('id-ID') : '-'} ekor</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Biomassa Terkini</span>
          <span className="text-[11px] font-extrabold text-slate-700">{pond.current_biomass_kg.toLocaleString('id-ID')} kg</span>
        </div>
      </div>
    </button>
  );
}

function BottomNav({ onAdd }: { onAdd?: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={onAdd}
          className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#4C9AA6] text-white shadow-lg ring-4 ring-white/70 transition active:scale-95"
        >
          <Plus size={24} />
        </button>
        <div className="grid grid-cols-4">
          {NAV.map(({ label, icon: Icon, href, active }) => (
            <a
              key={label}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#3E97A5]" : "text-slate-400"
                }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   HALAMAN DASHBOARD
============================================================ */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [showTambah, setShowTambah] = useState(false);

  /* tick countdown tiap 1 detik */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ambil data dari Supabase */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("not-logged-in");

        const [{ data: profile }, { data: ponds }] = await Promise.all([
          supabase.from("profiles").select("full_name, first_name, last_name").eq("id", user.id).maybeSingle(),
          supabase.from("v_pond_dashboard").select("*").eq("user_id", user.id),
        ]);

        const rows = (ponds ?? []) as any[];
        const cycleIds = rows.map((p) => p.cycle_id).filter(Boolean) as string[];
        const pondIds = rows.map((p) => p.pond_id);

        /* FCR per siklus = total pakan / biomassa terkini */
        const fcrByCycle: Record<string, number> = {};
        /* SR per siklus = sampling terbaru */
        const srByCycle: Record<string, number> = {};

        if (cycleIds.length) {
          const [{ data: feeds }, { data: samples }] = await Promise.all([
            supabase.from("feed_logs").select("cycle_id, feed_amount_kg").in("cycle_id", cycleIds),
            supabase
              .from("sampling_logs")
              .select("cycle_id, estimated_sr_pct, date")
              .in("cycle_id", cycleIds)
              .order("date", { ascending: false }),
          ]);

          const totalFeed: Record<string, number> = {};
          (feeds ?? []).forEach((f: any) => {
            totalFeed[f.cycle_id] = (totalFeed[f.cycle_id] ?? 0) + Number(f.feed_amount_kg);
          });
          rows.forEach((p) => {
            if (p.cycle_id && Number(p.current_biomass_kg) > 0)
              fcrByCycle[p.cycle_id] = round2((totalFeed[p.cycle_id] ?? 0) / Number(p.current_biomass_kg));
          });
          (samples ?? []).forEach((s: any) => {
            if (!(s.cycle_id in srByCycle) && s.estimated_sr_pct != null)
              srByCycle[s.cycle_id] = Number(s.estimated_sr_pct);
          });
        }

        const { data: timers } = pondIds.length
          ? await supabase
            .from("active_timers")
            .select("id, pond_id, type, due_time")
            .in("pond_id", pondIds)
            .eq("is_completed", false)
            .order("due_time", { ascending: true })
          : { data: [] };

        if (!cancelled) {
          const displayFullName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : (profile?.full_name || "Petambak");

          setData({
            fullName: displayFullName,
            ponds: rows.map((p) => ({
              pond_id: p.pond_id,
              pond_name: p.pond_name,
              area_m2: Number(p.area_m2),
              doc: Number(p.doc),
              cycle_id: p.cycle_id,
              current_biomass_kg: Number(p.current_biomass_kg),
              initial_shrimp_count: p.initial_shrimp_count,
            })),
            fcrByCycle,
            srByCycle,
            timers: (timers ?? []) as Timer[],
          });
        }
      } catch {
        /* belum login / env kosong -> tampilkan data contoh sesuai desain */
        if (!cancelled) {
          setData(DEMO);
          setIsDemo(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  /* statistik header */
  const stats = useMemo(() => {
    if (!data) return { totalKolam: 0, sr: 0, fcr: 0 };
    if (data.stats) return data.stats;
    return {
      totalKolam: data.ponds.length,
      sr: Math.round(avg(Object.values(data.srByCycle))),
      fcr: round2(avg(Object.values(data.fcrByCycle))),
    };
  }, [data]);

  /* daftar alarm diurutkan berdasarkan waktu yang paling mendesak (terdekat) */
  const alarms = useMemo(() => {
    if (!data) return [];
    const byPond = new Map<string, Timer[]>();
    data.timers.forEach((t) => byPond.set(t.pond_id, [...(byPond.get(t.pond_id) ?? []), t]));
    
    const pondsWithAlarms = data.ponds.filter((p) => byPond.has(p.pond_id));
    
    const mapped = pondsWithAlarms.map((pond) => {
      const ts = byPond.get(pond.pond_id)!;
      const earliest = Math.min(...ts.map(t => new Date(t.due_time).getTime()));
      return { 
        pond, 
        anco: ts.find((t) => t.type === "Cek Anco"), 
        pakan: ts.find((t) => t.type === "Pakan"),
        earliest 
      };
    });

    // Urutkan dari yang paling mendesak (waktu paling kecil / sudah lewat)
    mapped.sort((a, b) => a.earliest - b.earliest);
    
    // Hanya ambil 5 kolam teratas agar carousel tidak terlalu panjang
    return mapped.slice(0, 5);
  }, [data]);

  const visiblePonds = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return q ? data.ponds.filter((p) => p.pond_name.toLowerCase().includes(q)) : data.ponds;
  }, [data, query]);

  /* tandai timer selesai (TODO: arahkan ke form cek anco / beri pakan) */
  async function handleTimerAction(t?: Timer) {
    if (!t || isDemo) return;
    await supabase.from("active_timers").update({ is_completed: true }).eq("id", t.id);
    setReload((r) => r + 1);
  }

  if (!data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F5F7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4C9AA6] border-t-transparent" />
      </div>
    );

  return (
    <div className="min-h-screen md:h-screen md:flex bg-[#F2F5F7] text-slate-800 md:overflow-hidden">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:bg-white md:shadow-xl md:z-20 md:border-r md:border-slate-100">
        <div className="px-8 py-8 flex items-center justify-center border-b border-slate-50">
          <Image src="/logo.png" alt="PRIMA Logo" width={140} height={48} className="h-10 w-auto object-contain" priority />
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {NAV.map(({ label, icon: Icon, href, active }) => (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${active ? "bg-[#E3F1F2] text-[#2F6E7B]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} /> {label}
            </a>
          ))}
        </nav>
        {/* <div className="p-4 border-t border-slate-100">
          <LogoutButton variant="full" />
        </div> */}
      </aside>

      {/* ================= KONTEN UTAMA ================= */}
      <div className="w-full md:flex-1 md:overflow-y-auto bg-[#F2F5F7]">
        <div className="mx-auto w-full md:max-w-7xl">
          {/* ================= HEADER TEAL ================= */}
          <header className="bg-[#74B6BE] px-4 pb-6 pt-5 md:rounded-b-3xl md:px-10 md:pt-10 md:pb-12">
            {/* Logo khusus mobile */}
            <div className="flex items-center justify-between md:hidden">
              <div className="flex items-center text-white">
                <Image src="/logo.png" alt="PRIMA Logo" width={120} height={40} className="h-10 w-auto object-contain" priority />
              </div>
            </div>

            <div className="mt-5 md:mt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start justify-between md:block">
                <div>
                  <p className="text-xs text-white/80 md:text-sm">Selamat datang</p>
                  <h1 className="text-xl font-extrabold text-white md:text-3xl">{data.fullName}</h1>
                </div>
                <div className="flex items-center gap-1 md:hidden">
                  <button type="button" className="rounded-full p-2 text-white transition hover:bg-white/10">
                    <Bell size={20} />
                  </button>
                  {/* <div>
                    <LogoutButton variant="icon" className="!text-white hover:!bg-white/10 rounded-full" />
                  </div> */}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:gap-4">
                  <div className="md:w-36"><StatCard label="Total Kolam" value={String(stats.totalKolam)} /></div>
                  <div className="md:w-36"><StatCard label="SR Rata-rata" value={`${stats.sr}%`} /></div>
                  <div className="md:w-36"><StatCard label="FCR Rata-rata" value={stats.fcr.toFixed(2)} highlight /></div>
                </div>
                <button type="button" className="hidden md:flex rounded-full p-3 text-white transition hover:bg-white/20 items-center justify-center bg-white/10">
                  <Bell size={24} />
                </button>
              </div>
            </div>
          </header>

          {isDemo && (
            <p className="mx-4 mt-4 rounded-lg bg-amber-100 px-4 py-3 text-xs text-amber-700 md:mx-10 shadow-sm border border-amber-200">
              Mode pratinjau: menampilkan data contoh sesuai desain. Login untuk melihat data asli.
            </p>
          )}

          {/* ================= KONTEN ================= */}
          <main className="space-y-4 px-4 pb-28 pt-4 md:space-y-8 md:px-10 md:pb-12 md:pt-8">
            {/* --- Kartu Alarm --- */}
            {alarms.length > 0 && (
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x md:mx-0 md:px-0 md:grid md:grid-cols-1 md:gap-4 md:overflow-visible">
                {alarms.map((alarm) => (
                  <section key={alarm.pond.pond_id} className="min-w-[85vw] snap-center rounded-2xl border-2 border-[#F49E4C] bg-white p-4 shadow-sm md:min-w-0 md:flex-1 md:flex md:items-center md:justify-between md:p-6 md:gap-6">
                    <div className="md:shrink-0 flex items-start justify-between">
                      <div className="flex items-center md:gap-3">
                        <AlertTriangle size={24} className="hidden md:block text-[#F49E4C]" />
                        <div>
                          <p className="text-[11px] text-slate-500 md:text-sm md:font-semibold">Alarm Kolam</p>
                          <h3 className="text-base font-extrabold md:text-xl">{alarm.pond.pond_name}</h3>
                        </div>
                      </div>
                      <AlertTriangle size={20} className="md:hidden text-[#F49E4C]" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:mt-0 md:flex md:flex-1 md:justify-end md:gap-4">
                      <div className="md:w-40"><AlarmBox label="Cek Anco" due={alarm.anco?.due_time} now={now} /></div>
                      <div className="md:w-40"><AlarmBox label="Beri Pakan" due={alarm.pakan?.due_time} now={now} /></div>
                    </div>
                    <div className="mt-3 md:mt-0 md:shrink-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/kolam/${alarm.pond.pond_id}`)}
                        className="w-full rounded-lg bg-[#4C9AA6] py-3 text-xs font-semibold text-white transition active:scale-95 md:px-8 md:py-4 md:text-sm md:font-bold"
                      >
                        Buka Kolam
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* --- Search + Daftar Kolam --- */}
            <section className="space-y-4 md:space-y-6">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kolam..."
                  className="w-full rounded-full bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#4C9AA6]/40"
                />
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">Kolam Saya</h2>
                {/* TODO: buka modal / halaman tambah kolam */}
                <button
                  type="button"
                  onClick={() => setShowTambah(true)}
                  className="flex items-center gap-1 rounded-full bg-[#37808C] px-3.5 py-2 text-xs font-semibold text-white transition active:scale-95"
                >
                  <Plus size={14} /> Tambah
                </button>
              </div>

              <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
                {visiblePonds.map((p) => (
                  <PondCard key={p.pond_id} pond={p} fcr={p.cycle_id ? data.fcrByCycle[p.cycle_id] : undefined} />
                ))}
                {visiblePonds.length === 0 && (
                  <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                    Belum ada kolam. Tekan “+ Tambah” untuk membuat kolam pertama.
                  </p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      <BottomNav onAdd={() => setShowTambah(true)} />
      <TambahKolamSheet
        open={showTambah}
        onClose={() => setShowTambah(false)}
        onSaved={() => {
          setShowTambah(false);
          setReload((r) => r + 1); // Muat ulang data kolam
        }}
      />
    </div>
  );
}