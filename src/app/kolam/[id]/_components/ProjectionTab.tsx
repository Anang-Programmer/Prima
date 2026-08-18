"use client";

import { fmt1 } from "../_lib/constants";

export default function ProjectionTab({ d }: { d: any }) {
  return (
    <section>
      <h4 className="mb-4 text-xs font-bold text-slate-800">Kebutuhan Pakan Mingguan</h4>
      
      {(() => {
        const maxFeed = Math.max(...d.proyeksiMingguan.map((w: any) => w.amount), 1);
        const yMax = Math.ceil(maxFeed / 150) * 150; // Step by 150 to mimic screenshot
        return (
          <div className="flex h-48 w-full">
            {/* Y-Axis */}
            <div className="flex flex-col justify-between pb-6 pr-3 text-right text-[10px] text-slate-500">
              <span>{yMax}</span>
              <span>{yMax * 0.75}</span>
              <span>{yMax * 0.5}</span>
              <span>{yMax * 0.25}</span>
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
                <div key={i} className="group relative z-10 flex h-full w-[12%] flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-[#4C9AA6] transition-all"
                    style={{ height: `${(w.amount / yMax) * 100}%`, minHeight: "2px" }}
                  />
                  <span className="absolute -bottom-6 text-center text-[10px] leading-tight text-slate-500 whitespace-pre">
                    {w.label}
                  </span>
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
              <p className="text-[10px] text-slate-400">{w.type}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}