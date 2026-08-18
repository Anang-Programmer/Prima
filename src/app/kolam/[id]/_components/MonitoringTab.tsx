"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function MonitoringTab({ d }: { d: any }) {
  return (
    <section className="space-y-4 pl-6 pr-2">
      {/* Status FCR Card */}
      <div className="rounded-xl bg-[#BEE5E8] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#0A4D58]">Status FCR</span>
          <div className="text-right">
            <span className="block text-[9px] text-[#0A4D58]">Target</span>
            <span className="text-[11px] font-bold text-[#0A4D58]">&lt; 1.4</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#0A4D58]">FCR {d.fcr}</span>
          {d.fcr <= 1.4 ? (
            <span className="flex items-center gap-1 rounded-full bg-[#4C9AA6] px-2.5 py-1 text-[10px] font-semibold text-white">
              Efisien <CheckCircle2 size={10} />
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold text-white">
              Perhatian <AlertTriangle size={10} />
            </span>
          )}
        </div>
      </div>

      {/* Survival Rate Card */}
      <div className="rounded-xl bg-[#BEE5E8] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#0A4D58]">Survival Rate</span>
          <div className="text-right">
            <span className="block text-[9px] text-[#0A4D58]">Target</span>
            <span className="text-[11px] font-bold text-[#0A4D58]">
              {d.cycle.initial_shrimp_count.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
        <div className="mt-1">
          <span className="text-2xl font-bold text-[#0A4D58]">{d.sr}%</span>
        </div>
      </div>

      {/* ABW Chart */}
      <div className="mt-8">
        <h4 className="mb-6 text-xs font-bold text-slate-800">Pertumbuhan ABW (gram)</h4>
        {(() => {
          const yMaxAbw = Math.max(50, ...d.abwChart.map((x: any) => x.act || 0), ...d.abwChart.map((x: any) => x.std));
          const yMaxRound = Math.ceil(yMaxAbw / 10) * 10;
          return (
            <div className="relative h-48 w-full">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                {/* Grid lines */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={100 - ratio * 100}
                    x2="100"
                    y2={100 - ratio * 100}
                    stroke="#E2E8F0"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* SNI standard (Dashed line) */}
                <polyline
                  fill="none"
                  stroke="#BEE5E8"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  vectorEffect="non-scaling-stroke"
                  points={d.abwChart
                    .map((p: any, i: number) => `${(i / Math.max(1, d.abwChart.length - 1)) * 100},${100 - (p.std / yMaxRound) * 100}`)
                    .join(" ")}
                />

                {/* Actual ABW (Solid line) */}
                {d.abwChart.some((p: any) => p.act !== null) && (
                  <polyline
                    fill="none"
                    stroke="#4C9AA6"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    points={d.abwChart
                      .map((p: any, i: number) => (p.act !== null ? `${(i / Math.max(1, d.abwChart.length - 1)) * 100},${100 - (p.act / yMaxRound) * 100}` : null))
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}

                {/* Actual Dots */}
                {d.abwChart.map(
                  (p: any, i: number) =>
                    p.act !== null && (
                      <circle
                        key={i}
                        cx={(i / Math.max(1, d.abwChart.length - 1)) * 100}
                        cy={100 - (p.act / yMaxRound) * 100}
                        r="4"
                        fill="#4C9AA6"
                        stroke="#fff"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                )}
              </svg>

              {/* X Axis Labels */}
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                {d.abwChart.map((p: any) => (
                  <span key={p.label}>{p.label}</span>
                ))}
              </div>

              {/* Y Axis Labels */}
              <div className="absolute -left-6 bottom-5 top-0 flex w-5 flex-col justify-between text-right text-[10px] text-slate-400">
                <span>{yMaxRound}</span>
                <span>{Math.round(yMaxRound * 0.8)}</span>
                <span>{Math.round(yMaxRound * 0.6)}</span>
                <span>{Math.round(yMaxRound * 0.4)}</span>
                <span>{Math.round(yMaxRound * 0.2)}</span>
                <span>0</span>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}