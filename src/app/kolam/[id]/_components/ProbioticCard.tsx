"use client";

import { Pencil, AlertCircle } from "lucide-react";
import { Row } from "./Sheet";

export function ProbioticCard({ d, now, busy, startEditProb, handleCatatProbiotik, confirmProbioticDone, formatTimeLeft }: any) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-[#9BD4DB] shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500">Probiotik</p>
            <p className="text-lg font-extrabold">{d.prob.doseMl} ml</p>
          </div>
        </div>
        <button
          onClick={startEditProb}
          className="flex items-center gap-1 rounded-full border-[1.5px] border-[#4C9AA6] px-4 py-1.5 text-xs font-semibold text-[#4C9AA6]"
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
          if (!probTimer) {
            return (
              <button
                onClick={() => handleCatatProbiotik()}
                disabled={busy}
                className="mt-3 w-full rounded-[10px] bg-[#4C9AA6] py-2.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                Konfirmasi & Aktifkan Peringatan
              </button>
            );
          }
          const isDue = new Date(probTimer.due_time).getTime() - now <= 0;
          return (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className={`rounded-xl border p-3 ${isDue ? "border-red-200 bg-red-50" : "border-[#4C9AA6]/20 bg-[#F2FAFB]"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <AlertCircle size={13} className={isDue ? "text-red-500" : "text-[#4C9AA6]"} />
                    {isDue ? "Waktunya Beri Probiotik!" : "Probiotik Berikutnya"}
                  </span>
                  <span className={`font-mono text-sm font-bold ${isDue ? "animate-pulse text-red-600" : "text-[#3E97A5]"}`}>
                    {formatTimeLeft(probTimer.due_time)}
                  </span>
                </div>
                {isDue && (
                  <p className="text-[10px] text-red-600/70 mt-0.5">Berikan {d.prob.doseMl}ml {d.prob.brand} lalu tekan tombol di bawah</p>
                )}
                {isDue && (
                  <button
                    onClick={() => confirmProbioticDone(probTimer.id)}
                    disabled={busy}
                    className="mt-2 w-full rounded-lg bg-[#4C9AA6] py-2 text-[11px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
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
