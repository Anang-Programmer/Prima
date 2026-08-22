// Derivasi data detail kolam (dipindah PERSIS dari useMemo `d` di page.tsx).
// Fungsi murni: input `data` mentah dari Supabase, output objek turunan.
// ZERO perubahan logika.

import { calculateDailyFeed, getProbioticSchedule, estimateAbw } from "@/lib/feed-calculator";

export function buildDetail(data: any) {
  if (!data) return null;
  const { pond, cycle, feeds, samps } = data;

  if (!cycle) {
    return {
      ...data,
      doc: 0,
      fcr: 0,
      abw: 0,
      biomass: 0,
      totalFeed: 0,
      sr: 0,
      cycle: null,
      feed: { dailyFeedKg: 0, mealsPerDay: 1, ancoIntervalHours: 2, brand: "Pelet" },
      prob: { doseMl: 0, frequencyPerWeek: 1, method: "Ke Air", brand: "Bacillus" },
      anco: { habis: 0, sedikit: 0, banyak: 0, latestResult: null, multiplier: 1, rawPerMealKg: 0, adjustedPerMealKg: 0, consecutiveHabis: 0, isHabis3Days: false, isHabis1Week: false },
      abwSamplingAlert: null,
      abwChart: [],
      abwDaily: [],
      proyeksiMingguan: [],
      recommendedFeedKg: 0,
      calc: { dailyFeedKg: 0, biomassKg: 0, mealsPerDay: 1, ancoIntervalHours: 2 },
      sched: { doseMl: 0, frequencyPerWeek: 1 }
    };
  }

  const samp = samps.length > 0 ? samps[samps.length - 1] : null;
  const doc = cycle?.start_date ? Math.floor((Date.now() - new Date(cycle.start_date).getTime()) / 86400000) : 0;
  const sr = samp?.estimated_sr_pct ? Number(samp.estimated_sr_pct) : 90;
  const abw = cycle?.current_abw_gram > 0 ? Number(cycle.current_abw_gram) : samp?.abw_gram ? Number(samp.abw_gram) : estimateAbw(doc);
  const calc = calculateDailyFeed(doc, cycle?.initial_shrimp_count ?? 0, Number(pond.area_m2), abw, sr);
  const biomass = cycle?.current_biomass_kg > 0 ? Number(cycle.current_biomass_kg) : calc.biomassKg;
  const totalFeed = feeds.reduce((a: number, f: any) => a + Number(f.feed_amount_kg), 0);
  let fcr = biomass > 0 ? +(totalFeed / biomass).toFixed(2) : 0;
  // Penyesuaian/Penghalusan FCR untuk UI (karena secara matematis feeding rate nursery sangat tinggi dibanding biomassa)
  if (doc < 90 && fcr > 1.4 && totalFeed > 0) {
    fcr = +(1.15 + (fcr - 1.15) * (doc / 90)).toFixed(2);
  }
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
    method: plan?.prob?.method ?? sched.method,
    brand: plan?.prob?.brand ?? sched.jenis,
  };
  const latestAncoLog = feeds.find((f: any) => f.anco_result && f.anco_result !== "Belum Dicek");
  const latestAnco = latestAncoLog?.anco_result || null;
  const ancoMultiplier = latestAnco === "Sisa Banyak" ? 0.75 : latestAnco === "Sisa Sedikit" ? 0.9 : 1.0;
  const rawPerMealKg = feed.dailyFeedKg / feed.mealsPerDay;
  const adjustedPerMealKg = rawPerMealKg * ancoMultiplier;

  let consecutiveHabis = 0;
  for (const f of feeds) {
    if (f.anco_result === "Habis") {
      // Jika feed_amount_kg berbeda dari dosis per sesi saat ini (toleransi 0.02kg = 20g),
      // berarti log ini berasal dari plan lama sebelum user melakukan penyesuaian pakan.
      // Kita putus streak-nya agar alert reset dan hilang.
      if (Math.abs(Number(f.feed_amount_kg) - rawPerMealKg) > 0.02) {
        break;
      }
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
    : feed.dailyFeedKg;

  // Hibrida Proyeksi Mingguan (Historis + Proyeksi)
  const proyeksiMingguan = [];
  const currentWeekNum = Math.floor(doc / 7) + 1; 
  const MAX_TARGET_WEEK = Math.ceil(120 / 7); // 18 minggu (120 hari)
  const totalWeeksToShow = Math.max(currentWeekNum, MAX_TARGET_WEEK);
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
      const abwVal = Number(s.abw_gram);
      if (abwVal > 0) {
        samplingMap.set(sDoc, abwVal);
      }
    });
  }

  // Titik-titik "anchor" untuk interpolasi: selalu mulai dari (0, 0)
  let anchors: { doc: number; abw: number }[] = [{ doc: 0, abw: 0 }];
  samplingMap.forEach((abwVal, dDoc) => {
    anchors.push({ doc: dDoc, abw: abwVal });
  });
  anchors.sort((a, b) => a.doc - b.doc);

  // Filter anomali: ABW udang tidak mungkin menyusut. Abaikan data yang lebih kecil dari sebelumnya.
  const validAnchors = [anchors[0]];
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].abw >= validAnchors[validAnchors.length - 1].abw) {
      validAnchors.push(anchors[i]);
    }
  }
  anchors = validAnchors;

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
  // Jadwal sampling: H-15, H-30, lalu setiap 7 hari (H-37, H-44, H-51, ...)
  // Alert hanya muncul untuk jadwal TERDEKAT yang belum dilakukan.
  const abwSamplingAlert = (() => {
    if (doc < 15) return null; // Belum saatnya sampling

    // Bangun daftar semua jadwal sampling sampai DOC sekarang
    const scheduledDocs: number[] = [15, 30];
    if (doc > 30) {
      let s = 37;
      while (s <= doc + 1) { scheduledDocs.push(s); s += 7; }
    }

    // Cari jadwal terakhir yang seharusnya sudah dijalankan (≤ DOC sekarang)
    const dueDocs = scheduledDocs.filter(sd => sd <= doc);
    // Jadwal berikutnya (untuk reminder)
    const upcomingDoc = scheduledDocs.find(sd => sd > doc) ?? null;

    // Cek jadwal terakhir yang sudah due — apakah sudah ada datanya?
    if (dueDocs.length > 0) {
      const latestDue = dueDocs[dueDocs.length - 1];
      // Dianggap sudah terpenuhi jika ada sampling di (latestDue - 3) HARI ATAU LEBIH BARU
      const hasSamplingNearby = Array.from(samplingMap.keys()).some(k => k >= latestDue - 3);

      if (!hasSamplingNearby) {
        return {
          type: "missed" as const,
          doc: latestDue,
          nextDoc: upcomingDoc,
          message: `Jadwal sampling ABW di H-${latestDue} belum dilakukan. Segera lakukan penimbangan udang!`,
        };
      }
    }

    // Cek apakah besok/hari ini jadwal sampling (reminder)
    if (upcomingDoc !== null && (upcomingDoc === doc || upcomingDoc === doc + 1)) {
      const hasSamplingNearby = Array.from(samplingMap.keys()).some(k => Math.abs(k - upcomingDoc) <= 3);
      if (!hasSamplingNearby) {
        return {
          type: "reminder" as const,
          doc: upcomingDoc,
          nextDoc: upcomingDoc,
          message: `Jadwal timbang udang (sampling ABW) di H-${upcomingDoc}. Siapkan jala!`,
        };
      }
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