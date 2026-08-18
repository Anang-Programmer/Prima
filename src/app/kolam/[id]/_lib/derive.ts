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

  // Proyeksi mingguan 6 minggu ke depan
  const proyeksiMingguan = [];
  for (let i = 0; i < 6; i++) {
    let weeklyFeed = 0;
    for (let day = 0; day < 7; day++) {
      const targetDoc = doc + (i * 7) + day;
      const calcWeekly = calculateDailyFeed(targetDoc, cycle?.initial_shrimp_count ?? 0, Number(pond.area_m2), 0, sr);
      weeklyFeed += calcWeekly.dailyFeedKg;
    }
    proyeksiMingguan.push({
      label: `Mgg ${i + 1}`,
      listLabel: `Minggu ${i + 1}`,
      amount: weeklyFeed,
      type: "Pellet 1,5mm",
    });
  }

  const abwChart = [];
  const numPoints = Math.max(4, samps.length);
  for (let i = 0; i < numPoints; i++) {
    const weekNum = i + 1;
    const stdAbw = estimateAbw(weekNum * 7);
    const s = samps[i];
    abwChart.push({
      label: `M${weekNum}`,
      std: stdAbw,
      act: s ? s.abw_gram : null,
    });
  }

  return { ...data, doc, sr, abw, calc, biomass, totalFeed, fcr, plan, feed, prob, anco, sched, proyeksiMingguan, abwChart, custom: !!plan };
}