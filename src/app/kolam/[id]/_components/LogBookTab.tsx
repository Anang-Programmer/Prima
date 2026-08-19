"use client";

import { useState } from "react";
import { 
  Utensils, 
  Droplets, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { fmtFeed, fmtFeedWithHint, fmt1 } from "../_lib/constants";

export default function LogBookTab({ d }: { d: any }) {
  const [filter, setFilter] = useState<"all" | "feed" | "prob">("all");
  const [limit, setLimit] = useState(15);

  // Format tanggal & jam
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    } catch {
      return "-";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "-";
    }
  };

  // Gabungkan feed_logs dan probiotic_logs ke dalam unified timeline
  const feedItems = (d.feeds || []).map((f: any) => ({
    ...f,
    itemCategory: "pakan",
    sortTime: new Date(f.date).getTime(),
  }));

  const probItems = (d.probs || []).map((p: any) => ({
    ...p,
    itemCategory: "probiotik",
    sortTime: new Date(p.date).getTime(),
  }));

  const allLogs = [...feedItems, ...probItems].sort((a, b) => b.sortTime - a.sortTime);

  const displayedLogs = allLogs.filter((item) => {
    if (filter === "feed") return item.itemCategory === "pakan";
    if (filter === "prob") return item.itemCategory === "probiotik";
    return true;
  });

  const totalAncoChecked = (d.feeds || []).filter((f: any) => f.anco_result && f.anco_result !== "Belum Dicek").length;
  const ancoHabisRate = totalAncoChecked > 0 ? Math.round((d.anco.habis / totalAncoChecked) * 100) : 0;

  return (
    <section className="space-y-4">
      {/* ============ ALERT 3 HARI / 1 MINGGU ANCO HABIS ============ */}
      {d.anco?.isHabis1Week ? (
        <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100 flex gap-3 shadow-sm">
          <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-indigo-900">Anco Habis 1 Minggu Berturut-turut!</h4>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              Udang menunjukkan nafsu makan sangat tinggi secara konsisten. Pertimbangkan menaikkan persentase pakan harian atau menyesuaikan ulang jadwal SNI di siklus berikutnya!
            </p>
          </div>
        </div>
      ) : d.anco?.isHabis3Days ? (
        <div className="rounded-2xl bg-[#FFF6E5] p-4 border border-[#FFE1B5] flex gap-3 shadow-sm">
          <AlertTriangle className="text-[#F2A93B] shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-[#9E6200]">Anco Habis 3 Hari Berturut-turut</h4>
            <p className="text-xs text-[#9E6200] mt-1 leading-relaxed">
              Nafsu makan udang stabil tinggi. Anda mungkin perlu meningkatkan jumlah pakan agar pertumbuhan lebih maksimal.
            </p>
          </div>
        </div>
      ) : null}

      {/* ============ STATS SUMMARY BAR ============ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100/80">
          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <Utensils size={11} className="text-[#F08C8C]" /> Total Pakan
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-800">
            {fmtFeed(d.totalFeed || 0)}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">{d.feeds?.length || 0} kali tebar</p>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100/80">
          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" /> Nafsu Makan
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-800">
            {totalAncoChecked > 0 ? `${ancoHabisRate}%` : "-"}
          </p>
          <p className="text-[9px] text-emerald-600 font-medium mt-0.5">{d.anco.habis} anco habis</p>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100/80">
          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <Droplets size={11} className="text-[#4C9AA6]" /> Probiotik
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-800">
            {fmt1((d.probs || []).reduce((acc: number, p: any) => acc + Number(p.amount_ml || 0), 0))} ml
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">{d.probs?.length || 0} aplikasi</p>
        </div>
      </div>

      {/* ============ FILTER CHIPS ============ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setFilter("all"); setLimit(15); }}
          className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "all"
              ? "bg-[#4C9AA6] text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Layers size={12} /> Semua Log ({allLogs.length})
        </button>
        <button
          onClick={() => { setFilter("feed"); setLimit(15); }}
          className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "feed"
              ? "bg-[#4C9AA6] text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Utensils size={12} /> Sesi Pakan & Anco ({d.feeds?.length || 0})
        </button>
        <button
          onClick={() => { setFilter("prob"); setLimit(15); }}
          className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "prob"
              ? "bg-[#4C9AA6] text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Droplets size={12} /> Probiotik ({d.probs?.length || 0})
        </button>
      </div>

      {/* ============ LOG LIST ============ */}
      {displayedLogs.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Layers size={22} />
          </div>
          <p className="text-sm font-bold text-slate-700">Belum Ada Catatan</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            Log pakan, anco, dan probiotik akan otomatis tersimpan saat Anda mengonfirmasi aktivitas di tab utama.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedLogs.slice(0, limit).map((log: any) => {
            if (log.itemCategory === "pakan") {
              // Status Cek Anco
              const isAncoHabis = log.anco_result === "Habis";
              const isAncoSedikit = log.anco_result === "Sisa Sedikit";
              const isAncoBanyak = log.anco_result === "Sisa Banyak";
              const isAncoPending = !log.anco_result || log.anco_result === "Belum Dicek";

              // Extract sub-checks from notes
              const ancoChecks: { time: string; result: string }[] = [];
              let cleanNotes = log.notes || "";
              const regex = /\[ANCO:(\d{2}:\d{2}):([^\]]+)\]/g;
              let match;
              while ((match = regex.exec(log.notes)) !== null) {
                ancoChecks.push({ time: match[1], result: match[2] });
                cleanNotes = cleanNotes.replace(match[0], "");
              }
              cleanNotes = cleanNotes.trim();

              return (
                <article
                  key={`feed-${log.id}`}
                  className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100/90 transition hover:border-[#4C9AA6]/30"
                >
                  {/* Header Card: Icon, Waktu & Badge Status Anco */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F08C8C]/15 text-[#E06565]">
                        <Utensils size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-extrabold text-slate-800">Sesi Pemberian Pakan</h5>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> {formatDate(log.date)} · {formatTime(log.date)}
                        </p>
                      </div>
                    </div>

                    {/* Badge Hasil Anco */}
                    <div>
                      {isAncoHabis && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={11} className="text-emerald-600" /> Anco Habis
                        </span>
                      )}
                      {isAncoSedikit && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200/80">
                          <AlertCircle size={11} className="text-amber-600" /> Sisa Sedikit
                        </span>
                      )}
                      {isAncoBanyak && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 border border-red-200/80">
                          <AlertTriangle size={11} className="text-red-600" /> Sisa Banyak
                        </span>
                      )}
                      {isAncoPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 border border-slate-200/60">
                          <Clock size={11} /> Menunggu Cek Anco
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Card: Pakan Details & Anco Evaluation */}
                  <div className="mt-3 space-y-2.5">
                    {/* Ringkasan Pakan */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Pakan Ditebar</p>
                        <p className="text-xs font-bold text-slate-800">
                          {log.feed_type || "Pelet"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-medium">Takaran Sesi Ini</p>
                        <p className="text-xs font-extrabold text-[#4C9AA6]">
                          {fmtFeedWithHint(Number(log.feed_amount_kg || 0))}
                        </p>
                      </div>
                    </div>

                    {/* Kotak Feedback Evaluasi Anco Terpadu */}
                    <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" /> Kontrol Anco Rutin
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Interval {d.feed?.ancoIntervalHours || 2} jam
                        </span>
                      </div>

                      <div className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                        {isAncoHabis && (
                          <p className="text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                            <Sparkles size={13} className="shrink-0 mt-0.5 text-emerald-600" />
                            <span><strong>Nafsu makan optimal:</strong> Pakan di jaring anco habis bersih. Rekomendasi pakan sesi berikutnya aman dilanjutkan 100%.</span>
                          </p>
                        )}
                        {isAncoSedikit && (
                          <p className="text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-100 flex items-start gap-1.5">
                            <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                            <span><strong>Nafsu makan agak turun:</strong> Ada sedikit sisa pakan di anco. AI otomatis menyarankan penyesuaian porsi -10% di sesi berikutnya.</span>
                          </p>
                        )}
                        {isAncoBanyak && (
                          <p className="text-red-800 bg-red-50/60 p-2 rounded-lg border border-red-100 flex items-start gap-1.5">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-red-600" />
                            <span><strong>Indikasi kenyang / overfeeding:</strong> Pakan masih tersisa banyak di anco. AI memotong porsi sesi berikutnya -25% untuk menjaga stabilitas air.</span>
                          </p>
                        )}
                        {isAncoPending && (
                          <p className="text-slate-500 italic p-1.5 text-[10px]">
                            Timer anco sedang memantau nafsu makan udang untuk sesi ini.
                          </p>
                        )}
                      </div>
                      
                      {/* Riwayat Cek Anco Tiap Jam */}
                      {ancoChecks.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100/80">
                          <p className="text-[10px] font-semibold text-slate-500 mb-1.5 px-1">Riwayat Pengecekan per Jam:</p>
                          <ul className="space-y-1">
                            {ancoChecks.map((chk, i) => (
                              <li key={i} className="flex items-center justify-between text-[10px] px-1.5 py-1 rounded bg-slate-50/50">
                                <span className="text-slate-500">{chk.time} WIB</span>
                                <span className={`font-bold ${
                                  chk.result === "Habis" ? "text-emerald-600" :
                                  chk.result === "Sisa Sedikit" ? "text-amber-600" :
                                  "text-red-600"
                                }`}>
                                  {chk.result}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Catatan / Notes bila ada */}
                    {cleanNotes && (
                      <p className="text-[10px] text-slate-400 italic px-1">
                        Catatan: {cleanNotes}
                      </p>
                    )}
                  </div>
                </article>
              );
            }

            // Kartu Probiotik
            return (
              <article
                key={`prob-${log.id}`}
                className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100/90 transition hover:border-[#4C9AA6]/30"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4C9AA6]/15 text-[#4C9AA6]">
                      <Droplets size={18} />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-800">Aplikasi Probiotik</h5>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {formatDate(log.date)} · {formatTime(log.date)}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-[#4C9AA6]/10 px-2.5 py-1 text-[10px] font-bold text-[#3E97A5] border border-[#4C9AA6]/20">
                    {log.method === "Campur Pakan" ? "Campur Pakan" : "Tebar ke Air"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Jenis Probiotik</p>
                    <p className="text-xs font-bold text-slate-800">
                      {log.probiotic_type || "Probiotik Standar"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-medium">Dosis Diberikan</p>
                    <p className="text-xs font-extrabold text-[#4C9AA6]">
                      {log.amount_ml} ml
                    </p>
                  </div>
                </div>

                {log.notes && (
                  <p className="mt-2 text-[10px] text-slate-400 italic px-1">
                    Catatan: {log.notes}
                  </p>
                )}
              </article>
            );
          })}
          
          {limit < displayedLogs.length && (
            <button
              onClick={() => setLimit(l => l + 15)}
              className="mt-4 w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Tampilkan Lebih Banyak
            </button>
          )}
        </div>
      )}
    </section>
  );
}