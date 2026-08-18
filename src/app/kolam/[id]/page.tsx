"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProbioticSchedule, nextFeedTime } from "@/lib/feed-calculator";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { fmt1 } from "./_lib/constants";
import { buildDetail } from "./_lib/derive";
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

export default function DetailKolamPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState("Pakan");
  const [sheet, setSheet] = useState<null | string>(null);
  const [busy, setBusy] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState<string | null>(null);

  // form states
  const [pondForm, setPondForm] = useState<any>({});
  const [logForm, setLogForm] = useState<any>({});
  const [endForm, setEndForm] = useState<any>({});

  // ======== LOGIKA EDIT PAKAN/PROBIOTIK (dari KolamDetailClient.tsx) ========
  const [editMode, setEditMode] = useState<"pakan" | "prob" | null>(null);
  // Edit values pakan
  const [editFeedValues, setEditFeedValues] = useState({ dailyFeedKg: 0, mealsPerDay: 0, ancoHours: 2.25, feedBrand: "" });
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
      }
      setData({ pond, cycle, feeds, probs, timers, samps, logbook });
    })();
  }, [id, reload]);

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
    setEditFeedValues({
      dailyFeedKg: d.feed.dailyFeedKg,
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
    setEditProbValues({
      doseMl: d.prob.doseMl,
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
      const pakanDev = Math.abs(editFeedValues.dailyFeedKg - d.calc.dailyFeedKg) > 0.5;
      const freqDev = editFeedValues.mealsPerDay !== d.calc.mealsPerDay;
      const ancoDev = Math.abs(editFeedValues.ancoHours - d.calc.ancoIntervalHours) > 0.3;

      if (pakanDev || freqDev || ancoDev) {
        setDeviations({ pakan: pakanDev, freq: freqDev, anco: ancoDev });
        setShowSNIAlert(true);
      } else {
        saveChanges(false);
      }
    } else if (editMode === "prob") {
      const dosisDev = Math.abs(editProbValues.doseMl - d.sched.doseMl) > 50;
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
    const lastAsst = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAsst) return null;
    // Toleransi format: [DEAL_DATA: {...}] atau DEAL_DATA: {...}, termasuk newline.
    const match = lastAsst.content.match(/DEAL_DATA:\s*(\{[\s\S]*?\})/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Gagal parse DEAL_DATA", e);
      return null;
    }
  }

  // Simpan perubahan ke database. withAi=true ' pakai angka kesepakatan AI bila ada.
  async function saveChanges(withAi: boolean) {
    if (!d?.cycle) return;
    setBusy(true);
    setInsertError(null);

    const deal = withAi ? extractDeal() : null;

    let update: Record<string, any>;
    if (editMode === "pakan") {
      const feed = {
        dailyFeedKg: Number(deal?.pakan ?? editFeedValues.dailyFeedKg),
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
      if (deviations.pakan) devText.push(`total pakan menjadi ${editFeedValues.dailyFeedKg}kg (standar SNI: ${fmt1(d.calc.dailyFeedKg)}kg)`);
      if (deviations.freq) devText.push(`frekuensi menjadi ${editFeedValues.mealsPerDay}x/hari (standar SNI: ${d.calc.mealsPerDay}x)`);
      if (deviations.anco) devText.push(`cek anco menjadi ${editFeedValues.ancoHours} jam (standar SNI: ${d.calc.ancoIntervalHours} jam)`);
      openingMsg = `Halo Pak. Saya perhatikan Bapak ingin mengubah ${devText.join(", ")}. Hal ini berbeda dari standar SNI 8008:2014. Ada keluhan khusus di kolam, Pak?`;
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
      const res = await fetch("/api/ai-konsultasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editMode === "prob" ? "probiotik" : "pakan",
          messages: newMessages,
          pondContext: {
            doc: d.doc,
            population: d.cycle?.initial_shrimp_count,
            area: d.pond.area_m2,
            abw: d.abw,
            biomass: d.biomass,
          },
          sniValues:
            editMode === "pakan"
              ? {
                  dailyFeedKg: d.calc.dailyFeedKg,
                  mealsPerDay: d.calc.mealsPerDay,
                  feedingRate: d.calc.feedingRatePct,
                  ancoHours: d.calc.ancoIntervalHours,
                }
              : {
                  dosis: `${d.sched.doseMl}ml`,
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
      feed_amount_kg: +(d.feed.dailyFeedKg / safeMeals).toFixed(2),
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
          harvest_abw_gram: d.abw,
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
            harvest_abw_gram: d.abw,
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
            abw_growth_rate: +((d.abw || 0) / Math.max(1, d.doc)).toFixed(4),
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
        <div suppressHydrationWarning className="h-8 w-8 animate-spin rounded-full border-4 border-[#4C9AA6] border-t-transparent" />
      </div>
    );

  const stage = d.doc <= 30 ? "Benur" : d.doc <= 70 ? "Juvenil" : "Pembesaran";
  const popLabel = d.cycle?.initial_shrimp_count >= 1000 ? `${Math.round(d.cycle.initial_shrimp_count / 1000)} rb` : `${d.cycle?.initial_shrimp_count ?? 0}`;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#F2F5F7] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full md:flex-1 md:overflow-y-auto">
      <div className="w-full max-w-md pb-28 md:max-w-none md:pb-12">
        {/* ============ HEADER ============ */}
        <DetailHeader d={d} router={router} setPondForm={setPondForm} setSheet={setSheet} />

        <main className="mx-auto max-w-none space-y-4 px-4 pt-4 md:max-w-5xl md:px-8">
          {/* ============ KARTU DOC ============ */}
          {d.cycle ? (
            <>
              <DocCard d={d} stage={stage} popLabel={popLabel} tab={tab} setTab={setTab} />

              {/* ============ TAB: PAKAN ============ */}
              {tab === "Pakan" && (
                <>
                  {/* Status banner */}
                  <div className={`rounded-xl px-4 py-3 text-xs font-bold ${d.custom ? "bg-[#FDEBDD] text-[#B25E09]" : "bg-[#CFE8EB] text-[#1F6470]"}`}>
                    {d.custom ? "Rekomendasi telah disesuaikan manual" : "Sesuai rekomendasi standar SNI 8008:2014"}
                  </div>

                  {/* ======== KARTU PAKAN (tampilan normal / edit mode) ======== */}
                  {editMode !== "pakan" && !showAIChat ? (
                    <FeedCard d={d} now={now} busy={busy} insertError={insertError} startEditPakan={startEditPakan} handleCatatPakan={handleCatatPakan} confirmFeedDone={confirmFeedDone} setAncoResult={setAncoResult} setAncoModal={setAncoModal} formatTimeLeft={formatTimeLeft} />
                  ) : editMode === "pakan" && !showAIChat ? (
                    <FeedEditForm d={d} busy={busy} editFeedValues={editFeedValues} setEditFeedValues={setEditFeedValues} handleConfirmEdit={handleConfirmEdit} showSNIAlert={showSNIAlert} deviations={deviations} saveChanges={saveChanges} startAIConsultation={startAIConsultation} />
                  ) : null}

                  {/* ======== PANEL CHAT AI (muncul setelah klik "Konsultasi AI") ======== */}
                  {showAIChat && editMode === "pakan" && (
                    <AIChatPanel messages={messages} isAiTyping={isAiTyping} chatEndRef={chatEndRef} inputMsg={inputMsg} setInputMsg={setInputMsg} sendToAI={sendToAI} busy={busy} saveChanges={saveChanges} setShowAIChat={setShowAIChat} />
                  )}

                  {/* ======== KARTU PROBIOTIK (tampilan normal / edit mode) ======== */}
                  {editMode !== "prob" && !showAIChat ? (
                    <ProbioticCard d={d} now={now} busy={busy} startEditProb={startEditProb} handleCatatProbiotik={handleCatatProbiotik} confirmProbioticDone={confirmProbioticDone} formatTimeLeft={formatTimeLeft} />
                  ) : editMode === "prob" && !showAIChat ? (
                    <ProbioticEditForm d={d} busy={busy} editProbValues={editProbValues} setEditProbValues={setEditProbValues} setEditMode={setEditMode} setShowSNIAlert={setShowSNIAlert} handleConfirmEdit={handleConfirmEdit} showSNIAlert={showSNIAlert} deviations={deviations} saveChanges={saveChanges} startAIConsultation={startAIConsultation} />
                  ) : null}

                  {/* ======== PANEL CHAT AI (probiotik) ======== */}
                  {showAIChat && editMode === "prob" && (
                    <AIChatPanel messages={messages} isAiTyping={isAiTyping} chatEndRef={chatEndRef} inputMsg={inputMsg} setInputMsg={setInputMsg} sendToAI={sendToAI} busy={busy} saveChanges={saveChanges} setShowAIChat={setShowAIChat} />
                  )}

                  {/* ======== PANEL DEBUG: SIMULASI WAKTU ======== */}
                  {!showAIChat && !editMode && (
                    <DebugTimePanel busy={busy} insertError={insertError} debugMsg={debugMsg} debugAdvance={debugAdvance} />
                  )}

                  <button
                    onClick={() => {
                      setEndForm({ harvest: d.biomass, count: "", notes: "" });
                      setSheet("endCycle");
                    }}
                    className="w-full rounded-xl border-[1.5px] border-[#F26B4E] bg-white py-3 text-sm font-semibold text-[#F26B4E] transition active:scale-[0.98]"
                  >
                    Akhiri Siklus
                  </button>
                </>
              )}

              {tab === "Log Book" && <LogBookTab d={d} />}

              {tab === "Proyeksi" && <ProjectionTab d={d} />}

              {tab === "Monitoring" && <MonitoringTab d={d} />}
            </>
          ) : (
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-bold">Belum ada siklus berjalan</p>
              <p className="mt-1 text-xs text-slate-500">Mulai siklus baru untuk mengelola pakan & probiotik.</p>
            </section>
          )}
        </main>
      </div>

      {/* ============ SHEET: EDIT KOLAM ============ */}
      <EditPondSheet sheet={sheet} setSheet={setSheet} pondForm={pondForm} setPondForm={setPondForm} savePond={savePond} busy={busy} />

      {/* ============ SHEET: TAMBAH PAKAN ============ */}
      <AddFeedSheet sheet={sheet} setSheet={setSheet} logForm={logForm} setLogForm={setLogForm} addFeedLog={addFeedLog} busy={busy} />

      {/* ============ SHEET: AKHIRI SIKLUS ============ */}
      <EndCycleSheet sheet={sheet} setSheet={setSheet} d={d} endForm={endForm} setEndForm={setEndForm} endCycle={endCycle} busy={busy} />

      {/* ============ MODAL: CEK ANCO ============ */}
      <AncoModal ancoModal={ancoModal} ancoResult={ancoResult} setAncoResult={setAncoResult} setAncoModal={setAncoModal} busy={busy} submitAnco={submitAnco} />

      {/* ============ SHEET: KONSULTASI AI (bottom) ============ */}
      <ConsultAISheet sheet={sheet} setSheet={setSheet} chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />
      </div>
    </div>
  );
}
