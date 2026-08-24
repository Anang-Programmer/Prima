// Konstanta & helper presentasi untuk halaman detail kolam.
// Dipindah apa adanya dari page.tsx (ZERO perubahan nilai/logika).

export const TARGET_HARI = 120;

export const inputCls =
  "w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50";

export const fmt1 = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export const fmtFeed = (kg: number) => {
  const grams = kg * 1000;
  if (grams < 1) return `${grams.toFixed(1)}g`;
  if (grams < 1000) return `${Math.round(grams)}g`;
  return `${kg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
};

export const fmtFeedWithHint = (kg: number) => {
  const grams = Math.round(kg * 1000);
  if (kg < 1) return `${grams}g`;
  return `${kg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg (${grams.toLocaleString("id-ID")}g)`;
};