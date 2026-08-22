// Kalkulasi pakan & probiotik (Sesuai dengan AI-LOGIC.md - SNI 8008:2014 & Penyesuaian Lapangan)

export function estimateAbw(doc: number): number {
  if (doc <= 0) return 0.001;
  // ABW (gram) = 0.0005 * DOC^2 + 0.05 * DOC
  return Number((0.0005 * Math.pow(doc, 2) + 0.05 * doc).toFixed(2));
}

export function estimateSr(doc: number): number {
  if (doc <= 30) return 95;
  if (doc <= 60) return 90;
  if (doc <= 90) return 85;
  return 80;
}

export function calculateDailyFeed(doc: number, population: number, area: number, abwOverride?: number, srPctOverride?: number) {
  const abwGram = abwOverride && abwOverride > 0 ? abwOverride : estimateAbw(doc);
  const srPct = srPctOverride && srPctOverride > 0 ? srPctOverride : estimateSr(doc);

  const shrimpCount = Math.round(population * (srPct / 100));
  const biomassKg = Number(((shrimpCount * abwGram) / 1000).toFixed(2));

  // Use the smooth feeding rate curve (same as feedingRatePct function below)
  const frPct = feedingRatePct(doc);

  let dailyFeedKg = (biomassKg * frPct) / 100;

  // Density adjustment
  const density = shrimpCount / area;
  if (density > 100) dailyFeedKg *= 1.1; // +10%
  else if (density < 50) dailyFeedKg *= 0.95; // -5%

  dailyFeedKg = Number(dailyFeedKg.toFixed(2));

  const mealsPerDay = doc <= 90 ? 4 : 5;

  let ancoIntervalHours = 2; // Default for 1-30
  if (doc > 30 && doc <= 45) ancoIntervalHours = 2.5;
  else if (doc > 45 && doc <= 60) ancoIntervalHours = 2.25;
  else if (doc > 60 && doc <= 90) ancoIntervalHours = 1.75;
  else if (doc > 90) ancoIntervalHours = 1.25;

  return {
    doc, abwGram, shrimpCount, biomassKg, feedingRatePct: frPct, dailyFeedKg, mealsPerDay,
    feedPerMealKg: +(dailyFeedKg / mealsPerDay).toFixed(1),
    ancoIntervalHours,
  };
}

// Feeding rate (% biomassa) per DOC - kurva halus untuk proyeksi harian.
export function feedingRatePct(doc: number): number {
  return doc <= 10 ? 9 : doc <= 20 ? 7.5 : doc <= 30 ? 6 : doc <= 45 ? 5 : doc <= 60 ? 4.2 : doc <= 75 ? 3.6 : doc <= 90 ? 3 : doc <= 105 ? 2.6 : 2.2;
}

// Jenis pelet berdasarkan umur udang (DOC).
export function pelletType(doc: number): string {
  return doc <= 30 ? "Pellet 0.5mm" : doc <= 60 ? "Pellet 1mm" : "Pellet 1.5mm";
}

// Proyeksi kebutuhan pakan dari DOC sekarang s/d target (default 120 hari).
// Mengembalikan total kg, kebutuhan pakan hari besok, dan rincian per minggu.
export function projectRemainingFeed(docNow: number, population: number, srPct: number, targetDoc = 120) {
  const weeks: { week: number; kg: number; docStart: number }[] = [];
  let totalKg = 0, dailyTodayKg = 0;
  for (let d = docNow + 1; d <= targetDoc; d++) {
    const biomass = (population * (srPct / 100) * estimateAbw(d)) / 1000;
    const feed = (biomass * feedingRatePct(d)) / 100;
    if (d === docNow + 1) dailyTodayKg = feed;
    totalKg += feed;
    const w = Math.floor((d - docNow - 1) / 7);
    (weeks[w] ||= { week: w + 1, kg: 0, docStart: d }).kg += feed;
  }
  return { totalKg, dailyTodayKg, weeks };
}

export function getProbioticSchedule(doc: number, area: number) {
  const depth = 1.5;
  const volumeM3 = area * depth;

  let doseRate = 1.5;
  let brand = "Mix Bacillus + Lactobacillus";
  let freq = 1;
  let method: "Ke Air" | "Campur Pakan" = "Ke Air";
  let fase = "Pembesaran";

  if (doc <= 30) {
    doseRate = 2.5;
    brand = "Bacillus spp.";
    freq = 2;
    method = "Campur Pakan" as const;
    fase = "Nursery";
  } else if (doc <= 60) {
    doseRate = 2.0;
    brand = "Lactobacillus";
    freq = 2;
    method = "Ke Air" as const;
    fase = "Pembesaran Awal";
  }

  const doseMl = Math.round(volumeM3 * doseRate);

  return {
    doc,
    fase,
    jenis: brand,
    doseMl,
    frequencyPerWeek: freq,
    method,
  };
}

// Estimasi target panen berdasarkan jumlah benur & luas kolam (SNI 8008:2014).
// Menggunakan ABW & SR estimasi pada DOC 120 (umur panen standar).
// Returns: { yieldKgPerM2, totalKg, abwGram, srPct } - yieldKgPerM2 dibulatkan 2 desimal.
export function estimateHarvestYield(population: number, areaM2: number, targetDoc = 120) {
  if (population <= 0 || areaM2 <= 0) return { yieldKgPerM2: 0, totalKg: 0, abwGram: 0, srPct: 0 };
  const abwGram = estimateAbw(targetDoc);
  const srPct = estimateSr(targetDoc); // 80% for DOC 91+
  const totalKg = Number(((population * (srPct / 100) * abwGram) / 1000).toFixed(1));
  const yieldKgPerM2 = Number((totalKg / areaM2).toFixed(2));
  return { yieldKgPerM2, totalKg, abwGram, srPct };
}

// Jadwal pakan realistis (jam siang, bukan tengah malam).
// Key = mealsPerDay, value = array jam (0-23).
export const FEED_SCHEDULES: Record<number, number[]> = {
  3: [7, 12, 17],
  4: [6, 10, 14, 18],
  5: [6, 9, 12, 15, 18],
};

// Hitung waktu pakan terjadwal BERIKUTNYA setelah fterTime (ms epoch).
// Mengembalikan ms epoch dari jadwal pakan berikutnya.
// Jika hari ini sudah lewat semua jadwal, ambil jadwal pertama besok.
export function nextFeedTime(afterTime: number, mealsPerDay: number): number {
  const schedule = FEED_SCHEDULES[mealsPerDay] || FEED_SCHEDULES[4];
  const after = new Date(afterTime);
  const afterH = after.getHours();
  const afterM = after.getMinutes();

  // Cari jam berikutnya hari ini
  for (const hour of schedule) {
    if (hour > afterH || (hour === afterH && afterM < 1)) {
      const next = new Date(after);
      next.setHours(hour, 0, 0, 0);
      return next.getTime();
    }
  }

  // Semua jadwal hari ini sudah lewat -> ambil jadwal pertama besok
  const tomorrow = new Date(after);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(schedule[0], 0, 0, 0);
  return tomorrow.getTime();
}
