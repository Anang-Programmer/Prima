// ============================================================
// PRIMA - Logika Rekomendasi HISTORIS (sumber kebenaran TUNGGAL)
//
// ATURAN TUNGGAL (tidak ada tengah-tengah):
//   SEMUA syarat mutlak lolos  -> rekomendasi = data siklus sukses
//   SATU SAJA syarat gagal     -> fallback total ke SNI
//
// Syarat mutlak:
//   1. Siklus lama SELESAI & data panen lengkap (biomass & FCR > 0)
//   2. Padat tebar identik (ekor/m2, dibulat 1 desimal, lintas kolam boleh)
//   3. FCR siklus lama dalam standar: 0 < FCR < 1.5
//   5. Jika beberapa lolos -> pilih FCR TERRENDAH (paling sukses)
// ============================================================

// UJI COBA sementara: 3. Standar final = 1.5. JANGAN lupa kembalikan sebelum rilis!
export const FCR_MAX_HISTORIS = 3;
export const DOC_WINDOW_DAYS = 3;

export type HistorisVerdict = {
  source: "historis" | "sni";
  label: string; // teks badge kartu
  feedKg: number | null; // null = kartu pakai baseline SNI/anco
  probMl: number | null; // null = kartu probiotik pakai baseline SNI
  gagalDi: string[]; // alasan human-readable (checklist debug)
  matchedCycleId: string | null;
};

export function makeSniVerdict(gagalDi: string[]): HistorisVerdict {
  return { source: "sni", label: "SNI 8008:2014", feedKg: null, probMl: null, gagalDi, matchedCycleId: null };
}

// Padat tebar = ekor/m2, dibulatkan 1 desimal agar perbandingan stabil.
export function densityOf(initialCount: any, areaM2: any): number {
  const c = Number(initialCount);
  const a = Number(areaM2);
  if (!Number.isFinite(c) || !Number.isFinite(a) || c <= 0 || a <= 0) return NaN;
  return Math.round((c / a) * 10) / 10;
}


function selesaiDanLengkap(c: any): boolean {
  return (
    c?.status === "Selesai" &&
    Number(c?.harvest_biomass_kg) > 0 &&
    Number(c?.harvest_fcr) > 0
  );
}

/**
 * Saring siklus lama terhadap 4 syarat mutlak.
 * Return: matched (siklus terbaik/FCR terendah) atau null + daftar alasan gagal.
 */
export function evaluateHistoris(
  currentCycle: any,
  currentPond: any,
  pastCycles: any[],
  pondAreaById: Map<string, number>
): { matched: any | null; gagalDi: string[] } {
  const curDensity = densityOf(currentCycle?.initial_shrimp_count, currentPond?.area_m2);

  const candidates = (pastCycles || []).filter((c: any) => c?.id !== currentCycle?.id);

  if (candidates.length === 0) {
    return {
      matched: null,
      gagalDi: ["Belum ada siklus lama yang selesai (status 'Selesai' + data panen lengkap)."],
    };
  }

  let best: any | null = null;
  for (const c of candidates) {
    const fcr = Number(c.harvest_fcr) || 0;
    const density = densityOf(c.initial_shrimp_count, pondAreaById.get(c.pond_id));
    const ok =
      selesaiDanLengkap(c) &&
      density === curDensity &&
      fcr > 0 &&
      fcr < FCR_MAX_HISTORIS;
    if (ok && (!best || fcr < Number(best.harvest_fcr))) best = c;
  }

  if (!best) {
    // Susun alasan gagal berdasarkan kandidat terakhir (yang paling dekat memenuhi).
    const c = candidates[candidates.length - 1];
    const density = densityOf(c.initial_shrimp_count, pondAreaById.get(c.pond_id));
    const fcr = Number(c.harvest_fcr) || 0;
    const gagalDi: string[] = [];
    if (!selesaiDanLengkap(c)) {
      gagalDi.push("Siklus lama belum lengkap: harus diakhiri lewat 'Akhiri Siklus' agar data panen terisi.");
    }
    if (!(density === curDensity)) {
      gagalDi.push(
        `Padat tebar beda: siklus lama ${Number.isFinite(density) ? density : "?"} ekor/m² vs sekarang ${Number.isFinite(curDensity) ? curDensity : "?"} ekor/m².`
      );
    }
    if (!(fcr > 0 && fcr < FCR_MAX_HISTORIS)) {
      gagalDi.push(`FCR siklus lama ${fcr > 0 ? fcr : "-"} di luar standar historis (< ${FCR_MAX_HISTORIS}).`);
    }
    return { matched: null, gagalDi };
  }

  return { matched: best, gagalDi: [] };
}

/**
 * Bangun angka rekomendasi nyata dari siklus yang lolos.
 * - Pakan: rata-rata HARIAN pada jendela DOC sekarang +/- 3 hari;
 *   kosong -> fallback rata-rata harian se-siklus; kosong juga -> null (fallback SNI).
 * - Probiotik: total ml / jumlah sesi; tanpa sesi -> null (fallback SNI).
 */
export function buildHistorisRecommendation(
  matchedCycle: any,
  currentDoc: number,
  feeds: any[],
  probs: any[]
): { feedKg: number | null; probMl: number | null; label: string } {
  const fcr = Number(matchedCycle.harvest_fcr) || 0;

  // Tanggal panen siklus lama -> format singkat dd/mm/yy untuk badge
  const endStr = matchedCycle.end_date ? String(matchedCycle.end_date).slice(0, 10) : "";
  const parts = endStr.split("-");
  const tgl = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(2)}` : "";
  const label = `Historis Panen${tgl ? ` (${tgl})` : ` (FCR ${fcr})`}`;

  const startMs = matchedCycle.start_date
    ? new Date(String(matchedCycle.start_date).slice(0, 10) + "T00:00:00").getTime()
    : NaN;

  // ---- Pakan ----
  let feedKg: number | null = null;
  if (Number.isFinite(startMs) && (feeds || []).length > 0) {
    const perDay = new Map<string, number>();
    for (const f of feeds) {
      const t = new Date(f.date).getTime();
      if (!Number.isFinite(t)) continue;
      const key = new Date(t).toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + (Number(f.feed_amount_kg) || 0));
    }
    const windowVals: number[] = [];
    const allVals: number[] = [];
    for (const [key, kg] of perDay.entries()) {
      allVals.push(kg);
      const doc = Math.floor((new Date(key + "T00:00:00").getTime() - startMs) / 86400000);
      if (doc >= currentDoc - DOC_WINDOW_DAYS && doc <= currentDoc + DOC_WINDOW_DAYS) {
        windowVals.push(kg);
      }
    }
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const rounded = (n: number | null) => (n == null ? null : +n.toFixed(2));
    feedKg = rounded(avg(windowVals)) ?? rounded(avg(allVals));
  }

  // ---- Probiotik ----
  let probMl: number | null = null;
  const sessions = (probs || []).length;
  if (sessions > 0) {
    const totalMl = probs.reduce((a: number, p: any) => a + (Number(p.amount_ml) || 0), 0);
    const v = totalMl / sessions;
    probMl = v > 0 ? Math.round(v) : null;
  }

  return { feedKg, probMl, label };
}
