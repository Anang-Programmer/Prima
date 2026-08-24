"use client";

import { TARGET_HARI } from "../_lib/constants";

export function DocCard({ d, stage, popLabel, tab, setTab, onEditAbw, onEndCycle }: any) {
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 mb-4">
        {/* ============ TIPE & PROGRESS ============ */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DOC</p>
            <h2 className="mt-0.5 text-2xl font-black text-slate-800">{d.doc} hari</h2>
          </div>
          <div className="text-right">
            {d.cycle ? (
              <>
                <span className="inline-block rounded-full bg-[#E5F5F7] px-2.5 py-1 text-[10px] font-bold text-[#2ABFC8]">{stage}</span>
                <p className="mt-1 text-sm font-extrabold text-[#1C9098]">FCR {d.fcr.toFixed(2)}</p>
              </>
            ) : (
              <span className="inline-block rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500">Non Aktif</span>
            )}
          </div>
        </div>

        {/* ============ PROGRESS BAR ============ */}
        <div className="px-4 py-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#2ABFC8] transition-all duration-1000" style={{ width: `${Math.min((d.doc / TARGET_HARI) * 100, 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
            <span>Hari ke-{d.doc}</span>
            <span>Target {TARGET_HARI} hari</span>
          </div>
        </div>

        {/* Tombol Aksi (Nempel di bawah kartu 1) */}
        {d.cycle && (() => {
          const isSamplingDoc = d.doc === 15 || d.doc === 30 || (d.doc > 30 && (d.doc - 37) % 7 === 0);
          const showUpdateAbw = isSamplingDoc || !!d.abwSamplingAlert;

          if (d.doc >= TARGET_HARI) {
            return (
              <button onClick={onEndCycle} className="w-full rounded-b-2xl bg-gradient-to-r from-[#3EC4CE] to-[#125B69] py-3.5 text-sm font-bold text-white transition active:scale-95 flex items-center justify-center gap-2">
                Panen kolam <span className="text-lg leading-none mb-0.5">→</span>
              </button>
            );
          }
          
          if (showUpdateAbw) {
            return (
              <button onClick={onEditAbw} className="w-full rounded-b-2xl bg-gradient-to-r from-[#3EC4CE] to-[#125B69] py-3.5 text-sm font-bold text-white transition active:scale-95 flex items-center justify-center gap-2">
                Update ABW <span className="text-lg leading-none mb-0.5">→</span>
              </button>
            );
          }
          
          return null;
        })()}
      </section>

      {/* ============ METRIK UTAMA ============ */}
      <section className="grid grid-cols-4 divide-x divide-slate-100 rounded-2xl bg-white py-3 shadow-sm mb-4">
        {[
          [d.cycle ? popLabel : "....", "Populasi"],
          [d.cycle ? `${d.biomass} kg` : ".... kg", "Biomassa"],
          [d.cycle ? `${d.abw}g` : ".... g", "ABW"],
          [d.cycle ? `${d.cycle.target_yield_kg_per_m2 ?? 3} kg/m²` : "....", "Target"],
        ].map(([v, l]) => (
          <div key={l} className="px-1 text-center flex flex-col items-center">
            <div className="flex items-center gap-1 justify-center">
              <p className="text-sm font-extrabold">{v}</p>
            </div>
            <p className="text-[10px] text-slate-500">{l}</p>
          </div>
        ))}
      </section>

      {/* ============ BANNER AKHIRI SIKLUS (Jika DOC >= TARGET) ============ */}
      {d.doc >= TARGET_HARI && (
        <div className="mx-0 mt-0 mb-4 bg-[#CFE8EB] flex items-center justify-between px-4 py-4 rounded-b-none border-t-0 shadow-sm">
          <span className="text-sm font-semibold text-slate-800">Sudah panen</span>
          <button onClick={onEndCycle} className="bg-[#2ABFC8] hover:bg-[#1C9098] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors">
            Akhiri Siklus
          </button>
        </div>
      )}

      {/* ============ TABS ============ */}
      <div className="flex border-b border-slate-200">
        {["Pakan", "Log Book", "Proyeksi", "Monitoring"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px flex-1 border-b-2 pb-2 text-center text-xs font-semibold transition ${tab === t ? "border-[#1C9098] text-[#1C9098]" : "border-transparent text-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );
}
