"use client";

import { Pencil, AlertCircle } from "lucide-react";
import { Row } from "./Sheet";

export function ProbioticCard({ d, now, busy, startEditProb, handleCatatProbiotik, confirmProbioticDone, formatTimeLeft, historicalData }: any) {
  const displayProb = historicalData ? historicalData.probMl : d.prob.doseMl;
  const badgeText = historicalData ? historicalData.cycleName : "SNI 8008:2014";
  const badgeColor = historicalData ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/icon/probiotik.webp" alt="Probiotik" className="h-11 w-11 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-slate-500">Probiotik</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                {badgeText}
              </span>
            </div>
            <p className="text-lg font-extrabold">{displayProb} ml</p>
          </div>
        </div>
        <button
          onClick={startEditProb}
          disabled={d.doc < 0}
          className="flex items-center gap-1 rounded-full border-[1.5px] border-[#2ABFC8] px-4 py-1.5 text-xs font-semibold text-[#2ABFC8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Pencil size={11} /> Modifikasi
        </button>
      </div>
      <div className="mt-3">
        <Row l="Merk" v={d.prob.brand} />
        <Row l="Frekuensi" v={`${d.prob.frequencyPerWeek}x / Seminggu`} />
        <Row l="Metode Tebar" v={d.prob.method === "Ke Air" ? "Tabur Manual" : "Campur Pakan"} />
        
        {(() => {
          const probTimer = d.timers.find((t: any) => t.type === "Probiotik");
          if (d.doc >= 120) {
            return (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="rounded-xl border border-[#2ABFC8]/20 bg-[#F2FAFB] p-4 text-center">
                  <p className="text-sm font-bold text-[#2ABFC8]">Waktunya Panen!</p>
                  <p className="mt-1 text-xs text-slate-500">Hentikan pemberian probiotik karena siklus sudah selesai.</p>
                </div>
              </div>
            );
          }

          if (!probTimer) {
            return (
              <button
                onClick={() => handleCatatProbiotik()}
                disabled={busy || d.doc < 0}
                className="mt-3 w-full rounded-[10px] bg-[#2ABFC8] py-2.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Konfirmasi & Aktifkan Peringatan
              </button>
            );
          }
          const isDue = new Date(probTimer.due_time).getTime() - now <= 0;
          return (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className={`rounded-xl border p-3 ${isDue ? "border-red-200 bg-red-50" : "border-[#2ABFC8]/20 bg-[#F2FAFB]"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <AlertCircle size={13} className={isDue ? "text-red-500" : "text-[#2ABFC8]"} />
                    {isDue ? "Waktunya Beri Probiotik!" : "Probiotik Berikutnya"}
                  </span>
                  <span className={`font-mono text-sm font-bold ${isDue ? "animate-pulse text-red-600" : "text-[#1C9098]"}`}>
                    {formatTimeLeft(probTimer.due_time)}
                  </span>
                </div>
                {isDue && (
                  <p className="text-[10px] text-red-600/70 mt-0.5">Berikan {d.prob.doseMl}ml {d.prob.brand} lalu tekan tombol di bawah</p>
                )}
                {isDue && (
                  <button
                    onClick={() => confirmProbioticDone(probTimer.id)}
                    disabled={busy || d.doc < 0}
                    className="mt-2 w-full rounded-lg bg-[#2ABFC8] py-2 text-[11px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sudah Diberi Probiotik
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
