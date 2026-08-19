// Derivasi data detail kolam (dipindah PERSIS dari useMemo `d` di page.tsx).
// Fungsi murni: input `data` mentah dari Supabase, output objek turunan.
// ZERO perubahan logika.

import { calculateDailyFeed, getProbioticSchedule, estimateAbw } from "@/lib/feed-calculator";

export function buildDetail(data: any) {
  if (!data) return null;
  const { pond, cycle, feeds, samps } = data;
  const samp = samps.length > 0 ? samps[samps.length - 1] : null;
  const doc = cycle?.start_date ? Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000) : 0;
  const sr = samp?.estimated_sr_pct ? Number(samp.estimated_sr_pct) : 90;
  const abw = cycle?.current_abw_gram > 0 ? Number(cycle.current_abw_gram) : samp?.abw_gram ? Number(samp.abw_gram) : estimateAbw(doc);
  const calc = calculateDailyFeed(doc, cycle?.initial_shrimp_count ?? 0, Number(pond.area_m2), abw, sr);
  const biomass = cycle?.current_biomass_kg > 0 ? Number(cycle.current_biomass_kg) : calc.biomassKg;
  const totalFeed = feeds.reduce((a: number, f: any) => a + Number(f.feed_amount_kg), 0);
  const fcr = biomass > 0 ? +(totalFeed / biomass).toFixed(2) : 0;
  const plan = cycle?.plan ?? null;
  // Guard: nilai tersimpan yang <= 0 / bukan angka valid dianggap rusak,
  // fallback ke hasil kalkulasi SNI agar UI tak menampilkan 0 kg / 0x.
  const pos = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const feed = {
    dailyFeedKg: pos(plan?.feed?.dailyFeedKg, calc.dailyFeedKg),
    mealsPerDay: pos(plan?.feed?.mealsPerDay, calc.mealsPerDay),
    ancoIntervalHours: pos(plan?.feed?.ancoIntervalHours, calc.ancoIntervalHours),
    brand: plan?.feed?.brand ?? cycle?.feed_brand ?? "Pelet",
  };
  const sched = getProbioticSchedule(doc, Number(pond.area_m2));
  const prob = {
    doseMl: pos(plan?.prob?.doseMl, sched.doseMl),
    frequencyPerWeek: pos(plan?.prob?.frequencyPerWeek, sched.frequencyPerWeek),
    method: plan?.prob?.method ?? "Ke Air",
    brand: plan?.prob?.brand ?? "Bacillus",
  };
  const latestAncoLog = feeds.find((f: any) => f.anco_result && f.anco_result !== "Belum Dicek");
  const latestAnco = latestAncoLog?.anco_result || null;
  const ancoMultiplier = latestAnco === "Sisa Banyak" ? 0.75 : latestAnco === "Sisa Sedikit" ? 0.9 : 1.0;
  const rawPerMealKg = +(feed.dailyFeedKg / feed.mealsPerDay).toFixed(2);
  const adjustedPerMealKg = +(rawPerMealKg * ancoMultiplier).toFixed(2);

  let consecutiveHabis = 0;
  for (const f of feeds) {
    if (f.anco_result === "Habis") {
      consecutiveHabis++;
    } else if (f.anco_result && f.anco_result !== "Belum Dicek") {
      break;
    }
  }
  const mealsPerDaySafe = Math.max(feed.mealsPerDay || 1, 1);
  const isHabis3Days = consecutiveHabis >= (mealsPerDaySafe * 3) && consecutiveHabis > 0;
  const isHabis1Week = consecutiveHabis >= (mealsPerDaySafe * 7) && consecutiveHabis > 0;

  const anco = {
    habis: feeds.filter((f: any) => f.anco_result === "Habis").length,
    sedikit: feeds.filter((f: any) => f.anco_result === "Sisa Sedikit").length,
    banyak: feeds.filter((f: any) => f.anco_result === "Sisa Banyak").length,
    latestResult: latestAnco,
    multiplier: ancoMultiplier,
    rawPerMealKg,
    adjustedPerMealKg,
    consecutiveHabis,
    isHabis3Days,
    isHabis1Week,
  };

  const hasAncoHistory = anco.consecutiveHabis > 0 || anco.latestResult !== null;
  const recommendedFeedKg = hasAncoHistory 
    ? +(anco.adjustedPerMealKg * feed.mealsPerDay).toFixed(2)
    : calc.dailyFeedKg;

  // Hibrida Proyeksi Mingguan (Historis + Proyeksi)
  const proyeksiMingguan = [];
  const currentWeekNum = Math.floor(doc / 7) + 1; 
  const totalWeeksToShow = currentWeekNum + 4; // Tampilkan sampai 4 minggu ke depan
  const cycleStartMs = cycle?.start_date ? new Date(cycle.start_date).getTime() : Date.now();

  for (let w = 1; w <= totalWeeksToShow; w++) {
    const weekStartDoc = (w - 1) * 7;
    const weekEndDoc = w * 7 - 1;
    
    let weeklyFeed = 0;
    let isReal = false;
    let typeDesc = "";
    
    if (weekStartDoc <= doc) {
      // Minggu historis / sedang berjalan -> Ambil data log pakan asli
      const realFeeds = feeds.filter((f: any) => {
        const feedDoc = Math.floor((new Date(f.date).getTime() - cycleStartMs) / 86400000);
        return feedDoc >= weekStartDoc && feedDoc <= weekEndDoc;
      });
      weeklyFeed = realFeeds.reduce((acc: number, f: any) => acc + Number(f.feed_amount_kg), 0);
      isReal = true;
      typeDesc = "Data Historis (Nyata)";

      // Jika minggu ini sedang berjalan, sisa harinya kita tambahkan dari proyeksi
      if (weekEndDoc > doc) {
        let projectedRemainder = 0;
        for (let dayDoc = doc + 1; dayDoc <= weekEndDoc; dayDoc++) {
          const calcFuture = calculateDailyFeed(dayDoc, cycle?.initial_shrimp_count ?? 0, Number(pond.area_m2), 0, sr);
          projectedRemainder += calcFuture.dailyFeedKg;
        }
        weeklyFeed += projectedRemainder;
        typeDesc = "Nyata + Estimasi Sisa Hari";
      }

    } else {
      // Minggu masa depan murni -> Proyeksi SNI
      for (let day = 0; day < 7; day++) {
        const targetDoc = weekStartDoc + day;
        const calcWeekly = calculateDailyFeed(targetDoc, cycle?.initial_shrimp_count ?? 0, Number(pond.area_m2), 0, sr);
        weeklyFeed += calcWeekly.dailyFeedKg;
      }
      isReal = false;
      typeDesc = "Proyeksi SNI (Estimasi)";
    }
    
    proyeksiMingguan.push({
      label: `Mgg ${w}`,
      listLabel: `Minggu ${w}`,
      amount: weeklyFeed,
      type: typeDesc,
      isReal: isReal,
    });
  }

  // ─── ABW Chart: Harian dengan Interpolasi Linear ─────────────────────────
  // Jadwal sampling: setiap 15 hari sampai DOC 30, lalu setiap 7 hari setelahnya
  const getNextSamplingDoc = (currentDoc: number): number => {
    if (currentDoc < 15) return 15;
    if (currentDoc < 30) return 30;
    // Setelah DOC 30: setiap 7 hari (37, 44, 51, ...)
    const baseDoc = 30;
    const interval = 7;
    const elapsed = currentDoc - baseDoc;
    const nextMultiple = Math.ceil(elapsed / interval) * interval;
    return baseDoc + nextMultiple;
  };

  // Bangun peta sampling: doc → abw_gram dari data asli
  const samplingMap = new Map<number, number>();
  if (samps && samps.length > 0) {
    samps.forEach((s: any) => {
      const sDoc = Math.max(1, Math.floor((new Date(s.date).getTime() - cycleStartMs) / 86400000));
      samplingMap.set(sDoc, Number(s.abw_gram));
    });
  }

  // Titik-titik "anchor" untuk interpolasi: selalu mulai dari (0, 0)
  const anchors: { doc: number; abw: number }[] = [{ doc: 0, abw: 0 }];
  samplingMap.forEach((abwVal, dDoc) => {
    anchors.push({ doc: dDoc, abw: abwVal });
  });
  anchors.sort((a, b) => a.doc - b.doc);

  // Bangun array per hari sampai hari ini (doc)
  const totalDays = Math.max(doc, 1);
  const abwDaily: { doc: number; act: number | null; std: number }[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const std = estimateAbw(d);

    // Cari segmen interpolasi: anchor sebelum dan sesudah hari ini
    let prevAnchor = anchors[0];
    let nextAnchor: { doc: number; abw: number } | null = null;

    for (let a = 0; a < anchors.length - 1; a++) {
      if (anchors[a].doc <= d && anchors[a + 1].doc >= d) {
        prevAnchor = anchors[a];
        nextAnchor = anchors[a + 1];
        break;
      }
    }

    let act: number | null = null;

    if (samplingMap.has(d)) {
      // Hari ini ada data sampling → pakai nilai asli
      act = samplingMap.get(d)!;
    } else if (nextAnchor !== null) {
      // Di antara dua anchor → interpolasi linear (hanya setelah anchor pertama yang bukan 0)
      if (prevAnchor.abw > 0 || nextAnchor.abw > 0) {
        const ratio = (d - prevAnchor.doc) / (nextAnchor.doc - prevAnchor.doc);
        act = prevAnchor.abw + ratio * (nextAnchor.abw - prevAnchor.abw);
      }
      // Kalau prevAnchor masih di titik 0 (belum ada sampling sama sekali), biarkan null
    } else {
      // Setelah anchor terakhir dan belum ada sampling lagi → null (garis berhenti)
      act = null;
    }

    abwDaily.push({ doc: d, act, std });
  }

  // ─── Alert Sampling ABW ────────────────────────────────────────────────────
  // Cek apakah jadwal sampling hari ini sudah terlewat tanpa input
  const nextSamplingDue = getNextSamplingDoc(doc);
  const lastSamplingDoc = anchors.length > 1 ? anchors[anchors.length - 1].doc : 0;
  const abwSamplingAlert = (() => {
    if (doc < 15) return null; // Belum saatnya sampling

    // Jadwal yang harusnya sudah dilakukan berdasarkan DOC saat ini
    const scheduledDocs: number[] = [15, 30];
    if (doc > 30) {
      let s = 37;
      while (s <= doc) { scheduledDocs.push(s); s += 7; }
    }

    // Cari jadwal yang terlewat (belum ada datanya ±2 hari toleransi)
    const missedDocs = scheduledDocs.filter(sd =>
      !Array.from(samplingMap.keys()).some(k => Math.abs(k - sd) <= 2)
    );

    if (missedDocs.length > 0) {
      const lastMissed = missedDocs[missedDocs.length - 1];
      const isPhaseEarly = lastMissed <= 30;
      return {
        type: "missed" as const,
        doc: lastMissed,
        message: isPhaseEarly
          ? `Belum ada data timbang udang di H-${lastMissed}. Segera lakukan pengecekan ABW!`
          : `Sudah H-${doc}, belum ada sampling sejak H-${lastSamplingDoc}. Jadwal sampling terlewat!`,
      };
    }

    // Cek apakah besok/hari ini jadwal sampling
    if (nextSamplingDue === doc || nextSamplingDue === doc + 1) {
      return {
        type: "reminder" as const,
        doc: nextSamplingDue,
        message: `Jadwal timbang udang (sampling ABW) di H-${nextSamplingDue}. Siapkan jala!`,
      };
    }

    return null;
  })();

  // abwChart tetap dipertahankan untuk kompatibilitas (titik-titik sampling saja)
  const abwChart = anchors.filter(a => a.doc > 0).map(a => ({
    label: `H-${a.doc}`,
    doc: a.doc,
    std: estimateAbw(a.doc),
    act: a.abw,
  }));

  // Terapkan penyesuaian Anco secara otomatis ke nilai pakan harian
  // Ini memastikan UI dan tombol "Catat Pakan" langsung menggunakan dosis yang direkomendasikan
  // berdasarkan hasil Anco terakhir, tanpa user harus menekan tombol Edit.
  feed.dailyFeedKg = recommendedFeedKg;

  return { ...data, doc, sr, abw, calc, biomass, totalFeed, fcr, plan, feed, prob, anco, sched, proyeksiMingguan, abwChart, abwDaily, abwSamplingAlert, recommendedFeedKg, custom: !!plan };
}