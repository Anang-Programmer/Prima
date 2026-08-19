"use client";

import { TARGET_HARI } from "../_lib/constants";

export function DocCard({ d, stage, popLabel, tab, setTab, onEditAbw }: any) {
  return (
    <>
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">DOC</span>
                  <span className="rounded-full bg-[#FDEBDD] px-2 py-0.5 text-[10px] font-bold text-[#F2811B]">{stage}</span>
                </div>
                <div className="mt-1 flex items-end justify-between">
                  <p className="text-2xl font-extrabold">{d.doc} hari</p>
                  <p className={`text-sm font-bold ${d.fcr > 1.5 ? "text-[#F2811B]" : "text-[#3E97A5]"}`}>FCR {d.fcr.toFixed(2)}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#4C9AA6]" style={{ width: `${Math.min(100, (d.doc / TARGET_HARI) * 100)}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Hari ke-{d.doc}</span>
                  <span>Target {TARGET_HARI} hari</span>
                </div>
              </section>

              {/* ============ 4 STAT ============ */}
              <section className="grid grid-cols-4 divide-x divide-slate-100 rounded-2xl bg-white py-3 shadow-sm">
                {[
                  [popLabel, "Populasi"],
                  [`${d.biomass} kg`, "Biomassa"],
                  [`${d.abw}g`, "ABW"],
                  [`${d.cycle.target_yield_kg_per_m2 ?? 3} kg/m²`, "Target"],
                ].map(([v, l]) => (
                  <div key={l} className="px-1 text-center flex flex-col items-center">
                    <div className="flex items-center gap-1 justify-center">
                      <p className="text-sm font-extrabold">{v}</p>
                      {l === "ABW" && onEditAbw && (
                        <button onClick={onEditAbw} className="text-slate-400 hover:text-[#3E97A5] transition-colors p-0.5 rounded-full hover:bg-slate-100">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{l}</p>
                  </div>
                ))}
              </section>

              {/* ============ TABS ============ */}
              <div className="flex border-b border-slate-200">
                {["Pakan", "Log Book", "Proyeksi", "Monitoring"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`-mb-px flex-1 border-b-2 pb-2 text-center text-xs font-semibold transition ${tab === t ? "border-[#3E97A5] text-[#3E97A5]" : "border-transparent text-slate-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
    </>
  );
}
