"use client";

import { Pencil, AlarmClock } from "lucide-react";
import { Row } from "./Sheet";
import { fmt1, fmtFeed, fmtFeedWithHint } from "../_lib/constants";

export function FeedCard({ d, now, busy, insertError, startEditPakan, handleCatatPakan, confirmFeedDone, setAncoResult, setAncoModal, formatTimeLeft, historicalData }: any) {
  const hist = historicalData?.source === "historis" && (historicalData?.feedKg ?? 0) > 0 && !d.feed.isCustom;
  const displayFeed = hist ? historicalData.feedKg : d.feed.dailyFeedKg;
  const badgeText = d.feed.isCustom ? "Penyesuaian AI/Manual" : (hist ? historicalData.label : "SNI 8008:2014");
  const badgeColor = d.feed.isCustom ? "bg-blue-100 text-blue-700 border-blue-200" : (historicalData ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200");

  return (
    <section className="rounded-xl bg-white p-4 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/icon/pakan.webp" alt="Pakan" className="h-11 w-11 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500">Total Pakan per hari</p>
            <p className="text-lg font-bold">{fmtFeed(displayFeed)}</p>
          </div>
        </div>
        <button
          onClick={startEditPakan}
          disabled={d.doc < 0}
          className="flex items-center gap-1 rounded-full border-[1.5px] border-[#2ABFC8] px-4 py-1.5 text-xs font-semibold text-[#2ABFC8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Pencil size={11} /> Modifikasi
        </button>
      </div>
      <div className="mt-3">
        <Row l="Jumlah per sesi" v={`${fmtFeedWithHint(displayFeed / Math.max(d.feed.mealsPerDay || 1, 1))}`} />
        {d.anco?.multiplier && d.anco.multiplier !== 1 && (
          <div className="mt-1 mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60 flex items-center justify-between">
            <span>Evaluasi Anco: {d.anco.latestResult}</span>
            <span className="font-bold text-amber-800">Dosis -{Math.round((1 - d.anco.multiplier) * 100)}%</span>
          </div>
        )}
        <Row l="Frekuensi" v={`${d.feed.mealsPerDay}x / hari`} />
        <Row l="Metode Tebar" v="Tabur Manual" />
        <Row l="Cek anco" v={`${d.feed.ancoIntervalHours} jam`} />

        {(() => {
          if (d.doc >= 120) {
            return (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="rounded-xl border border-[#2ABFC8]/20 bg-[#F2FAFB] p-4 text-center">
                  <p className="text-sm font-bold text-[#2ABFC8]">Waktunya Panen!</p>
                  <p className="mt-1 text-xs text-slate-500">Siklus budidaya telah mencapai target 120 hari. Hentikan pemberian pakan.</p>
                </div>
              </div>
            );
          }

          const feedTimers = d.timers.filter((t: any) => t.type === "Pakan" || t.type === "Cek Anco");
          if (feedTimers.length === 0) {
            return (
              <>
                <button
                  onClick={() => handleCatatPakan()}
                  disabled={busy || d.doc < 0}
                  className="mt-3 w-full rounded-[10px] bg-[#2ABFC8] py-2.5 text-xs font-semibold text-white  transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Konfirmasi & Aktifkan Peringatan
                </button>
                {insertError && (
                  <div className="mt-2 text-[10px] text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
                    <span className="font-bold block mb-1">Error Simpan:</span>
                    {insertError}
                  </div>
                )}
              </>
            );
          }
          return (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              {feedTimers.map((t: any) => {
                const isDue = new Date(t.due_time).getTime() - now <= 0;
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-3 ${isDue ? "border-red-200 bg-red-50" : "border-[#2ABFC8]/20 bg-[#F2FAFB]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <AlarmClock size={13} className={isDue ? "text-red-500" : "text-[#2ABFC8]"} />
                        {isDue
                          ? (t.type === "Pakan" ? "Waktunya Memberi Pakan!" : "Waktunya Cek Anco!")
                          : (t.type === "Pakan" ? "Pakan Berikutnya" : "Cek Anco")}
                      </span>
                      <span className={`font-mono text-sm font-bold ${isDue ? "animate-pulse text-red-600" : "text-[#1C9098]"}`}>
                        {formatTimeLeft(t.due_time)}
                      </span>
                    </div>
                    {isDue && t.type === "Pakan" && (
                      <p className="text-xs text-red-600/70 mt-0.5">Berikan {fmtFeedWithHint(displayFeed / Math.max(d.feed.mealsPerDay || 1, 1))} lalu tekan tombol di bawah</p>
                    )}
                    {isDue && t.type === "Cek Anco" && (
                      <p className="text-xs text-red-600/70 mt-0.5">Periksa sisa pakan di anco lalu isi hasilnya</p>
                    )}
                    {isDue && t.type === "Cek Anco" && (
                      <button
                        onClick={() => { setAncoResult("Habis"); setAncoModal({ timerId: t.id }); }}
                        disabled={busy || d.doc < 0}
                        className="mt-2 w-full rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Isi Hasil Anco
                      </button>
                    )}
                    {isDue && t.type === "Pakan" && (
                      <button
                        onClick={() => confirmFeedDone(t.id)}
                        disabled={busy || d.doc < 0}
                        className="mt-2 w-full rounded-lg bg-[#2ABFC8] py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sudah Diberi Pakan
                      </button>
                    )}
                  </div>
                );
              })}
              {insertError && (
                <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
                  {insertError}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
