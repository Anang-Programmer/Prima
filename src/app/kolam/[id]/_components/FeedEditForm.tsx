"use client";

import { Minus, Plus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Label } from "./Sheet";
import { inputCls, fmt1, fmtFeed } from "../_lib/constants";

export function FeedEditForm({ d, busy, editFeedValues, setEditFeedValues, handleConfirmEdit, showSNIAlert, deviations, saveChanges, startAIConsultation }: any) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-5">Edit Pakan</h4>

      {/* Stepper Total Pakan */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => {
            const newVal = Math.max(0, +(editFeedValues.dailyFeedKg - 0.1).toFixed(2));
            setEditFeedValues({ ...editFeedValues, dailyFeedKg: newVal, _rawDailyFeedKg: newVal.toString() });
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4C9AA6] text-white shadow-sm transition active:scale-90"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          min={0}
          step={0.1}
          className="min-w-0 flex-1 rounded-xl bg-[#EAEAEA] px-3 py-3 text-center text-xl font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-[#4C9AA6]/50"
          value={editFeedValues._rawDailyFeedKg ?? editFeedValues.dailyFeedKg}
          onChange={(e) => {
            const val = e.target.value;
            setEditFeedValues({ 
              ...editFeedValues, 
              _rawDailyFeedKg: val,
              dailyFeedKg: val === "" ? 0 : Math.max(0, parseFloat(val) || 0) 
            });
          }}
        />
        <button
          onClick={() => {
            const newVal = +(editFeedValues.dailyFeedKg + 0.1).toFixed(2);
            setEditFeedValues({ ...editFeedValues, dailyFeedKg: newVal, _rawDailyFeedKg: newVal.toString() });
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4C9AA6] text-white shadow-sm transition active:scale-90"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="mb-2 text-center text-[10px] text-slate-400">kg / hari</p>
      {/* Status SNI pakan */}
      {(() => {
        const ref = Math.max(d.recommendedFeedKg, 0.01);
        const devPct = Math.abs(editFeedValues.dailyFeedKg - d.recommendedFeedKg) / ref;
        const isOff = devPct > 0.15; // toleransi 15%
        return (
          <p className={`mb-5 text-center text-[11px] font-semibold ${isOff ? "text-orange-500" : "text-[#3E97A5]"}`}>
            {isOff
              ? `⚠ Berbeda dari rekomendasi PRIMA (${fmtFeed(d.recommendedFeedKg)})`
              : "Pakan sudah sesuai dengan rekomendasi PRIMA"}
          </p>
        );
      })()}

      <div className="space-y-4">
        {/* Merk Pakan (TIDAK dicek SNI) */}
        <div>
          <Label>Merk Pakan</Label>
          <input
            className={inputCls}
            placeholder="cth. yudisium"
            value={editFeedValues.feedBrand}
            onChange={(e) => setEditFeedValues({ ...editFeedValues, feedBrand: e.target.value })}
          />
        </div>
        {/* Frekuensi (dicek SNI) */}
        <div>
          <Label>Frekuensi (x/hari)</Label>
          <input
            type="number"
            min={2}
            max={6}
            className={inputCls}
            placeholder={`cth. ${d.calc.mealsPerDay}`}
            value={editFeedValues.mealsPerDay || ""}
            onChange={(e) => setEditFeedValues({ ...editFeedValues, mealsPerDay: parseInt(e.target.value) || 0 })}
          />
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#3E97A5]">
            <CheckCircle2 size={11} /> Standar SNI: {d.calc.mealsPerDay}x
          </p>
        </div>
        {/* Cek Anco (dicek SNI) */}
        <div>
          <Label>Cek Anco (jam)</Label>
          <input
            type="number"
            min="0"
            step="0.25"
            className={inputCls}
            placeholder={`cth. ${d.calc.ancoIntervalHours}`}
            value={editFeedValues.ancoHours || ""}
            onChange={(e) => setEditFeedValues({ ...editFeedValues, ancoHours: parseFloat(e.target.value) || 0 })}
          />
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#3E97A5]">
            <CheckCircle2 size={11} /> Standar SNI: {d.calc.ancoIntervalHours} jam
          </p>
        </div>
      </div>

      {/* Tombol Konfirmasi */}
      <button
        onClick={handleConfirmEdit}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-[#4C9AA6] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
      >
        Konfirmasi
      </button>

      {/* ======== ALERT SNI (inline, muncul di bawah form) ======== */}
      {showSNIAlert && (
        <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <div className="flex gap-3 items-start mb-3">
            <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-orange-800">Menyimpang dari Standar SNI</h4>
              <p className="text-[11px] text-orange-700/80 mt-1">
                Parameter yang Anda masukkan (
                {[deviations.pakan ? "total pakan" : null, deviations.freq ? "frekuensi" : null, deviations.anco ? "jam cek anco" : null].filter(Boolean).join(", ")}
                ) berbeda dari rekomendasi standar SNI untuk umur dan kepadatan kolam Anda.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-orange-200/50">
            <button
              onClick={() => saveChanges(false)}
              disabled={busy}
              className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50"
            >
              {busy ? <Loader2 className="mx-auto animate-spin" size={14} /> : "Abaikan & Lanjut"}
            </button>
            <button
              onClick={startAIConsultation}
              className="flex-1 rounded-lg bg-orange-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
            >
              Konsultasi AI →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}