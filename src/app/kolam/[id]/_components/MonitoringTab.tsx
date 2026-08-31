"use client";

import { CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { fmt1 } from "../_lib/constants";

export default function MonitoringTab({ d }: { d: any }) {
  return (
    <section className="space-y-4">
      {/* Status FCR Card */}
      <div className="rounded-xl bg-[#BEE5E8] p-4 ">
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
            <span className="flex items-center gap-1 rounded-full bg-[#2ABFC8] px-2.5 py-1 text-[10px] font-semibold text-white">
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
      <div className="rounded-xl bg-[#BEE5E8] p-4 ">
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

      {/* Alert Sampling ABW */}
      {d.abwSamplingAlert && (
        <div
          className={`rounded-xl p-4  flex items-start gap-3 ${d.abwSamplingAlert.type === "missed"
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
            }`}
        >
          <Scale
            size={18}
            className={d.abwSamplingAlert.type === "missed" ? "text-red-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"}
          />
          <div>
            <p
              className={`text-[11px] font-bold ${d.abwSamplingAlert.type === "missed" ? "text-red-700" : "text-amber-700"
                }`}
            >
              {d.abwSamplingAlert.type === "missed" ? "Sampling ABW Terlewat!" : "Pengingat Sampling ABW"}
            </p>
            <p
              className={`mt-0.5 text-[10px] ${d.abwSamplingAlert.type === "missed" ? "text-red-600" : "text-amber-600"
                }`}
            >
              {d.abwSamplingAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* ABW Chart Harian */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800">Pertumbuhan ABW (gram)</h4>
          <div className="flex items-center gap-3 text-[9px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-[#2ABFC8]" /> Aktual
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-[#94D1D9]" /> Target SNI
            </span>
          </div>
        </div>

        {(() => {
          const daily: { doc: number; act: number | null; std: number }[] = d.abwDaily || [];
          const samplingPoints: { doc: number; act: number }[] = (d.abwChart || []).filter((p: any) => p.act !== null);

          if (daily.length === 0) {
            return (
              <div className="flex h-32 w-full items-center justify-center rounded-xl bg-[#F1F4F5] text-center text-[11px] text-slate-400">
                Belum ada data ABW.
                <br />
                Sampling pertama di H-15.
              </div>
            );
          }

          // Fixed target is 120 days (M1 = 30, M2 = 60, M3 = 90, M4 = 120)
          const chartTotalDays = 120;
          
          // Helper for SNI target up to 120 days
          const getStdAbw = (doc: number) => Number((0.0005 * Math.pow(doc, 2) + 0.05 * doc).toFixed(2));
          const maxStd = getStdAbw(120);
          
          const maxAct = Math.max(0.1, ...daily.map((x) => x.act ?? 0));
          const yMax = Math.max(maxStd, maxAct) * 1.1;

          // helper posisi: X dalam persentase (0% - 100%), Y (0 - 100)
          const getX = (doc: number) => (doc / chartTotalDays) * 100;
          const getY = (val: number) => 100 - (val / yMax) * 100;

          // Segmen garis aktual (smooth)
          const actualSegments: string[][] = [];
          let current: string[] = [];
          daily.forEach((p) => {
            if (p.act !== null) {
              current.push(`${getX(p.doc)},${getY(p.act)}`);
            } else {
              if (current.length > 1) actualSegments.push(current);
              current = [];
            }
          });
          if (current.length > 1) actualSegments.push(current);

          // Garis SNI target (dari 0 sampai 120)
          const stdPointsArr: string[] = [];
          for(let i = 0; i <= 120; i += 5) {
            stdPointsArr.push(`${getX(i)},${getY(getStdAbw(i))}`);
          }
          stdPointsArr.push(`${getX(120)},${getY(getStdAbw(120))}`);
          const stdPoints = stdPointsArr.join(" ");

          const yRatios = [1, 0.75, 0.5, 0.25, 0];
          const xLabels = [
            { label: "M1", doc: 30 },
            { label: "M2", doc: 60 },
            { label: "M3", doc: 90 },
            { label: "M4", doc: 120 }
          ];

          return (
            <div className="relative h-48 w-full pl-6 pr-1">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="actualGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2ABFC8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2ABFC8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {yRatios.map((ratio, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={getY(yMax * ratio)}
                    x2="100"
                    y2={getY(yMax * ratio)}
                    stroke="#E2E8F0"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* Gradient Fill Aktual */}
                {actualSegments.map((seg, i) => {
                  if (seg.length < 2) return null;
                  const startX = seg[0].split(",")[0];
                  const endX = seg[seg.length - 1].split(",")[0];
                  const fillPoints = [...seg, `${endX},100`, `${startX},100`].join(" ");
                  return (
                    <polygon
                      key={`fill-${i}`}
                      points={fillPoints}
                      fill="url(#actualGradient)"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {/* Garis SNI */}
                <polyline
                  fill="none"
                  stroke="#94D1D9"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  vectorEffect="non-scaling-stroke"
                  points={stdPoints}
                />

                {/* Garis Aktual */}
                {actualSegments.map((seg, i) => (
                  <polyline
                    key={i}
                    fill="none"
                    stroke="#2ABFC8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    points={seg.join(" ")}
                  />
                ))}
              </svg>

              {/* Titik Sampling */}
              {samplingPoints.map((p, i) => (
                <div
                  key={i}
                  className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white bg-[#2ABFC8] "
                  style={{
                    left: `calc(1.5rem + ${getX(p.doc)}% - (1.5rem + 0.25rem) * ${getX(p.doc) / 100})`, // adjust for pl-6 pr-1 container
                    top: `${getY(p.act)}%`,
                  }}
                />
              ))}

              {/* X Axis Labels (Bulan/Minggu) */}
              <div className="relative mt-3 h-4 w-full text-[9px] font-medium text-slate-400">
                {xLabels.map((m) => (
                  <span
                    key={m.label}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${getX(m.doc)}%` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Y Axis Labels */}
              <div className="absolute left-0 bottom-7 top-0 flex w-5 flex-col justify-between text-right text-[9px] text-slate-400">
                {yRatios.map((r, i) => (
                  <span key={i} className="leading-none">{Math.round(yMax * r)}</span>
                ))}
              </div>
            </div>
          );
        })()}

        <p className="mt-7 text-[9px] text-slate-400 text-center">
          Titik bulat = data timbang asli. Garis halus = interpolasi antar sampling.
        </p>
      </div>
    </section>
  );
}
