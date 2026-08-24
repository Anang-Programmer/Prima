"use client";

import { fmt1 } from "../_lib/constants";

export default function ProjectionTab({ d }: { d: any }) {
  return (
    <section>
      <h4 className="mb-4 text-xs font-bold text-slate-800">Kebutuhan Pakan Mingguan</h4>
      
      {(() => {
        const maxFeed = Math.max(...d.proyeksiMingguan.map((w: any) => w.amount), 0.1);
        const yMax = maxFeed * 1.2; 
        return (
          <div className="flex h-48 w-full">
            {/* Y-Axis */}
            <div className="flex flex-col justify-between pb-6 pr-3 text-right text-[10px] text-slate-500">
              <span>{fmt1(yMax)}</span>
              <span>{fmt1(yMax * 0.75)}</span>
              <span>{fmt1(yMax * 0.5)}</span>
              <span>{fmt1(yMax * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart Area */}
            <div className="relative flex flex-1 items-end justify-between border-b border-slate-300 px-2 pb-0">
              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <div
                  key={ratio}
                  className="absolute left-0 right-0 border-b border-dashed border-slate-200"
                  style={{ bottom: `${ratio * 100}%` }}
                />
              ))}

              {/* Bars */}
              {d.proyeksiMingguan.map((w: any, i: number) => (
                <div key={i} className="group relative z-10 flex h-full flex-col items-center justify-end px-0.5" style={{ width: `${100 / d.proyeksiMingguan.length}%` }}>
                  <div
                    className={`w-full max-w-[24px] rounded-t-sm transition-all ${w.isReal ? "bg-[#2ABFC8]" : "bg-[#2ABFC8]/40 border-t border-[#2ABFC8]"}`}
                    style={{ height: `${(w.amount / yMax) * 100}%`, minHeight: "2px" }}
                  />
                  {(d.proyeksiMingguan.length <= 8 || i % 2 === 0) && (
                    <span className="absolute -bottom-6 text-center text-[9px] leading-tight text-slate-500 whitespace-nowrap">
                      {w.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <h4 className="mb-3 mt-10 text-xs font-bold text-slate-800">Rincian Pakan Perminggu</h4>
      <div className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
        {d.proyeksiMingguan.map((w: any, i: number) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold text-slate-700">{w.listLabel}</span>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">{fmt1(w.amount)}kg</p>
              <p className={`text-[10px] ${w.isReal ? "text-emerald-600 font-medium" : "text-slate-400"}`}>{w.type}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}