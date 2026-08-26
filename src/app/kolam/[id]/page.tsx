"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProbioticSchedule, nextFeedTime, calculateDailyFeed, estimateAbw } from "@/lib/feed-calculator";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { fmt1 } from "./_lib/constants";
import { buildDetail } from "./_lib/derive";
import { evaluateHistoris, buildHistorisRecommendation, makeSniVerdict, type HistorisVerdict } from "./_lib/historis";
import { DetailHeader } from "./_components/DetailHeader";
import { DocCard } from "./_components/DocCard";
import { FeedCard } from "./_components/FeedCard";
import { FeedEditForm } from "./_components/FeedEditForm";
import { ProbioticCard } from "./_components/ProbioticCard";
import { ProbioticEditForm } from "./_components/ProbioticEditForm";
import { AIChatPanel } from "./_components/AIChatPanel";
import { DebugTimePanel } from "./_components/DebugTimePanel";
import { AncoModal } from "./_components/AncoModal";
import LogBookTab from "./_components/LogBookTab";
import ProjectionTab from "./_components/ProjectionTab";
import MonitoringTab from "./_components/MonitoringTab";
import EditPondSheet from "./_components/EditPondSheet";
import AddFeedSheet from "./_components/AddFeedSheet";
import EndCycleSheet from "./_components/EndCycleSheet";
import ConsultAISheet from "./_components/ConsultAISheet";
import EditAbwSheet from "./_components/EditAbwSheet";
import StartCycleSheet from "./_components/StartCycleSheet";
import { toast } from "sonner";

