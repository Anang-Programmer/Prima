"use strict";
// Kalkulasi pakan & probiotik (Sesuai dengan AI-LOGIC.md - SNI 8008:2014 & Penyesuaian Lapangan)
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEED_SCHEDULES = void 0;
exports.estimateAbw = estimateAbw;
exports.estimateSr = estimateSr;
exports.calculateDailyFeed = calculateDailyFeed;
exports.feedingRatePct = feedingRatePct;
exports.pelletType = pelletType;
exports.projectRemainingFeed = projectRemainingFeed;
exports.getProbioticSchedule = getProbioticSchedule;
exports.estimateHarvestYield = estimateHarvestYield;
exports.nextFeedTime = nextFeedTime;
function estimateAbw(doc) {
    if (doc <= 0)
        return 0.001;
    // ABW (gram) = 0.0005 * DOC^2 + 0.05 * DOC
    return Number((0.0005 * Math.pow(doc, 2) + 0.05 * doc).toFixed(2));
}
function estimateSr(doc) {
    if (doc <= 30)
        return 95;
    if (doc <= 60)
        return 90;
    if (doc <= 90)
        return 85;
    return 80;
}
function calculateDailyFeed(doc, population, area, abwOverride, srPctOverride) {
    var abwGram = abwOverride && abwOverride > 0 ? abwOverride : estimateAbw(doc);
    var srPct = srPctOverride && srPctOverride > 0 ? srPctOverride : estimateSr(doc);
    var shrimpCount = Math.round(population * (srPct / 100));
    var biomassKg = Number(((shrimpCount * abwGram) / 1000).toFixed(2));
    // Use the smooth feeding rate curve (same as feedingRatePct function below)
    var frPct = feedingRatePct(doc);
    var dailyFeedKg = (biomassKg * frPct) / 100;
    // Density adjustment
    var density = shrimpCount / area;
    if (density > 100)
        dailyFeedKg *= 1.1; // +10%
    else if (density < 50)
        dailyFeedKg *= 0.95; // -5%
    dailyFeedKg = Number(dailyFeedKg.toFixed(2));
    var mealsPerDay = doc <= 90 ? 4 : 5;
    var ancoIntervalHours = 2; // Default for 1-30
    if (doc > 30 && doc <= 45)
        ancoIntervalHours = 2.5;
    else if (doc > 45 && doc <= 60)
        ancoIntervalHours = 2.25;
    else if (doc > 60 && doc <= 90)
        ancoIntervalHours = 1.75;
    else if (doc > 90)
        ancoIntervalHours = 1.25;
    return {
        doc: doc,
        abwGram: abwGram,
        shrimpCount: shrimpCount,
        biomassKg: biomassKg,
        feedingRatePct: frPct,
        dailyFeedKg: dailyFeedKg,
        mealsPerDay: mealsPerDay,
        feedPerMealKg: +(dailyFeedKg / mealsPerDay).toFixed(1),
        ancoIntervalHours: ancoIntervalHours,
    };
}
// Feeding rate (% biomassa) per DOC - Berdasarkan Standar SNI 8008:2014
function feedingRatePct(doc) {
    if (doc <= 15)
        return 20; // SNI 15-25%, rata-rata 20%
    if (doc <= 30)
        return 12.5; // SNI 10-15%, rata-rata 12.5%
    if (doc <= 45)
        return 8.5; // SNI 7-10%, rata-rata 8.5%
    if (doc <= 60)
        return 6; // SNI 5-7%, rata-rata 6%
    if (doc <= 90)
        return 3.5; // SNI 2-5%, rata-rata 3.5%
    return 1.25; // SNI 1-1.5%, rata-rata 1.25%
}
// Jenis pelet berdasarkan umur udang (DOC).
function pelletType(doc) {
    return doc <= 30 ? "Pellet 0.5mm" : doc <= 60 ? "Pellet 1mm" : "Pellet 1.5mm";
}
// Proyeksi kebutuhan pakan dari DOC sekarang s/d target (default 120 hari).
// Mengembalikan total kg, kebutuhan pakan hari besok, dan rincian per minggu.
function projectRemainingFeed(docNow, population, srPct, targetDoc) {
    if (targetDoc === void 0) { targetDoc = 120; }
    var weeks = [];
    var totalKg = 0, dailyTodayKg = 0;
    for (var d = docNow + 1; d <= targetDoc; d++) {
        var biomass = (population * (srPct / 100) * estimateAbw(d)) / 1000;
        var feed = (biomass * feedingRatePct(d)) / 100;
        if (d === docNow + 1)
            dailyTodayKg = feed;
        totalKg += feed;
        var w = Math.floor((d - docNow - 1) / 7);
        (weeks[w] || (weeks[w] = { week: w + 1, kg: 0, docStart: d })).kg += feed;
    }
    return { totalKg: totalKg, dailyTodayKg: dailyTodayKg, weeks: weeks };
}
function getProbioticSchedule(doc, area) {
    var depth = 1.5;
    var volumeM3 = area * depth;
    var doseRate = 1.5;
    var brand = "Mix Bacillus + Lactobacillus";
    var freq = 1;
    var method = "Ke Air";
    var fase = "Pembesaran";
    if (doc <= 30) {
        doseRate = 2.5;
        brand = "Bacillus spp.";
        freq = 2;
        method = "Campur Pakan";
        fase = "Nursery";
    }
    else if (doc <= 60) {
        doseRate = 2.0;
        brand = "Lactobacillus";
        freq = 2;
        method = "Ke Air";
        fase = "Pembesaran Awal";
    }
    var doseMl = Math.round(volumeM3 * doseRate);
    return {
        doc: doc,
        fase: fase,
        jenis: brand,
        doseMl: doseMl,
        frequencyPerWeek: freq,
        method: method,
    };
}
// Estimasi target panen berdasarkan jumlah benur & luas kolam (SNI 8008:2014).
// Menggunakan ABW & SR estimasi pada DOC 120 (umur panen standar).
// Returns: { yieldKgPerM2, totalKg, abwGram, srPct } - yieldKgPerM2 dibulatkan 2 desimal.
function estimateHarvestYield(population, areaM2, targetDoc) {
    if (targetDoc === void 0) { targetDoc = 120; }
    if (population <= 0 || areaM2 <= 0)
        return { yieldKgPerM2: 0, totalKg: 0, abwGram: 0, srPct: 0 };
    var abwGram = estimateAbw(targetDoc);
    var srPct = estimateSr(targetDoc); // 80% for DOC 91+
    var totalKg = Number(((population * (srPct / 100) * abwGram) / 1000).toFixed(1));
    var yieldKgPerM2 = Number((totalKg / areaM2).toFixed(2));
    return { yieldKgPerM2: yieldKgPerM2, totalKg: totalKg, abwGram: abwGram, srPct: srPct };
}
// Jadwal pakan realistis (jam siang, bukan tengah malam).
// Key = mealsPerDay, value = array jam (0-23).
exports.FEED_SCHEDULES = {
    3: [7, 12, 17],
    4: [6, 10, 14, 18],
    5: [6, 9, 12, 15, 18],
};
// Hitung waktu pakan terjadwal BERIKUTNYA setelah fterTime (ms epoch).
// Mengembalikan ms epoch dari jadwal pakan berikutnya.
// Jika hari ini sudah lewat semua jadwal, ambil jadwal pertama besok.
function nextFeedTime(afterTime, mealsPerDay) {
    var schedule = exports.FEED_SCHEDULES[mealsPerDay] || exports.FEED_SCHEDULES[4];
    var after = new Date(afterTime);
    var afterH = after.getHours();
    var afterM = after.getMinutes();
    // Cari jam berikutnya hari ini
    for (var _i = 0, schedule_1 = schedule; _i < schedule_1.length; _i++) {
        var hour = schedule_1[_i];
        if (hour > afterH || (hour === afterH && afterM < 1)) {
            var next = new Date(after);
            next.setHours(hour, 0, 0, 0);
            return next.getTime();
        }
    }
    // Semua jadwal hari ini sudah lewat -> ambil jadwal pertama besok
    var tomorrow = new Date(after);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(schedule[0], 0, 0, 0);
    return tomorrow.getTime();
}
