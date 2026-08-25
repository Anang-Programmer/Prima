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
  Menu,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LogoutButton } from "@/components/LogoutButton";
import TambahKolamSheet from "@/components/tambah-kolam-sheet";
import Link from "next/link";
import { estimateSr, estimateAbw, calculateDailyFeed } from "@/lib/feed-calculator";
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
  if (doc <= 70) return { label: "Remaja", cls: "bg-sky-100 text-sky-600" };
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
  is_premium: boolean;
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
  is_premium: true,
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
    <div className={`rounded-xl p-3 shadow-sm flex flex-col justify-center ${highlight ? "bg-[#2A7B88]" : "bg-white"}`}>
      <p className={`text-[11px] md:text-xs font-medium ${highlight ? "text-white/80" : "text-slate-400"}`}>{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className={`text-[22px] md:text-2xl font-extrabold leading-none ${highlight ? "text-white" : "text-slate-800"}`}>
          {value}
        </p>
        {highlight && <CheckCircle size={18} className="text-white" strokeWidth={2.5} />}
      </div>
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
  const fcrColor = fcr != null && fcr > 1.5 ? "text-[#F2811B]" : "text-[#1C9098]";
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
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#2ABFC8]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Hari {pond.doc}</span>
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
          className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#2ABFC8] text-white shadow-lg ring-4 ring-white/70 transition active:scale-95"
        >
          <Plus size={24} />
        </button>
        <div className="grid grid-cols-4">
          {NAV.map(({ label, icon: Icon, href, active }) => (
            <a
              key={label}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#1C9098]" : "text-slate-400"
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

import { QuickActionModal, QuickActionType } from "./_components/QuickActionModal";
import { SelectPondModal } from "./_components/SelectPondModal";
import { ConfirmFeedModal } from "./_components/ConfirmFeedModal";
import { ConfirmAncoModal } from "./_components/ConfirmAncoModal";
import { buildDetail } from "@/app/kolam/[id]/_lib/derive";
import { evaluateHistoris, buildHistorisRecommendation } from "@/app/kolam/[id]/_lib/historis";

/* =========================================================
   HELPER HISTORIS QUICK ACTION
============================================================ */
async function resolveFeedAmount(cycleId: string, pondId: string) {
  const [f, s, p, c] = await Promise.all([
    supabase.from("feed_logs").select("*").eq("cycle_id", cycleId).order("date", { ascending: false }),
    supabase.from("sampling_logs").select("*").eq("cycle_id", cycleId).order("date", { ascending: true }),
    supabase.from("ponds").select("*").eq("id", pondId).single(),
    supabase.from("cycles").select("*").eq("id", cycleId).single()
  ]);
  
  if (!c.data || !p.data) return { amount: 0, brand: "Pelet", meals: 1, ancoHours: 2.25 };

  const d = buildDetail({
    pond: p.data,
    cycle: c.data,
    feeds: f.data || [],
    samps: s.data || [],
    probs: [],
    timers: [],
    logbook: []
  });
  
  const meals = Math.max(d.feed.mealsPerDay || 1, 1);
  let dailyKg = d.feed.dailyFeedKg;

  // Cek Historis
  const { data: userPonds } = await supabase.from("ponds").select("id, area_m2").eq("user_id", p.data.user_id);
  const pondIds = (userPonds ?? []).map((x: any) => x.id);
  const pondAreaById = new Map<string, number>((userPonds ?? []).map((x: any) => [x.id, Number(x.area_m2)]));
  
  let probMl = d.prob.doseMl;
  if (pondIds.length > 0) {
    const { data: pastCycles } = await supabase.from("cycles").select("*").in("pond_id", pondIds).eq("status", "Selesai");
    // FCR Max kita set default 3 untuk sinkronisasi dengan halaman detail kolam saat ini
    const { matched } = evaluateHistoris(c.data, p.data, pastCycles ?? [], pondAreaById, 3);
    if (matched) {
      const docNow = Math.floor((Date.now() - new Date(c.data.start_date).getTime()) / 86400000);
      const [mf, mp] = await Promise.all([
        supabase.from("feed_logs").select("date, feed_amount_kg").eq("cycle_id", matched.id),
        supabase.from("probiotic_logs").select("amount_ml").eq("cycle_id", matched.id)
      ]);
      const rec = buildHistorisRecommendation(matched, docNow, mf.data ?? [], mp.data ?? []);
      if (rec.feedKg != null) dailyKg = rec.feedKg;
      if (rec.probMl != null) probMl = rec.probMl;
    }
  }

  return { 
    amount: dailyKg / meals,
    brand: d.feed.brand || "Pelet",
    meals,
    ancoHours: d.feed.ancoIntervalHours || 2.25,
    probMl,
    probMethod: d.prob.method,
    probFreq: d.prob.frequencyPerWeek
  };
}

/* =========================================================
   HALAMAN DASHBOARD
============================================================ */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("Semua");
  const [showFilter, setShowFilter] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [showTambah, setShowTambah] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [communityNotifs, setCommunityNotifs] = useState<any[]>([]);

  const unreadNotifsCount = communityNotifs.filter(n => !n.is_read).length;

  // Quick Actions States
  const [activeModal, setActiveModal] = useState<"quick_action" | "select_pond" | "anco_popup" | "confirm_feed" | null>(null);
  const [selectedAction, setSelectedAction] = useState<QuickActionType | null>(null);
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  const [confirmFeedCycleId, setConfirmFeedCycleId] = useState<string | null>(null);
  const [confirmFeedAmount, setConfirmFeedAmount] = useState<number>(0);
  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  /* tick countdown tiap 1 detik */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchConfirmFeedAmount = async (cycleId: string, pondId: string) => {
    setIsLoadingConfirm(true);
    try {
      const res = await resolveFeedAmount(cycleId, pondId);
      setConfirmFeedAmount(res.amount);
    } catch(e) {
      console.error(e);
      setConfirmFeedAmount(0);
    } finally {
      setIsLoadingConfirm(false);
      setActiveModal("confirm_feed");
    }
  };

  const handleExecuteQuickAction = async (cycleIds: string[], ancoResultOverride?: string) => {
    if (!selectedAction || cycleIds.length === 0) return;

    // Khusus Cek Anco, minta result dulu jika belum ada
    if (selectedAction === "Cek Anco" && !ancoResultOverride) {
      setSelectedCycles(cycleIds);
      setActiveModal("anco_popup");
      return;
    }

    setIsExecutingAction(true);

    try {
      const actionTime = Date.now();

      for (const cycleId of cycleIds) {
        const pondOpt = data?.ponds.find(p => p.cycle_id === cycleId);
        if (!pondOpt) continue;

        // Tutup timer lama
        await supabase
          .from("active_timers")
          .update({ is_completed: true })
          .eq("pond_id", pondOpt.pond_id)
          .eq("type", selectedAction)
          .eq("is_completed", false);

        if (selectedAction === "Pakan") {
          // Tutup juga timer anco yang lama jika ada
          await supabase
            .from("active_timers")
            .update({ is_completed: true })
            .eq("pond_id", pondOpt.pond_id)
            .eq("type", "Cek Anco")
            .eq("is_completed", false);

          // Fetch full data needed to calculate exact feed via helper
          const res = await resolveFeedAmount(cycleId, pondOpt.pond_id);
          const { amount, brand, meals, ancoHours } = res;

          const feedIntervalMs = (24 / meals) * 60 * 60 * 1000;
          const ancoIntervalMs = (ancoHours || 2.25) * 60 * 60 * 1000;

          await supabase.from("feed_logs").insert({
              cycle_id: cycleId,
              date: new Date(actionTime).toISOString(),
              feed_amount_kg: amount,
              feed_type: brand,
              anco_result: "Belum Dicek",
              notes: "Aksi Cepat Pakan (Dashboard)"
            });

            await supabase.from("active_timers").insert({
              pond_id: pondOpt.pond_id, type: "Pakan",
              due_time: new Date(actionTime + feedIntervalMs).toISOString(),
            });
            await supabase.from("active_timers").insert({
              pond_id: pondOpt.pond_id, type: "Cek Anco",
              due_time: new Date(actionTime + ancoIntervalMs).toISOString(),
            });
        } else if (selectedAction === "Probiotik") {
          const res = await resolveFeedAmount(cycleId, pondOpt.pond_id);
          const { probMl, probMethod, probFreq } = res;
          const probIntervalMs = (7 / Math.max(probFreq || 2, 1)) * 24 * 60 * 60 * 1000;
          await supabase.from("probiotic_logs").insert({
            cycle_id: cycleId,
            date: new Date(actionTime).toISOString(),
            dose_ml: probMl || 0,
            method: probMethod || "Ke Air",
            notes: "Aksi Cepat Probiotik (Dashboard)"
          });
          await supabase.from("active_timers").insert({
            pond_id: pondOpt.pond_id, type: "Probiotik",
            due_time: new Date(actionTime + probIntervalMs).toISOString(),
          });
        } else if (selectedAction === "Cek Anco") {
          // Update last feed log with anco result
          const { data: lastFeed } = await supabase
            .from("feed_logs").select("id, notes").eq("cycle_id", cycleId)
            .order("date", { ascending: false }).limit(1).maybeSingle();

          if (lastFeed) {
            const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            const checkEntry = `[ANCO:${timeStr}:${ancoResultOverride}]`;
            const currentNotes = lastFeed.notes || "";
            const updatedNotes = currentNotes ? currentNotes + " " + checkEntry : checkEntry;

            await supabase.from("feed_logs").update({ anco_result: ancoResultOverride, notes: updatedNotes }).eq("id", lastFeed.id);
          }

          // Schedule next Anco check if still within feed cycle
          const [pResp, cResp] = await Promise.all([
            supabase.from("ponds").select("*").eq("id", pondOpt.pond_id).single(),
            supabase.from("cycles").select("*").eq("id", cycleId).single()
          ]);
          
          if (cResp.data && pResp.data) {
            const d = buildDetail({
              pond: pResp.data, cycle: cResp.data, feeds: [], samps: [], probs: [], timers: [], logbook: []
            });
            const ancoIntervalMs = (d.feed.ancoIntervalHours || 2.25) * 60 * 60 * 1000;
            const nextAncoDue = new Date(actionTime + ancoIntervalMs);
            
            const { data: pakanTimer } = await supabase
              .from("active_timers")
              .select("due_time")
              .eq("pond_id", pondOpt.pond_id)
              .eq("type", "Pakan")
              .eq("is_completed", false)
              .maybeSingle();
              
            let shouldSchedule = true;
            if (pakanTimer && pakanTimer.due_time) {
              const pakanDue = new Date(pakanTimer.due_time).getTime();
              // If next Anco due is at or after the next Pakan due, don't schedule it
              if (nextAncoDue.getTime() >= pakanDue) {
                shouldSchedule = false;
              }
            }
            
            if (shouldSchedule) {
              await supabase.from("active_timers").insert({
                pond_id: pondOpt.pond_id, type: "Cek Anco",
                due_time: nextAncoDue.toISOString(),
              });
            }
          }
        }
      }

      setActiveModal(null);
      setSelectedAction(null);
      setReload(r => r + 1); // Refresh dashboard data
    } catch (e: any) {
      console.error("Gagal mengeksekusi quick action:", e);
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsExecutingAction(false);
    }
  };

  /* ambil data dari Supabase */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("not-logged-in");

        const [{ data: profile }, { data: ponds }, { data: notifs }] = await Promise.all([
          supabase.from("profiles").select("full_name, first_name, last_name, is_premium").eq("id", user.id).maybeSingle(),
          supabase.from("v_pond_dashboard").select("*").eq("user_id", user.id).eq("pond_status", "Aktif"),
          supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
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

          // 1. Populate SR from sampling logs
          (samples ?? []).forEach((s: any) => {
            if (!(s.cycle_id in srByCycle) && s.estimated_sr_pct != null)
              srByCycle[s.cycle_id] = Number(s.estimated_sr_pct);
          });
          
          // 2. Populate SR fallbacks
          rows.forEach((p) => {
            if (p.cycle_id && !(p.cycle_id in srByCycle)) {
              srByCycle[p.cycle_id] = estimateSr(Number(p.doc || 0));
            }
          });

          // 3. Calculate FCR with smoothing logic
          rows.forEach((p) => {
            if (!p.cycle_id) return;
            const doc = Number(p.doc || 0);
            const sr = srByCycle[p.cycle_id] ?? estimateSr(doc);
            const abw = Number(p.current_abw_gram) > 0 ? Number(p.current_abw_gram) : estimateAbw(doc);
            
            const calc = calculateDailyFeed(doc, Number(p.initial_shrimp_count || 0), Number(p.area_m2 || 0), abw, sr);
            const biomass = Number(p.current_biomass_kg) > 0 ? Number(p.current_biomass_kg) : calc.biomassKg;
            
            const totalF = totalFeed[p.cycle_id] ?? 0;
            let fcr = biomass > 0 ? totalF / biomass : 0;
            
            // Penyesuaian/Penghalusan FCR untuk UI
            if (doc < 90 && fcr > 1.4 && totalF > 0) {
              fcr = 1.15 + (fcr - 1.15) * (doc / 90);
            }
            
            fcrByCycle[p.cycle_id] = round2(fcr);
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

          setCommunityNotifs(notifs ?? []);

          let finalPonds = rows.map((p) => ({
            pond_id: p.pond_id,
            pond_name: p.pond_name,
            area_m2: Number(p.area_m2),
            doc: Number(p.doc),
            cycle_id: p.cycle_id,
            current_biomass_kg: Number(p.current_biomass_kg),
            initial_shrimp_count: p.initial_shrimp_count,
          }));

          if (!profile?.is_premium && finalPonds.length > 1) {
            finalPonds = finalPonds.slice(0, 1);
          }

          setData({
            fullName: displayFullName,
            is_premium: profile?.is_premium || false,
            ponds: finalPonds,
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

  const dueAlarms = useMemo(() => {
    if (!data) return [];
    const notifs: { pond: any; timer: Timer }[] = [];
    data.timers.forEach(t => {
      if (new Date(t.due_time).getTime() <= now) {
        const pond = data.ponds.find(p => p.pond_id === t.pond_id);
        if (pond) notifs.push({ pond, timer: t });
      }
    });
    return notifs.sort((a, b) => new Date(a.timer.due_time).getTime() - new Date(b.timer.due_time).getTime());
  }, [data, now]);

  const visiblePonds = useMemo(() => {
    if (!data) return [];
    let ponds = data.ponds;
    
    // Filter by stage
    if (stageFilter !== "Semua") {
      ponds = ponds.filter(p => (p.stage || stageOf(p.doc).label) === stageFilter);
    }
    
    // Filter by query
    const q = query.trim().toLowerCase();
    return q ? ponds.filter((p) => p.pond_name.toLowerCase().includes(q)) : ponds;
  }, [data, query, stageFilter]);

  /* tandai timer selesai (TODO: arahkan ke form cek anco / beri pakan) */
  async function handleTimerAction(t?: Timer) {
    if (!t || isDemo) return;
    await supabase.from("active_timers").update({ is_completed: true }).eq("id", t.id);
    setReload((r) => r + 1);
  }

  if (!data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F5F7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" />
      </div>
    );

  return (
    <div className="min-h-screen md:h-screen md:flex bg-[#F2F5F7] text-slate-800 md:overflow-hidden">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:bg-white md:shadow-xl md:z-20 md:border-r md:border-slate-100">
        {/* <div className="px-8 py-8 flex items-center justify-center border-b border-slate-50">
          <Image src="/logo.png" alt="PRIMA Logo" width={140} height={48} className="h-10 w-auto object-contain" priority />
        </div> */}
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
            {/* <div className="flex items-center justify-between md:hidden">
              <div className="flex items-center text-white">
                <Image src="/logo.png" alt="PRIMA Logo" width={120} height={40} className="h-10 w-auto object-contain" priority />
              </div>
            </div> */}

            <div className="mt-5 md:mt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start justify-between md:block">
                <div>
                  <p className="text-xs text-white/80 md:text-sm">Selamat datang</p>
                  <h1 className="text-xl font-extrabold text-white md:text-3xl">{data.fullName}</h1>
                </div>
                <div className="flex items-center gap-1 md:hidden relative">
                  <Link href="/notifikasi" className="relative rounded-full p-2 text-white transition hover:bg-white/10">
                    <Bell size={20} />
                    {(dueAlarms.length + unreadNotifsCount) > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:gap-4">
                  <div className="md:w-36"><StatCard label="Total Kolam" value={String(stats.totalKolam)} /></div>
                  <div className="md:w-36"><StatCard label="SR Rata-rata" value={`${stats.sr}%`} /></div>
                  <div className="md:w-36"><StatCard label="FCR Rata-rata" value={stats.fcr.toFixed(2)} highlight /></div>
                </div>
                <div className="hidden md:block relative">
                  <Link href="/notifikasi" className="flex rounded-full p-3 text-white transition hover:bg-white/20 items-center justify-center bg-white/10 relative">
                    <Bell size={24} />
                    {(dueAlarms.length + unreadNotifsCount) > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse border-2 border-[#74B6BE]" />}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {isDemo && (
            <p className="mx-4 mt-4 rounded-lg bg-amber-100 px-4 py-3 text-xs text-amber-700 md:mx-10 shadow-sm border border-amber-200">
              Mode pratinjau: menampilkan data contoh sesuai desain. Login untuk melihat data asli.
            </p>
          )}

          {/* ================= KONTEN ================= */}
          <main className="space-y-4 px-4 pb-40 pt-4 md:space-y-8 md:px-10 md:pb-24 md:pt-8">
            {/* --- Kartu Alarm --- */}
            {alarms.length > 0 && (
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 snap-x md:mx-0 md:px-0 md:flex md:flex-row md:flex-wrap md:gap-4 md:overflow-visible">
                {alarms.map((alarm) => (
                  <section key={alarm.pond.pond_id} className="min-w-[85vw] snap-center rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between border border-slate-100 md:min-w-0 md:flex-none md:w-[350px]">
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-red-500">
                          <AlertTriangle size={14} />
                          <span className="text-[10px] font-semibold">Alarm Kolam</span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-extrabold text-slate-800">{alarm.pond.pond_name}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{alarm.pond.stage || "Remaja"}</p>
                      </div>

                      <div className="flex flex-col gap-2 text-right">
                        {/* Timer Cek Anco */}
                        {(() => {
                          const msLeft = alarm.anco?.due_time ? new Date(alarm.anco.due_time).getTime() - now : null;
                          const isLocked = msLeft !== null && msLeft > 30 * 60 * 1000;
                          return (
                            <div className={`flex overflow-hidden rounded-full ${
                              msLeft !== null && msLeft <= 0
                                ? "ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse"
                                : ""
                            }`}>
                              <div className={`${isLocked ? "bg-amber-100" : "bg-[#F9D9CE]"} py-1.5 text-[10px] font-semibold text-slate-700 w-[75px] text-center`}>Cek Anco</div>
                              <div className={`${isLocked ? "bg-amber-500" : "bg-[#F26B4E]"} py-1.5 text-[10px] font-bold text-white tabular-nums w-[65px] text-center`}>{msLeft !== null ? fmtMs(msLeft) : "--:--:--"}</div>
                            </div>
                          );
                        })()}

                        {/* Timer Beri Pakan */}
                        {(() => {
                          const msLeft = alarm.pakan?.due_time ? new Date(alarm.pakan.due_time).getTime() - now : null;
                          const isLocked = msLeft !== null && msLeft > 30 * 60 * 1000;
                          return (
                            <div className={`flex overflow-hidden rounded-full ${
                              msLeft !== null && msLeft <= 0
                                ? "ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse"
                                : ""
                            }`}>
                              <div className={`${isLocked ? "bg-amber-100" : "bg-[#F9D9CE]"} py-1.5 text-[10px] font-semibold text-slate-700 w-[75px] text-center`}>Beri Pakan</div>
                              <div className={`${isLocked ? "bg-amber-500" : "bg-[#F26B4E]"} py-1.5 text-[10px] font-bold text-white tabular-nums w-[65px] text-center`}>{msLeft !== null ? fmtMs(msLeft) : "--:--:--"}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {(() => {
                      const isLocked = (alarm.earliest - now) > 30 * 60 * 1000;
                      return (
                        <button
                          type="button"
                          onClick={() => { if (!isLocked) router.push(`/kolam/${alarm.pond.pond_id}`) }}
                          disabled={isLocked}
                          className={`flex items-center justify-between px-4 py-3 text-xs font-bold transition ${
                            isLocked 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-[#A5E3E8] text-[#2A7B88] active:bg-[#91D0D5]'
                          }`}
                        >
                          {isLocked ? "Belum Waktunya" : "Menuju Kolam"}
                          {!isLocked && <span className="text-base leading-none">→</span>}
                        </button>
                      );
                    })()}
                  </section>
                ))}
              </div>
            )}

            {/* --- Search + Daftar Kolam --- */}
            <section className="space-y-4 md:space-y-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari kolam..."
                    className="w-full rounded-full bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#2ABFC8]/40"
                  />
                </div>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowFilter(!showFilter)}
                    className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#EAEFEF] text-slate-800 transition active:scale-95 shrink-0"
                  >
                    <Menu size={20} />
                  </button>

                  {/* Filter Dropdown */}
                  {showFilter && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-100 z-50">
                      <p className="mb-2 px-3 pt-1 text-xs font-bold text-slate-400">Filter Tahap</p>
                      {["Semua", "Benur", "Remaja", "Pembesaran"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setStageFilter(f);
                            setShowFilter(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                            stageFilter === f
                              ? "bg-[#E3F1F2] text-[#2F6E7B]"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {f === "Semua" ? "Semua Tahap" : f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">Kolam Saya</h2>
                {/* TODO: buka modal / halaman tambah kolam */}
                <button
                  type="button"
                  onClick={() => {
                    if (data && !data.is_premium && data.ponds.length >= 1) {
                      setShowUpgradeModal(true);
                    } else {
                      setShowTambah(true);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#1FB4B2] bg-white px-4 py-1.5 text-xs font-semibold text-[#1FB4B2] transition active:bg-slate-50"
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

      <BottomNav onAdd={() => setActiveModal("quick_action")} />

      <QuickActionModal
        open={activeModal === "quick_action"}
        onClose={() => setActiveModal(null)}
        onSelectAction={(action) => {
          setSelectedAction(action);
          setActiveModal("select_pond");
        }}
      />

      <SelectPondModal
        open={activeModal === "select_pond"}
        action={selectedAction}
        ponds={data?.ponds.map(p => ({ pond_id: p.pond_id, pond_name: p.pond_name, cycle_id: p.cycle_id, doc: p.doc })) || []}
        timers={data?.timers || []}
        now={now}
        onClose={() => setActiveModal(null)}
        onExecute={(cycleIds) => {
          if (selectedAction === "Pakan" && cycleIds.length === 1) {
            const pondId = data?.ponds.find(p => p.cycle_id === cycleIds[0])?.pond_id;
            if (pondId) {
              setConfirmFeedCycleId(cycleIds[0]);
              fetchConfirmFeedAmount(cycleIds[0], pondId);
            } else {
              handleExecuteQuickAction(cycleIds);
            }
          } else {
            handleExecuteQuickAction(cycleIds);
          }
        }}
        isExecuting={isExecutingAction || isLoadingConfirm}
      />

      {/* Modal Konfirmasi Pakan Khusus */}
      {confirmFeedCycleId && (
        <ConfirmFeedModal
          open={activeModal === "confirm_feed"}
          pondName={data?.ponds.find(p => p.cycle_id === confirmFeedCycleId)?.pond_name || ""}
          pondId={data?.ponds.find(p => p.cycle_id === confirmFeedCycleId)?.pond_id || ""}
          feedAmount={confirmFeedAmount}
          onClose={() => setActiveModal("select_pond")}
          onConfirm={() => {
            handleExecuteQuickAction([confirmFeedCycleId]);
            setActiveModal(null);
            setConfirmFeedCycleId(null);
          }}
          isExecuting={isExecutingAction}
        />
      )}

      {/* Pop-up Anco khusus Quick Action */}
      <ConfirmAncoModal
        open={activeModal === "anco_popup"}
        pondName={
          selectedCycles.length === 1 
            ? data?.ponds.find(p => p.cycle_id === selectedCycles[0])?.pond_name || "Kolam"
            : `${selectedCycles.length} Kolam`
        }
        onClose={() => setActiveModal("select_pond")}
        onConfirm={(result) => {
          handleExecuteQuickAction(selectedCycles, result);
        }}
        isExecuting={isExecutingAction}
      />

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Tutup" onClick={() => setShowUpgradeModal(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E3F1F2]">
                <AlertTriangle className="text-[#2F6E7B]" size={28} />
              </div>
            </div>
            <h3 className="text-center text-[18px] font-bold text-slate-800">Batas Kolam Tercapai</h3>
            <p className="mt-2 text-center text-sm text-slate-600 leading-relaxed">
              Akun <span className="font-bold text-slate-700">Gratis</span> maksimal hanya bisa memiliki 1 kolam. Upgrade ke <span className="font-bold text-[#2ABFC8]">Prime</span> untuk menambah kolam tanpa batas dan fitur premium lainnya!
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={() => router.push("/profil")}
                className="w-full rounded-[10px] bg-[#2ABFC8] py-3.5 text-sm font-bold text-white transition active:scale-95"
              >
                Lihat Paket Prime
              </button>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full rounded-[10px] py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 active:scale-95"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

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