export default function DetailKolamPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState("Pakan");
  const [sheet, setSheet] = useState<null | string>(null);
  const [busy, setBusy] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState<string | null>(null);
  const [debugFcrLimit, setDebugFcrLimit] = useState(3); // FCR threshold for debugging

  // form states
  const [pondForm, setPondForm] = useState<any>({});
  const [logForm, setLogForm] = useState<any>({});
  const [endForm, setEndForm] = useState<any>({});

  // ======== LOGIKA EDIT PAKAN/PROBIOTIK (dari KolamDetailClient.tsx) ========
  const [editMode, setEditMode] = useState<"pakan" | "prob" | null>(null);
  // Edit values pakan
  const [editFeedValues, setEditFeedValues] = useState({ dailyFeedKg: 0, _rawDailyFeedKg: "", mealsPerDay: 0, ancoHours: 2.25, feedBrand: "" });
  // Edit values probiotik
  const [editProbValues, setEditProbValues] = useState({ doseMl: 0, frequencyPerWeek: 2, method: "Ke Air" });
  // Alert SNI
  const [showSNIAlert, setShowSNIAlert] = useState(false);
  const [deviations, setDeviations] = useState<any>({});
  // AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Konsultasi AI bottom sheet (rule-based, tetap dipertahankan)
  const [chat, setChat] = useState<{ me?: boolean; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Countdown live: jam sekarang, tick tiap detik
  const [now, setNow] = useState(() => Date.now());
  // Modal Cek Anco
  const [ancoModal, setAncoModal] = useState<null | { timerId: string }>(null);
  const [ancoResult, setAncoResult] = useState("Habis");
  const [abwInput, setAbwInput] = useState("");

  useEffect(() => {
    (async () => {
      const { data: pond } = await supabase.from("ponds").select("*").eq("id", id).single();
      if (!pond) return;
      const { data: cycle } = await supabase
        .from("cycles").select("*").eq("pond_id", id).eq("status", "Berjalan")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      let feeds: any[] = [], probs: any[] = [], timers: any[] = [], samps: any[] = [], logbook: any[] = [];
      if (cycle) {
        const [f, s, p, t, lb] = await Promise.all([
          supabase.from("feed_logs").select("*").eq("cycle_id", cycle.id).order("date", { ascending: false }),
          supabase.from("sampling_logs").select("*").eq("cycle_id", cycle.id).order("date", { ascending: true }),
          supabase.from("probiotic_logs").select("*").eq("cycle_id", cycle.id),
          supabase.from("active_timers").select("*").eq("pond_id", id).eq("is_completed", false).order("due_time"),
          supabase.from("v_daily_logbook").select("*").eq("cycle_id", cycle.id),
        ]);
        feeds = f.data ?? []; samps = s.data ?? []; probs = p.data ?? []; timers = t.data ?? [];
        logbook = (lb.data ?? []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // === REKOMENDASI HISTORIS (aturan tunggal di _lib/historis.ts) ===
        // Lolos SEMUA syarat mutlak -> ikut data siklus sukses.
        // Gagal SATU SAJA -> fallback total ke SNI.
        try {
          const docNow = Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000);
          const { data: userPonds } = await supabase.from("ponds").select("id, area_m2").eq("user_id", pond.user_id);
          const pondIds = (userPonds ?? []).map((p: any) => p.id);
          const pondAreaById = new Map<string, number>((userPonds ?? []).map((p: any) => [p.id, Number(p.area_m2)]));

          let verdict: HistorisVerdict = makeSniVerdict(["Belum ada data untuk dinilai."]);

          if (pondIds.length > 0) {
            const { data: pastCycles } = await supabase
              .from("cycles")
              .select("*")
              .in("pond_id", pondIds)
              .eq("status", "Selesai");

            const { matched, gagalDi } = evaluateHistoris(cycle, pond, pastCycles ?? [], pondAreaById, debugFcrLimit);

            if (matched) {
              const [mf, mp] = await Promise.all([
                supabase.from("feed_logs").select("date, feed_amount_kg").eq("cycle_id", matched.id),
                supabase.from("probiotic_logs").select("amount_ml").eq("cycle_id", matched.id),
              ]);
              const rec = buildHistorisRecommendation(matched, docNow, mf.data ?? [], mp.data ?? [], cycle?.initial_shrimp_count, matched.initial_shrimp_count);
              if (rec.feedKg == null) {
                // Lolos syarat tapi tak punya log pakan -> data historis tak lengkap -> SNI total
                verdict = makeSniVerdict([
                  ...(gagalDi.length ? gagalDi : []),
                  "Siklus lama lolos syarat tapi tidak punya log pakan. Rekomendasi kembali ke SNI.",
                ]);
              } else {
                verdict = {
                  source: "historis",
                  label: rec.label,
                  feedKg: rec.feedKg,
                  probMl: rec.probMl,
                  gagalDi: [],
                  matchedCycleId: matched.id,
                };
              }
            } else {
              verdict = makeSniVerdict(gagalDi);
            }
          }
          setHistoricalData(verdict);
        } catch (e) {
          console.warn("Cek historis gagal, fallback SNI:", e);
          setHistoricalData(null);
        }
      }
      setData({ pond, cycle, feeds, probs, timers, samps, logbook });
    })();
  }, [id, reload, debugFcrLimit]);

  const d = useMemo(() => buildDetail(data), [data]);

  const refresh = () => setReload((r) => r + 1);

  // Scroll chat ke bawah
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tick countdown tiap detik (untuk timer aktif)
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Format sisa waktu timer: "HH:MM:SS" atau "N hari M jam" bila > 24 jam.
  function formatTimeLeft(dueTime: string) {
    const diff = new Date(dueTime).getTime() - now;
    if (diff <= 0) return "Tiba waktunya!";
    const totalH = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (totalH >= 24) {
      const days = Math.floor(totalH / 24);
      return `${days} hari ${totalH % 24} jam`;
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(totalH)}:${pad(m)}:${pad(s)}`;
  }

  /* ============================== */
  /* LOGIKA EDIT + CEK SNI + AI CHAT */
  /* ============================== */

  // Mulai edit pakan ' muat nilai yang SEDANG BERLAKU (hasil modif kalau ada,
  // fallback ke rekomendasi SNI). Perbandingan SNI tetap pakai d.calc.
  function startEditPakan() {
    if (!d) return;
    // Kalau ada riwayat anco, pakai pakan yang sudah dikalibrasi anco terakhir.
    // Kalau belum pernah ada anco sama sekali, fallback ke nilai plan/SNI biasa.
    const hasAncoHistory = d.anco?.consecutiveHabis > 0 || d.anco?.latestResult !== null;
    const ancoCalibratedKg = hasAncoHistory
      ? +(d.anco.adjustedPerMealKg * d.feed.mealsPerDay).toFixed(2)
      : d.feed.dailyFeedKg;

    // Historis aktif -> form memuat angka historis (baseline yang sama dgn pengecekan deviasi)
    const histKg = historicalData?.source === "historis" && (historicalData?.feedKg ?? 0) > 0 ? (historicalData!.feedKg as number) : null;

    setEditFeedValues({
      dailyFeedKg: histKg ?? ancoCalibratedKg,
      _rawDailyFeedKg: (histKg ?? ancoCalibratedKg).toString(),
      mealsPerDay: d.feed.mealsPerDay,
      ancoHours: d.feed.ancoIntervalHours,
      feedBrand: d.feed.brand === "Pelet" ? "" : d.feed.brand,
    });
    setEditMode("pakan");
    setShowSNIAlert(false);
    setShowAIChat(false);
    setMessages([]);
  }

  // Mulai edit probiotik ' muat nilai yang sedang berlaku
  function startEditProb() {
    if (!d) return;
    // Historis aktif -> form memuat dosis historis
    const histMl = historicalData?.source === "historis" && (historicalData?.probMl ?? 0) > 0 ? (historicalData!.probMl as number) : null;
    setEditProbValues({
      doseMl: histMl ?? d.prob.doseMl,
      frequencyPerWeek: d.prob.frequencyPerWeek,
      method: d.prob.method,
    });
    setEditMode("prob");
    setShowSNIAlert(false);
    setShowAIChat(false);
    setMessages([]);
  }

  // Konfirmasi perubahan ' cek apakah menyimpang dari SNI
  function handleConfirmEdit() {
    if (!d) return;
    if (editMode === "pakan") {
      const baselineKg = historicalData?.source === "historis" && (historicalData.feedKg ?? 0) > 0 ? (historicalData.feedKg as number) : d.recommendedFeedKg;
      const refKg = Math.max(baselineKg, 0.01);
      const pakanDev = Math.abs(editFeedValues.dailyFeedKg - baselineKg) / refKg > 0.15;
      const freqDev = editFeedValues.mealsPerDay !== d.calc.mealsPerDay;
      const ancoDev = Math.abs(editFeedValues.ancoHours - d.calc.ancoIntervalHours) > 0.3;

      if (pakanDev || freqDev || ancoDev) {
        setDeviations({ pakan: pakanDev, freq: freqDev, anco: ancoDev });
        setShowSNIAlert(true);
      } else {
        saveChanges(false);
      }
    } else if (editMode === "prob") {
      const baselineMl = historicalData?.source === "historis" && (historicalData.probMl ?? 0) > 0 ? (historicalData.probMl as number) : d.sched.doseMl;
      const dosisDev = Math.abs(editProbValues.doseMl - baselineMl) > 50;
      const freqDev = editProbValues.frequencyPerWeek !== d.sched.frequencyPerWeek;
      const metodeDev = editProbValues.method !== "Ke Air";

      if (dosisDev || freqDev || metodeDev) {
        setDeviations({ dosis: dosisDev, freq: freqDev, metode: metodeDev });
        setShowSNIAlert(true);
      } else {
        saveChanges(false);
      }
    }
  }

  // Normalisasi metode agar selalu lolos CHECK constraint DB ('Ke Air' | 'Campur Pakan')
  function normalizeMethod(m: string | undefined): "Ke Air" | "Campur Pakan" {
    if (!m) return "Ke Air";
    const t = m.toLowerCase();
    if (t.includes("pakan") || t.includes("campur")) return "Campur Pakan";
    return "Ke Air";
  }

  // Ambil kesepakatan (DEAL_DATA) dari balasan AI terakhir, jika ada.
  function extractDeal(): any | null {
    if (messages.length === 0) return null;
    // Cari dari pesan TERAKHIR ke PERTAMA — ambil yang pertama punya DEAL_DATA.
    // Ini mengatasi kasus user lanjut chat setelah AI output deal.
    for (const m of [...messages].reverse()) {
      if (m.role !== "assistant") continue;

      // Sanitasi content sebelum regex: hapus code blocks, markdown, unicode aneh
      const cleaned = m.content
        .replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1')  // Strip code blocks
        .replace(/[\u200B-\u200D\uFEFF]/g, '')           // Zero-width chars
        .replace(/\*\*/g, '').replace(/\*/g, '');          // Bold/italic

      // Coba beberapa pattern — case-insensitive, dengan/tanpa bracket
      const match = cleaned.match(/\[?DEAL_DATA:\s*(\{[^}]*\})\]?/i)
        || cleaned.match(/\[?DEAL_DATA:\s*(\{[\s\S]*?\})\]?/i)
        || cleaned.match(/DEAL.DATA[:\s]+(\{[^}]*\})/i);
      if (!match) continue;
      try {
        // Sanitasi JSON:
        // 1. Koma desimal Indonesia (0,45 -> 0.45)
        // 2. Placeholder <...> yang lupa diganti AI -> ganti 0
        // 3. Trailing comma sebelum }
        // 4. Single quotes -> double quotes
        let raw = match[1]
          .replace(/(\d),(\d)/g, "$1.$2")
          .replace(/<[^>]*>/g, "0")
          .replace(/,\s*}/g, "}")
          .replace(/'/g, '"');
        const parsed = JSON.parse(raw);
        // AI kadang juga mengembalikan nilai sebagai string ("0.30"), konversi ke number.
        const result: any = {};
        for (const [k, v] of Object.entries(parsed)) {
          const n = Number(v);
          result[k] = Number.isFinite(n) ? n : v;
        }
        console.log("✅ DEAL_DATA berhasil diekstrak:", result);
        return result;
      } catch (e) {
        console.error("Gagal parse DEAL_DATA", e, "raw:", match[1]);
        // Lanjut cari di pesan sebelumnya
        continue;
      }
    }
    console.warn("⚠️ extractDeal: Tidak ditemukan DEAL_DATA di semua pesan assistant.");
    return null;
  }

  // Simpan perubahan ke database. withAi=true ' pakai angka kesepakatan AI bila ada.
  async function saveChanges(withAi: boolean) {
    if (!d?.cycle) return;
    setBusy(true);
    setInsertError(null);

    const deal = withAi ? extractDeal() : null;
    console.log("🔍 saveChanges - withAi:", withAi, "deal:", deal, "messages count:", messages.length);

    let update: Record<string, any>;
    if (editMode === "pakan") {
      const rawPakan = deal?.pakan ?? editFeedValues.dailyFeedKg;
      const pakanStr = typeof rawPakan === 'string' ? rawPakan.replace(',', '.') : rawPakan;
      const finalKg = Number(pakanStr);
      const baseKgToSave = +(finalKg / (d.anco?.multiplier || 1)).toFixed(3);

      const feed = {
        dailyFeedKg: baseKgToSave,
        mealsPerDay: Number(deal?.freq ?? editFeedValues.mealsPerDay),
        ancoIntervalHours: Number(deal?.anco ?? editFeedValues.ancoHours),
        brand: editFeedValues.feedBrand || d.feed.brand || "Pelet",
      };
      // Validasi: cegah menyimpan nilai nol/negatif yang bikin "0 kg / 0x".
      if (!(feed.dailyFeedKg > 0) || !(feed.mealsPerDay > 0) || !(feed.ancoIntervalHours > 0)) {
        setBusy(false);
        setInsertError("Nilai pakan tidak valid: jumlah, frekuensi, dan cek anco harus lebih dari 0.");
        return;
      }
      update = {
        plan: { ...(d.plan ?? {}), feed },
        feed_brand: feed.brand,
      };
    } else {
      const prob = {
        doseMl: Number(deal?.dosis ?? editProbValues.doseMl),
        frequencyPerWeek: Number(deal?.freq ?? editProbValues.frequencyPerWeek),
        method: normalizeMethod(deal?.metode ?? editProbValues.method),
        brand: d.prob.brand,
      };
      if (!(prob.doseMl > 0) || !(prob.frequencyPerWeek > 0)) {
        setBusy(false);
        setInsertError("Nilai probiotik tidak valid: dosis dan frekuensi harus lebih dari 0.");
        return;
      }
      update = { plan: { ...(d.plan ?? {}), prob } };
    }

    const { error } = await supabase.from("cycles").update(update).eq("id", d.cycle.id);
    setBusy(false);

    if (error) {
      console.error("Gagal simpan perubahan:", error);
      setInsertError("Gagal menyimpan: " + error.message);
      return;
    }

    setEditMode(null);
    setShowSNIAlert(false);
    setShowAIChat(false);
    setMessages([]);
    refresh();
  }

  // Mulai konsultasi AI setelah alert SNI
  async function startAIConsultation() {
    setShowSNIAlert(false);
    setShowAIChat(true);

    let openingMsg = "";
    if (editMode === "pakan") {
      const devText: string[] = [];
      if (deviations.pakan) {
        const histActive = historicalData?.source === "historis";
        const lapanganKg = histActive && (historicalData?.feedKg ?? 0) > 0
          ? historicalData.feedKg
          : d.trueRecommendedFeedKg;
        devText.push(`total pakan menjadi ${editFeedValues.dailyFeedKg}kg (catatan: rekomendasi lapangan saat ini ${lapanganKg}kg, sedangkan SNI murni ${d.calc.dailyFeedKg}kg)`);
      }
      if (deviations.freq) devText.push(`frekuensi pakan menjadi ${editFeedValues.mealsPerDay}x/hari (standar SNI: ${d.calc.mealsPerDay}x)`);
      if (deviations.anco) devText.push(`cek anco tiap ${editFeedValues.ancoHours} jam (standar SNI: ${d.calc.ancoIntervalHours} jam)`);
      openingMsg = `Halo Pak. Saya perhatikan Bapak ingin mengubah ${devText.join(", ")}. Ada pertimbangan atau keluhan khusus di kolam yang mendasari keputusan ini?`;
    } else {
      const devText: string[] = [];
      if (deviations.dosis) devText.push(`dosis menjadi ${editProbValues.doseMl}ml (standar: ${d.sched.doseMl}ml)`);
      if (deviations.freq) devText.push(`frekuensi menjadi ${editProbValues.frequencyPerWeek}x/minggu (standar: ${d.sched.frequencyPerWeek}x)`);
      if (deviations.metode) devText.push(`metode menjadi ${editProbValues.method} (standar: Ke Air)`);
      openingMsg = `Halo Pak. Saya perhatikan Bapak ingin mengubah jadwal probiotik: ${devText.join(", ")}. Hal ini berbeda dari standar anjuran. Ada kendala air kah, Pak?`;
    }

    setMessages([{ role: "assistant", content: openingMsg }]);
  }

  // Kirim pesan ke AI
  async function sendToAI(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMsg.trim() || isAiTyping) return;

    const newMessages = [...messages, { role: "user" as const, content: inputMsg }];
    setMessages(newMessages);
    setInputMsg("");
    setIsAiTyping(true);

    try {
      const histActive = historicalData?.source === "historis";
      const baselineFeedKg = histActive && (historicalData?.feedKg ?? 0) > 0 ? (historicalData!.feedKg as number) : d.calc.dailyFeedKg;
      const baselineDoseMl = histActive && (historicalData?.probMl ?? 0) > 0 ? (historicalData!.probMl as number) : d.sched.doseMl;
      const baselineSource: "historis" | "sni" = histActive ? "historis" : "sni";

      const res = await fetch("/api/ai-konsultasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editMode === "prob" ? "probiotik" : "pakan",
          baselineSource,
          messages: newMessages,
          pondContext: {
            doc: d.doc,
            population: d.cycle?.initial_shrimp_count,
            area: d.pond.area_m2,
            abw: d.abw,
            biomass: d.biomass,
          },
          ancoContext: {
            latestResult: d.anco?.latestResult ?? null,
            multiplier: d.anco?.multiplier ?? 1,
            consecutiveHabis: d.anco?.consecutiveHabis ?? 0,
            adjustedDailyFeedKg: d.trueRecommendedFeedKg,
            last5Results: (d.feeds || [])
              .filter((f: any) => f.anco_result && f.anco_result !== "Belum Dicek")
              .slice(0, 5)
              .map((f: any) => f.anco_result),
          },
          sniValues:
            editMode === "pakan"
              ? {
                  dailyFeedKg: baselineFeedKg,
                mealsPerDay: d.calc.mealsPerDay,
                feedingRate: d.calc.feedingRatePct,
                ancoHours: d.calc.ancoIntervalHours,
              }
              : {
                  dosis: `${baselineDoseMl}ml`,
                frekuensi: `${d.sched.frequencyPerWeek}x per minggu`,
                metode: "Ke Air",
              },
          // Bentuk userValues DISESUAIKAN dgn key yang dibaca API route.
          userValues:
            editMode === "pakan"
              ? {
                dailyFeedKg: editFeedValues.dailyFeedKg,
                mealsPerDay: editFeedValues.mealsPerDay,
                ancoHours: editFeedValues.ancoHours,
              }
              : {
                dosis: editProbValues.doseMl,
                freq: editProbValues.frequencyPerWeek,
                metode: editProbValues.method,
              },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Maaf Pak, koneksi saya sedang terganggu. Coba lagi nanti ya." }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Maaf Pak, terjadi kesalahan. Coba lagi nanti ya." }]);
    } finally {
      setIsAiTyping(false);
    }
  }


  /* ---------- TIMERS & PENCATATAN ---------- */

  // Interval antar sesi pakan (ms), berdasarkan frekuensi harian.
  function feedIntervalMs() {
    const safeMeals = Math.max(d.feed.mealsPerDay || 1, 1);
    return (24 / safeMeals) * 60 * 60 * 1000;
  }
  // Interval cek anco (ms) -- ancoIntervalHours bisa desimal (mis. 2.25 jam).
  function ancoIntervalMs() {
    return d.feed.ancoIntervalHours * 60 * 60 * 1000;
  }
  // Interval antar aplikasi probiotik (ms), berdasarkan frekuensi mingguan.
  function probIntervalMs() {
    const safeFreq = Math.max(d.prob.frequencyPerWeek || 1, 1);
    return (7 / safeFreq) * 24 * 60 * 60 * 1000;
  }

  // Catat 1 sesi pakan + jadwalkan timer pakan & cek anco berikutnya.
  // baseTime = titik waktu pencatatan (default sekarang; dipakai simulasi debug).
  async function recordFeed(baseTime: number, note: string, scheduleNext = true) {
    const safeMeals = Math.max(d.feed.mealsPerDay || 1, 1);

    const logRes = await supabase.from("feed_logs").insert({
      cycle_id: d.cycle.id,
      date: new Date(baseTime).toISOString(),
      feed_amount_kg: +(d.feed.dailyFeedKg / safeMeals).toFixed(3),
      feed_type: d.feed.brand || "Pelet",
      anco_result: "Belum Dicek",
      notes: note,
    });
    if (logRes.error) throw new Error("Log Pakan: " + logRes.error.message);

    if (scheduleNext) {
      const t1 = await supabase.from("active_timers").insert({
        pond_id: id, type: "Pakan",
        due_time: new Date(baseTime + feedIntervalMs()).toISOString(),
      });
      if (t1.error) throw new Error("Timer Pakan: " + t1.error.message);

      const t2 = await supabase.from("active_timers").insert({
        pond_id: id, type: "Cek Anco",
        due_time: new Date(baseTime + ancoIntervalMs()).toISOString(),
      });
      if (t2.error) throw new Error("Timer Anco: " + t2.error.message);
    }
  }

  // Catat 1 aplikasi probiotik + jadwalkan timer probiotik berikutnya.
  async function recordProbiotic(baseTime: number, note: string, scheduleNext = true) {
    const logRes = await supabase.from("probiotic_logs").insert({
      cycle_id: d.cycle.id,
      date: new Date(baseTime).toISOString(),
      probiotic_type: d.prob.brand || "Probiotik Standar",
      amount_ml: d.prob.doseMl,
      method: normalizeMethod(d.prob.method),
      notes: note,
    });
    if (logRes.error) throw new Error("Log Probiotik: " + logRes.error.message);

    if (scheduleNext) {
      const t1 = await supabase.from("active_timers").insert({
        pond_id: id, type: "Probiotik",
        due_time: new Date(baseTime + probIntervalMs()).toISOString(),
      });
      if (t1.error) throw new Error("Timer Probiotik: " + t1.error.message);
    }
  }

  async function handleEditAbw(e: React.FormEvent) {
    e.preventDefault();
    if (!d?.cycle?.id) return;
    setBusy(true);
    const val = parseFloat(abwInput);
    if (isNaN(val) || val <= 0) {
      toast.error("ABW tidak valid");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from('cycles').update({ current_abw_gram: val }).eq('id', d.cycle.id);

    if (!error) {
      await supabase.from('sampling_logs').insert({
        cycle_id: d.cycle.id,
        doc: d.doc,
        sample_count: 10,
        total_weight_gram: val * 10,
        notes: "Update Manual via Modal Edit ABW"
      });
    }

    setBusy(false);
    if (error) {
      toast.error("Gagal menyimpan ABW: " + error.message);
    } else {
      toast.success("ABW berhasil diperbarui");
      setSheet(null);
      refresh();
    }
  }

  async function handleCatatPakan() {
    setBusy(true);
    setInsertError(null);
    try {
      await recordFeed(Date.now(), "Sistem: Otomatis via Aktifkan Countdown");
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  async function handleCatatProbiotik() {
    setBusy(true);
    setInsertError(null);
    try {
      await recordProbiotic(Date.now(), "Sistem: Otomatis via Aktifkan Countdown");
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  /* ---------- DEBUG: SIMULASI WAKTU ---------- */
  async function debugAdvance(hours: number) {
    if (!d?.cycle) return;
    setBusy(true);
    setInsertError(null);
    setDebugMsg(null);
    try {
      const shiftMs = hours * 60 * 60 * 1000;

      const { data: actives, error: readErr } = await supabase
        .from("active_timers")
        .select("*")
        .eq("pond_id", id)
        .eq("is_completed", false);
      if (readErr) throw new Error("Baca timer: " + readErr.message);

      if (!actives || actives.length === 0) {
        setDebugMsg('Tidak ada timer berjalan. Tekan "Konfirmasi & Aktifkan Peringatan" dulu untuk memulai siklus pakan/probiotik.');
        return;
      }

      for (const timer of actives) {
        const newDue = new Date(new Date(timer.due_time).getTime() - shiftMs).toISOString();
        const upd = await supabase.from("active_timers").update({ due_time: newDue }).eq("id", timer.id);
        if (upd.error) throw new Error("Geser timer: " + upd.error.message);
      }

      const nowIso = new Date().toISOString();
      const dueCount = actives.filter((t: any) => new Date(t.due_time).getTime() - shiftMs <= Date.now()).length;

      if (dueCount > 0) {
        setDebugMsg(`${dueCount} timer jatuh tempo. Konfirmasi kegiatan di kartu pakan/probiotik untuk mencatat ke Log Book.`);
      } else {
        const nearest = actives.reduce((min: any, t: any) => {
          const diff = new Date(t.due_time).getTime() - shiftMs - Date.now();
          return diff < min ? diff : min;
        }, Infinity);
        const nextH = Math.max(0, Math.round(nearest / 3600000));
        setDebugMsg(`Waktu dimajukan +${hours} jam. Timer terdekat masih ${nextH} jam lagi. Tekan lagi untuk memajukan lebih jauh.`);
      }
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  async function debugJumpDoc(targetDoc: number) {
    if (!d?.cycle) return;
    setBusy(true);
    setInsertError(null);
    setDebugMsg(null);
    try {
      const currentDoc = d.doc || 0;
      if (targetDoc === currentDoc) {
        setBusy(false);
        return;
      }

      const isBackward = targetDoc < currentDoc;
      let deletedFeeds = 0;
      let deletedSamples = 0;

      // Jika mundur, hapus SEMUA log siklus ini tanpa syarat.
      // Data simulasi di-insert dengan tanggal masa lalu, jadi cutoff berbasis waktu tidak akan bekerja.
      if (isBackward) {
        // Hapus SEMUA feed_logs siklus ini
        const resFeed = await supabase.from("feed_logs").delete().eq("cycle_id", d.cycle.id);
        if (resFeed.error) throw new Error("Gagal hapus pakan: " + resFeed.error.message);

        // Hapus SEMUA sampling_logs siklus ini
        const resSamp = await supabase.from("sampling_logs").delete().eq("cycle_id", d.cycle.id);
        if (resSamp.error) throw new Error("Gagal hapus sampling: " + resSamp.error.message);

        // Hapus SEMUA probiotic_logs siklus ini
        const resProb = await supabase.from("probiotic_logs").delete().eq("cycle_id", d.cycle.id);
        if (resProb.error) throw new Error("Gagal hapus probiotik: " + resProb.error.message);

        // Hapus SEMUA timer aktif kolam ini
        const resTimer = await supabase.from("active_timers").delete().eq("pond_id", d.pond.id);
        if (resTimer.error) throw new Error("Gagal hapus timer: " + resTimer.error.message);

        deletedFeeds = 1;
      }

      const mockFeeds = [];
      const mockSamples = [];
      const mockProbs = [];

      // Jika maju, generate logs untuk tiap hari yang dilompati
      if (!isBackward) {
        const area = Number(d.pond.area_m2);
        const pop = Number(d.cycle.initial_shrimp_count);
        let lastAbw = d.abw || estimateAbw(currentDoc);

        for (let day = currentDoc + 1; day <= targetDoc; day++) {
          const timeOfDay = Date.now() - ((targetDoc - day) * 86400000);

          // Update ABW harian berdasarkan SNI saat simulasi maju
          lastAbw = estimateAbw(day);

          // Simulasi Sampling
          let isSamplingDay = false;
          if (day === 15 || day === 30 || (day > 30 && (day - 37) % 7 === 0)) {
            isSamplingDay = true;
          }

          if (isSamplingDay) {
            mockSamples.push({
              cycle_id: d.cycle.id,
              doc: day,
              sample_count: 10,
              total_weight_gram: lastAbw * 10,
              notes: "Simulasi Sampling (Lompat Waktu)",
              date: new Date(timeOfDay).toISOString()
            });
          }

          // Simulasi Probiotik (Misal diberikan tiap kelipatan 3 atau 4 hari)
          if (day % 4 === 0) {
            const prob = getProbioticSchedule(day, area);
            mockProbs.push({
              cycle_id: d.cycle.id,
              amount_ml: prob.doseMl,
              method: prob.method,
              probiotic_type: prob.jenis,
              notes: "Simulasi Probiotik",
              date: new Date(timeOfDay).toISOString()
            });
          }

          // Simulasi Pakan
          const calc = calculateDailyFeed(day, pop, area, lastAbw);
          const meals = Math.max(1, calc.mealsPerDay);
          const perMeal = +(calc.dailyFeedKg / meals).toFixed(2);

          for (let i = 0; i < meals; i++) {
            const mealTime = timeOfDay + (i * 3600000 * (24 / meals));
            const checkTime = new Date(mealTime + (2 * 3600000)); // Anggap cek anco 2 jam setelah pakan
            const hours = checkTime.getHours().toString().padStart(2, '0');
            const minutes = checkTime.getMinutes().toString().padStart(2, '0');
            const ancoNoteStr = ` [ANCO:${hours}:${minutes}:Habis]`;

            mockFeeds.push({
              cycle_id: d.cycle.id,
              feed_amount_kg: perMeal,
              feed_type: d.feed?.brand || "Pelet",
              anco_result: "Habis",
              notes: "Simulasi Pakan (Lompat Waktu)" + ancoNoteStr,
              date: new Date(mealTime).toISOString()
            });
          }
        }

        if (mockFeeds.length > 0) {
          const { error: err1 } = await supabase.from("feed_logs").insert(mockFeeds);
          if (err1) throw new Error("Gagal insert feed_logs: " + err1.message);
        }

        if (mockSamples.length > 0) {
          const { error: err2 } = await supabase.from("sampling_logs").insert(mockSamples);
          if (err2) throw new Error("Gagal insert sampling_logs: " + err2.message);
        }

        if (mockProbs.length > 0) {
          const { error: err3 } = await supabase.from("probiotic_logs").insert(mockProbs);
          if (err3) throw new Error("Gagal insert probiotic_logs: " + err3.message);
        }
      }

      // Update start_date agar DOC berubah
      const newStartDate = new Date(Date.now() - (targetDoc * 86400000)).toISOString();
      const updatePayload: any = { start_date: newStartDate };

      // Hitung ABW & Biomassa baru berdasarkan SNI untuk target DOC
      const newAbw = estimateAbw(targetDoc);
      const newSr = targetDoc <= 30 ? 95 : targetDoc <= 60 ? 90 : targetDoc <= 90 ? 85 : 80;
      const initialPop = Number(d.cycle.initial_shrimp_count || 0);
      const currentPop = Math.round(initialPop * (newSr / 100));
      const newBiomass = Number(((currentPop * newAbw) / 1000).toFixed(2));

      updatePayload.current_abw_gram = newAbw;
      updatePayload.current_biomass_kg = newBiomass;

      if (isBackward) {
        updatePayload.status = "Berjalan";
        updatePayload.end_date = null;
        updatePayload.harvest_biomass_kg = null;
        updatePayload.harvest_shrimp_count = null;
        updatePayload.harvest_abw_gram = null;
        updatePayload.harvest_fcr = null;
        updatePayload.harvest_sr_pct = null;
        updatePayload.plan = null;
      }

      const { error } = await supabase.from("cycles").update(updatePayload).eq("id", d.cycle.id);

      if (error) throw new Error("Gagal update waktu utama: " + error.message);

      if (isBackward) {
        setDebugMsg(`Waktu berhasil DIBALIKKAN ke H-${targetDoc}! Data "masa depan" telah dihapus dari log.`);
      } else {
        setDebugMsg(`Waktu berhasil dimajukan drastis ke H-${targetDoc}! Otomatis mencatat ${mockFeeds.length} pakan & ${mockSamples.length} sampling.`);
      }
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  // Selesaikan (tandai is_completed) sebuah timer Pakan/Probiotik yang sudah due.
  async function completeTimer(timerId: string) {
    setBusy(true);
    setInsertError(null);
    const { error } = await supabase.from("active_timers").update({ is_completed: true }).eq("id", timerId);
    setBusy(false);
    if (error) {
      setInsertError("Gagal menyelesaikan timer: " + error.message);
      return;
    }
    refresh();
  }

  // Konfirmasi "Sudah Diberi Pakan": catat feed_log + selesaikan timer lama + mulai siklus baru.
  async function confirmFeedDone(timerId: string) {
    if (!d?.cycle) return;

    // Hitung jumlah pakan sesi ini
    const safeMeals = Math.max(d.feed.mealsPerDay || 1, 1);
    const feedSesiIniKg = d.feed.dailyFeedKg / safeMeals;
    
    const feedText = feedSesiIniKg < 1 
      ? `${Math.round(feedSesiIniKg * 1000)} gram` 
      : `${+feedSesiIniKg.toFixed(2)} kg`;
    
    if (!window.confirm(`Anda akan mencatat pemberian pakan sebesar ${feedText} untuk sesi ini.\n\nLanjutkan?`)) {
      return;
    }

    setBusy(true);
    setInsertError(null);
    try {
      // Selesaikan semua timer pakan & anco yang lama dari sesi sebelumnya
      await supabase
        .from("active_timers")
        .update({ is_completed: true })
        .eq("pond_id", id)
        .in("type", ["Pakan", "Cek Anco"])
        .eq("is_completed", false);

      const now = Date.now();
      await recordFeed(now, "Pakan diberikan (konfirmasi peternak)");
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  // Konfirmasi "Sudah Diberi Probiotik": catat probiotic_log + tandai timer selesai.
  async function confirmProbioticDone(timerId: string) {
    if (!d?.cycle) return;
    setBusy(true);
    setInsertError(null);
    try {
      await recordProbiotic(Date.now(), "Probiotik diberikan (konfirmasi peternak)");
      const { error } = await supabase.from("active_timers").update({ is_completed: true }).eq("id", timerId);
      if (error) throw new Error("Selesaikan timer: " + error.message);
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  // Submit hasil Cek Anco -> update anco_result pada log pakan TERBARU,
  // lalu jika sesi pakan berikutnya masih lama, jadwalkan Cek Anco putaran berikutnya!
  async function submitAnco() {
    if (!ancoModal || !d?.cycle) return;
    setBusy(true);
    setInsertError(null);
    try {
      // 1. Update hasil anco pada log pakan terbaru siklus ini
      const { data: lastFeed } = await supabase
        .from("feed_logs")
        .select("id")
        .eq("cycle_id", d.cycle.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastFeed) {
        const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const checkEntry = `[ANCO:${timeStr}:${ancoResult}]`;

        // Fetch current notes first to avoid overwriting existing ones from other clients
        const { data: curr } = await supabase.from("feed_logs").select("notes").eq("id", lastFeed.id).single();
        const currentNotes = curr?.notes || "";
        const updatedNotes = currentNotes ? currentNotes + " " + checkEntry : checkEntry;

        const upd = await supabase.from("feed_logs").update({ anco_result: ancoResult, notes: updatedNotes }).eq("id", lastFeed.id);
        if (upd.error) throw new Error("Update anco: " + upd.error.message);
      }

      // 2. Selesaikan timer Cek Anco saat ini
      const t = await supabase.from("active_timers").update({ is_completed: true }).eq("id", ancoModal.timerId);
      if (t.error) throw new Error("Selesaikan timer anco: " + t.error.message);

      // 3. Cek apakah sesi Pakan berikutnya masih berjalan di masa depan
      const { data: activePakanTimer } = await supabase
        .from("active_timers")
        .select("due_time")
        .eq("pond_id", id)
        .eq("type", "Pakan")
        .eq("is_completed", false)
        .order("due_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (activePakanTimer) {
        const pakanDueMs = new Date(activePakanTimer.due_time).getTime();
        const nextAncoDueMs = Date.now() + ancoIntervalMs();

        // Jika jadwal cek anco berikutnya masih sebelum waktu pakan tiba (margin 10 menit):
        if (nextAncoDueMs < pakanDueMs - 10 * 60 * 1000) {
          const tNext = await supabase.from("active_timers").insert({
            pond_id: id,
            type: "Cek Anco",
            due_time: new Date(nextAncoDueMs).toISOString(),
          });
          if (tNext.error) console.error("Gagal menjadwalkan Cek Anco berikutnya:", tNext.error);
        }
      }

      setAncoModal(null);
      setAncoResult("Habis");
    } catch (e: any) {
      console.error(e);
      setInsertError(e.message);
    } finally {
      refresh();
      setBusy(false);
    }
  }

  /* ---------- OTHER ACTIONS ---------- */
  async function savePond() {
    setBusy(true);
    await supabase.from("ponds").update({ name: pondForm.name, area_m2: Number(pondForm.area), depth_m: Number(pondForm.depth), location: pondForm.location }).eq("id", id);
    setBusy(false);
    setSheet(null);
    refresh();
  }

  async function addFeedLog() {
    setBusy(true);
    await supabase.from("feed_logs").insert({ cycle_id: d.cycle.id, feed_amount_kg: Number(logForm.amount), feed_type: logForm.type || "Pelet", anco_result: logForm.anco || "Belum Dicek", notes: logForm.notes ?? "" });
    setBusy(false);
    setSheet(null);
    refresh();
  }

  async function endCycle() {
    setBusy(true);
    try {
      const harvestKg = Number(endForm.harvest);
      // endForm.count sekarang berisi ABW (gram) sesuai editan user di UI
      const inputAbw = endForm.count ? Number(endForm.count) : d.abw;
      const harvestCount = Math.round((harvestKg * 1000) / (inputAbw || 1));
      const srPct = d.cycle.initial_shrimp_count > 0 ? +((harvestCount / d.cycle.initial_shrimp_count) * 100).toFixed(2) : 0;
      const fcrFinal = harvestKg > 0 ? +(d.totalFeed / harvestKg).toFixed(2) : 0;
      const yieldM2 = +(harvestKg / Number(d.pond.area_m2)).toFixed(2);
      const ancoPct = d.feeds.length ? +((d.anco.habis / d.feeds.length) * 100).toFixed(2) : 0;

      const { error } = await supabase
        .from("cycles")
        .update({
          status: "Selesai",
          end_date: new Date().toISOString().slice(0, 10),
          harvest_biomass_kg: harvestKg,
          harvest_shrimp_count: harvestCount,
          harvest_abw_gram: inputAbw,
          harvest_fcr: fcrFinal,
          harvest_sr_pct: srPct,
          total_feed_kg: +d.totalFeed.toFixed(2),
          notes: endForm.notes ?? "",
        })
        .eq("id", d.cycle.id);
      if (error) throw error;

      // === AI TRAINING DATA (best effort) ===
      const { data: qs } = await supabase.rpc("calculate_quality_score", {
        p_fcr: fcrFinal,
        p_sr_pct: srPct,
        p_anco_habis_pct: ancoPct,
        p_yield_kg_per_m2: yieldM2,
      });
      const q = (qs as any)?.[0];
      if (q) {
        const { data: auth } = await supabase.auth.getUser();
        const { count: nSamp } = await supabase.from("sampling_logs").select("*", { count: "exact", head: true }).eq("cycle_id", d.cycle.id);
        await supabase
          .from("ai_training_data")
          .insert({
            user_id: auth.user?.id,
            cycle_id: d.cycle.id,
            pond_id: id,
            pond_area_m2: d.pond.area_m2,
            pond_depth_m: d.pond.depth_m,
            pond_location: d.pond.location,
            start_date: d.cycle.start_date,
            end_date: new Date().toISOString().slice(0, 10),
            total_days: d.doc,
            initial_shrimp_count: d.cycle.initial_shrimp_count,
            density_per_m2: +(d.cycle.initial_shrimp_count / Number(d.pond.area_m2)).toFixed(2),
            harvest_biomass_kg: harvestKg,
            harvest_abw_gram: inputAbw,
            harvest_sr_pct: srPct,
            yield_kg_per_m2: yieldM2,
            total_feed_kg: +d.totalFeed.toFixed(2),
            final_fcr: fcrFinal,
            avg_daily_feed_kg: +(d.totalFeed / Math.max(1, d.doc)).toFixed(2),
            total_feed_sessions: d.feeds.length,
            anco_habis_count: d.anco.habis,
            anco_sisa_sedikit_count: d.anco.sedikit,
            anco_sisa_banyak_count: d.anco.banyak,
            anco_habis_pct: ancoPct,
            total_probiotic_sessions: d.probs.length,
            total_probiotic_ml: d.probs.reduce((a: number, p: any) => a + Number(p.amount_ml), 0),
            total_samplings: nSamp ?? 0,
            abw_growth_rate: +((inputAbw || 0) / Math.max(1, d.doc)).toFixed(4),
            quality_score: q.score,
            quality_grade: q.grade,
            is_approved_for_training: q.approved,
          })
          .then(
            () => undefined,
            () => undefined
          );
      }
      router.push("/dashboard");
    } catch (e: any) {
      alert(e?.message || "Gagal mengakhiri siklus.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- KONSULTASI AI BOTTOM (rule-based) ---------- */
  function aiReply(q: string): string {
    const t = q.toLowerCase();
    if (!d) return "Data belum siap.";
    if (t.includes("pakan") || t.includes("dosis"))
      return `DOC ${d.doc}: berikan ${fmt1(d.feed.dailyFeedKg)} kg/hari dibagi ${d.feed.mealsPerDay}x (${fmt1(d.feed.dailyFeedKg / d.feed.mealsPerDay)} kg/sesi). Cek anco tiap ${d.feed.ancoIntervalHours} jam -- kalau sisa banyak, kurangi 20-30%.`;
    if (t.includes("fcr"))
      return d.fcr > 1.5
        ? `FCR ${d.fcr} tergolong TINGGI. Kurangi dosis 10-20%, pastikan pakan tidak terbuang, dan cek kualitas air. ${d.anco.banyak}x anco sisa banyak jadi indikasi overfeeding.`
        : `FCR ${d.fcr} sudah bagus (target < 1.5). Pertahankan dosis saat ini.`;
    if (t.includes("air") || t.includes("probiotik"))
      return `Untuk DOC ${d.doc} (fase ${getProbioticSchedule(d.doc, 1).fase}): aplikasikan ${d.prob.brand} ${d.prob.doseMl} ml, ${d.prob.frequencyPerWeek}x/minggu. ${d.anco.banyak > 2 ? "Air perlu perhatian -- naikkan frekuensi jadi 3x/minggu sementara." : "Kualitas air tampak terkendali."}`;
    if (t.includes("anco"))
      return `Ringkasan anco: ${d.anco.habis}x habis, ${d.anco.sedikit}x sisa sedikit, ${d.anco.banyak}x sisa banyak. ${d.anco.banyak > d.anco.habis ? "Dosis terlalu tinggi -- kurangi bertahap 10%." : "Dosis sudah tepat."}`;
    return `Ringkasan ${d.pond.name}: DOC ${d.doc}, biomassa Rp${d.biomass} kg, ABW ${d.abw} g, SR ${d.sr}%, FCR ${d.fcr}. Pakan ${fmt1(d.feed.dailyFeedKg)} kg/hari (${d.feed.mealsPerDay}x), probiotik ${d.prob.doseMl} ml ${d.prob.frequencyPerWeek}x/minggu. Tanyakan "pakan", "fcr", "air", atau "anco" untuk detail.`;
  }
  function sendChat(text?: string) {
    const q = (text ?? chatInput).trim();
    if (!q) return;
    setChat((c) => [...c, { me: true, text: q }, { text: aiReply(q) }]);
    setChatInput("");
  }

  if (!d)
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-[#F2F5F7]">
        <div suppressHydrationWarning className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" />
      </div>
    );

  const stage = d.doc <= 30 ? "Benur" : d.doc <= 70 ? "Remaja" : "Pembesaran";
  const popLabel = d.cycle?.initial_shrimp_count >= 1000 ? `${Math.round(d.cycle.initial_shrimp_count / 1000)} rb` : `${d.cycle?.initial_shrimp_count ?? 0}`;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#F2F5F7] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full md:flex-1 md:overflow-y-auto">
        <div className="w-full max-w-md pb-28 md:max-w-none md:pb-12">
          {/* ============ HEADER ============ */}
          <DetailHeader d={d} router={router} setPondForm={setPondForm} setSheet={setSheet} onEndCycle={() => {
            setEndForm({ harvest: d.biomass, count: "", notes: "" });
            setSheet("endCycle");
          }} onDeletePond={async () => {
            if (window.confirm("Apakah Anda yakin ingin menghapus kolam ini beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.")) {
              setBusy(true);
              const { error } = await supabase.from("ponds").delete().eq("id", id);
              if (error) {
                alert("Gagal menghapus kolam: " + error.message);
                setBusy(false);
              } else {
                router.push("/dashboard");
              }
            }
          }} />

          <main className="mx-auto max-w-none space-y-4 px-4 pt-4 md:max-w-5xl md:px-8">
            {/* ============ KARTU DOC ============ */}
            <DocCard
              d={d}
              stage={stage}
              popLabel={popLabel}
              tab={tab}
              setTab={setTab}
              onEditAbw={() => {
                setAbwInput(String(d.abw));
                setSheet("edit-abw");
              }}
              onEndCycle={() => {
                setEndForm({ harvest: d.biomass, count: "", notes: "" });
                setSheet("endCycle");
              }}
            />

            {!d.cycle ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-[#E8EBED]/50 py-16 text-center">
                <p className="text-[13px] font-medium text-slate-500">Mulai Siklus untuk menambahkan data</p>
              </div>
            ) : (
              <>

                {/* ============ TAB: PAKAN ============ */}
                {tab === "Pakan" && (
                  <>
                    {/* Status banner */}
                    <div className={`rounded-xl px-4 py-3 text-xs font-bold ${
                      historicalData?.source === "historis" ? "bg-green-100 text-green-700" :
                      d.custom ? "bg-[#FDEBDD] text-[#B25E09]" : "bg-[#CFE8EB] text-[#1F6470]"
                    }`}>
                      {historicalData?.source === "historis" 
                        ? `Berdasarkan data ${historicalData.label}`
                        : d.custom 
                          ? "Rekomendasi telah disesuaikan manual" 
                          : "Rekomendasi berdasarkan standar SNI 8008:2014"}
                    </div>

                    {/* ======== KARTU PAKAN (tampilan normal / edit mode) ======== */}
                    {editMode !== "pakan" && !showAIChat ? (
                      <FeedCard d={d} now={now} busy={busy} insertError={insertError} startEditPakan={startEditPakan} handleCatatPakan={handleCatatPakan} confirmFeedDone={confirmFeedDone} setAncoResult={setAncoResult} setAncoModal={setAncoModal} formatTimeLeft={formatTimeLeft} historicalData={historicalData} />
                    ) : editMode === "pakan" && !showAIChat ? (
                      <FeedEditForm d={d} busy={busy} editFeedValues={editFeedValues} setEditFeedValues={setEditFeedValues} handleConfirmEdit={handleConfirmEdit} showSNIAlert={showSNIAlert} deviations={deviations} saveChanges={saveChanges} startAIConsultation={startAIConsultation} setEditMode={setEditMode} historicalData={historicalData} />
                    ) : null}

                    {/* ======== PANEL CHAT AI (muncul setelah klik "Konsultasi AI") ======== */}
                    {showAIChat && editMode === "pakan" && (
                      <AIChatPanel messages={messages} isAiTyping={isAiTyping} chatEndRef={chatEndRef} inputMsg={inputMsg} setInputMsg={setInputMsg} sendToAI={sendToAI} busy={busy} saveChanges={saveChanges} setShowAIChat={setShowAIChat} />
                    )}

                    {/* ======== KARTU PROBIOTIK (tampilan normal / edit mode) ======== */}
                    {editMode !== "prob" && !showAIChat ? (
                      <ProbioticCard d={d} now={now} busy={busy} startEditProb={startEditProb} handleCatatProbiotik={handleCatatProbiotik} confirmProbioticDone={confirmProbioticDone} formatTimeLeft={formatTimeLeft} historicalData={historicalData} />
                    ) : editMode === "prob" && !showAIChat ? (
                      <ProbioticEditForm d={d} busy={busy} editProbValues={editProbValues} setEditProbValues={setEditProbValues} setEditMode={setEditMode} setShowSNIAlert={setShowSNIAlert} handleConfirmEdit={handleConfirmEdit} showSNIAlert={showSNIAlert} deviations={deviations} saveChanges={saveChanges} startAIConsultation={startAIConsultation} />
                    ) : null}

                    {/* ======== PANEL CHAT AI (probiotik) ======== */}
                    {showAIChat && editMode === "prob" && (
                      <AIChatPanel messages={messages} isAiTyping={isAiTyping} chatEndRef={chatEndRef} inputMsg={inputMsg} setInputMsg={setInputMsg} sendToAI={sendToAI} busy={busy} saveChanges={saveChanges} setShowAIChat={setShowAIChat} />
                    )}

                    {/* ======== PANEL DEBUG: SIMULASI WAKTU ======== */}
                    {!showAIChat && !editMode && (
                      <DebugTimePanel busy={busy} insertError={insertError} debugMsg={debugMsg} debugAdvance={debugAdvance} debugJumpDoc={debugJumpDoc} currentDoc={d?.doc || 0} historisCheck={historicalData} debugFcrLimit={debugFcrLimit} setDebugFcrLimit={setDebugFcrLimit} />
                    )}


                  </>
                )}

                {tab === "Log Book" && <LogBookTab d={d} />}

                {tab === "Proyeksi" && <ProjectionTab d={d} />}

                {tab === "Monitoring" && <MonitoringTab d={d} />}
              </>
            )}
          </main>
        </div>

        {/* ============ SHEET: EDIT KOLAM ============ */}
        <EditPondSheet sheet={sheet} setSheet={setSheet} pondForm={pondForm} setPondForm={setPondForm} savePond={savePond} busy={busy} />

        {/* ============ SHEET: TAMBAH PAKAN ============ */}
        <AddFeedSheet sheet={sheet} setSheet={setSheet} logForm={logForm} setLogForm={setLogForm} addFeedLog={addFeedLog} busy={busy} />

        {/* ============ SHEET: AKHIRI SIKLUS ============ */}
        <EndCycleSheet sheet={sheet} setSheet={setSheet} d={d} endForm={endForm} setEndForm={setEndForm} endCycle={endCycle} busy={busy} />

        {/* ============ SHEET: EDIT ABW ============ */}
        <EditAbwSheet sheet={sheet} setSheet={setSheet} abwInput={abwInput} setAbwInput={setAbwInput} handleEditAbw={handleEditAbw} busy={busy} />

        {/* ============ MODAL: CEK ANCO ============ */}
        <AncoModal ancoModal={ancoModal} ancoResult={ancoResult} setAncoResult={setAncoResult} setAncoModal={setAncoModal} busy={busy} submitAnco={submitAnco} currentSessionResult={d?.anco?.currentSessionResult} />

        {/* ============ SHEET: KONSULTASI AI (bottom) ============ */}
        <ConsultAISheet sheet={sheet} setSheet={setSheet} chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />

        {/* ============ SHEET: MULAI SIKLUS ============ */}
        <StartCycleSheet open={sheet === "startCycle"} pond={d.pond} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); refresh(); }} />
      </div>

      {/* Sticky Mulai Siklus button if !d.cycle */}
      {!d.cycle && sheet !== "startCycle" && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <button className="pointer-events-auto flex w-full max-w-[200px] items-center justify-center gap-2 rounded-xl bg-[#25C4D4] px-6 py-3 text-[15px] font-bold text-white shadow-lg transition active:scale-95" onClick={() => setSheet("startCycle")}>
            Mulai Siklus <span className="text-xl leading-none">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
