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
              const ancoLabel = log.anco_result && log.anco_result !== "Belum Dicek" ? log.anco_result : null;
              const ancoTimeMatch = (log.notes || "").match(/\[ANCO:(\d{2}[:.]\d{2}):[^\]]+\]/);
              const ancoTime = ancoTimeMatch ? ancoTimeMatch[1].replace(".", ":") : null;

              return (
                <article key={`feed-${log.id}`} className="rounded-2xl bg-white px-4 py-3.5 shadow-sm border border-slate-100/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/images/icon/pakan.webp" alt="Pakan" className="h-9 w-9 shrink-0" />
                      <div>
                        <p className="text-base font-extrabold text-slate-800">{fmtFeedWithHint(Number(log.feed_amount_kg || 0))}</p>
                        <p className="text-[11px] text-slate-400">{log.feed_type || "Pelet"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700">{formatDate(log.date)}</p>
                      <p className="text-[11px] text-slate-400">{formatTime(log.date)}</p>
                    </div>
                  </div>
                  {ancoLabel && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Anco</span>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ancoLabel === "Habis"
                            ? "bg-emerald-100 text-emerald-700"
                            : ancoLabel === "Sisa Sedikit"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {ancoLabel === "Habis" ? "Habis" : ancoLabel === "Sisa Sedikit" ? "Sisa sedikit" : "Sisa banyak"}
                        </span>
                      </div>
                      {ancoTime && <p className="text-[11px] text-slate-400">{ancoTime} WIB</p>}
                    </div>
                  )}
                </article>
              );
            }

            return (
              <article key={`prob-${log.id}`} className="rounded-2xl bg-white px-4 py-3.5 shadow-sm border border-slate-100/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/images/icon/probiotik.webp" alt="Probiotik" className="h-9 w-9 shrink-0" />
                    <div>
                      <p className="text-base font-extrabold text-slate-800">{log.amount_ml}ml</p>
                      <p className="text-[11px] text-slate-400">{log.probiotic_type || "Merk Probi"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">{formatTime(log.date)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(log.date)}</p>
                  </div>
                </div>
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