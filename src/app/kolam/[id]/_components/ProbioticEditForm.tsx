"use client";

import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Label } from "./Sheet";
import { inputCls } from "../_lib/constants";

export function ProbioticEditForm({ d, busy, editProbValues, setEditProbValues, setEditMode, setShowSNIAlert, handleConfirmEdit, showSNIAlert, deviations, saveChanges, startAIConsultation }: any) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-4">Modifikasi Jadwal Probiotik</h4>
      <div className="space-y-4">
        <div>
          <Label>Dosis (ml)</Label>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={editProbValues.doseMl || ""}
            onChange={(e) => setEditProbValues({ ...editProbValues, doseMl: parseInt(e.target.value) || 0 })}
          />
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#1C9098]">
            <CheckCircle2 size={11} /> Standar Anjuran: {d.sched.doseMl} ml
          </p>
        </div>
        <div>
          <Label>Frekuensi (x/minggu)</Label>
          <input
            type="number"
            min={1}
            max={7}
            className={inputCls}
            value={editProbValues.frequencyPerWeek || ""}
            onChange={(e) => setEditProbValues({ ...editProbValues, frequencyPerWeek: parseInt(e.target.value) || 0 })}
          />
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#1C9098]">
            <CheckCircle2 size={11} /> Standar Anjuran: {d.sched.frequencyPerWeek}x
          </p>
        </div>
        <div>
          <Label>Metode</Label>
          <div className="grid grid-cols-2 gap-3">
            {["Ke Air", "Campur Pakan"].map((m) => (
              <button
                key={m}
                onClick={() => setEditProbValues({ ...editProbValues, method: m })}
                className={`rounded-[10px] border-[1.5px] border-[#2ABFC8] py-2.5 text-xs font-semibold ${editProbValues.method === m ? "bg-[#2ABFC8] text-white" : "bg-white text-[#2ABFC8]"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#1C9098]">
            <CheckCircle2 size={11} /> Standar Anjuran: Ke Air
          </p>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => { setEditMode(null); setShowSNIAlert(false); }}
          className="flex-1 rounded-[10px] bg-slate-200 py-3 text-xs font-semibold text-slate-700 transition active:scale-[0.98]"
        >
          Batal
        </button>
        <button
          onClick={handleConfirmEdit}
          disabled={busy}
          className="flex-1 rounded-[10px] bg-[#2ABFC8] py-3 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          Konfirmasi Perubahan
        </button>
      </div>

      {/* ======== ALERT SNI (inline, probiotik) ======== */}
      {showSNIAlert && (
        <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <div className="flex gap-3 items-start mb-3">
            <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-orange-800">Menyimpang dari Standar SNI</h4>
              <p className="text-[11px] text-orange-700/80 mt-1">
                Parameter yang Anda masukkan (
                {[deviations.dosis ? "dosis" : null, deviations.freq ? "frekuensi" : null, deviations.metode ? "metode" : null].filter(Boolean).join(", ")}
                ) berbeda dari rekomendasi standar untuk umur kolam Anda.
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