"use client";

import { Droplets, Loader2 } from "lucide-react";

export function AncoModal(props: any) {
  const { ancoModal, ancoResult, setAncoResult, setAncoModal, busy, submitAnco } = props;
  if (!ancoModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Tutup" onClick={() => setAncoModal(null)} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <Droplets size={18} className="text-[#4C9AA6]" />
          <h3 className="text-base font-extrabold text-slate-800">Laporan Cek Anco</h3>
        </div>
        <p className="mb-5 text-xs text-slate-500">Bagaimana kondisi pakan di dalam anco saat ini?</p>

        <div className="space-y-2.5">
          {["Habis", "Sisa Sedikit", "Sisa Banyak"].map((opt) => (
            <button
              key={opt}
              onClick={() => setAncoResult(opt)}
              className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left transition ${
                ancoResult === opt ? "border-[#4C9AA6] bg-[#4C9AA6]/10" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${ancoResult === opt ? "border-[#4C9AA6] bg-[#4C9AA6]" : "border-slate-300"}`} />
              <span className={`text-sm font-semibold ${ancoResult === opt ? "text-[#3E97A5]" : "text-slate-600"}`}>{opt}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
          {ancoResult === "Habis" && "Dosis aman. Pertahankan atau naikkan perlahan sesuai target."}
          {ancoResult === "Sisa Sedikit" && "AI akan menyarankan kurangi pakan 5-10% untuk sesi berikutnya."}
          {ancoResult === "Sisa Banyak" && "Indikasi overfeeding. AI akan menyarankan kurangi pakan 20-30%."}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setAncoModal(null)}
            disabled={busy}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition active:scale-[0.98] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={submitAnco}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#4C9AA6] py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Simpan Log"}
          </button>
        </div>
      </div>
    </div>
  );
}
