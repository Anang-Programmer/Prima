"use client";

import { AlarmClock, Loader2 } from "lucide-react";
import { useState } from "react";

export function DebugTimePanel(props: any) {
  const { busy, insertError, debugMsg, debugAdvance, debugJumpDoc, currentDoc, historisCheck } = props;
  const [targetDoc, setTargetDoc] = useState<number | "">(120);

  return (
    <section className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-amber-700">
        <AlarmClock size={13} /> Debug: Simulasi Waktu
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-amber-700/80">
        Majukan waktu virtual. Timer pakan/probiotik yang jatuh tempo otomatis dicatat ke Log Book. Aktifkan Countdown dulu agar ada timer berjalan.
      </p>
      
      {/* Tombol Timer Biasa */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "+2 Jam", hours: 2 },
          { label: "+6 Jam", hours: 6 },
          { label: "+1 Hari", hours: 24 },
        ].map((b) => (
          <button
            key={b.hours}
            onClick={() => debugAdvance(b.hours)}
            disabled={busy}
            className="rounded-[10px] bg-amber-500 py-2 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <Loader2 className="mx-auto animate-spin" size={13} /> : b.label}
          </button>
        ))}
      </div>

      {/* Lompat DOC Ekstrim */}
      <div className="mt-3 flex items-center gap-2 border-t border-amber-200/50 pt-3">
        <span className="text-[10px] font-semibold text-amber-700">Menuju hari ke:</span>
        <input 
          type="number" 
          className="w-16 rounded-lg bg-white px-2 py-1.5 text-xs text-center font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-400" 
          value={targetDoc}
          onChange={(e) => setTargetDoc(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          max={120}
        />
        <button
          onClick={() => debugJumpDoc(Number(targetDoc))}
          disabled={busy || targetDoc === "" || Number(targetDoc) === currentDoc || Number(targetDoc) < 0}
          className="flex-1 rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? <Loader2 className="mx-auto animate-spin" size={12} /> : "Lompat Waktu"}
        </button>
      </div>

      {/* Debug FCR Historis */}
      <div className="mt-3 flex items-center gap-2 border-t border-amber-200/50 pt-3">
        <span className="text-[10px] font-semibold text-amber-700">Maks FCR Historis:</span>
        <input 
          type="number" 
          step="0.1"
          className="w-16 rounded-lg bg-white px-2 py-1.5 text-xs text-center font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-400" 
          value={props.debugFcrLimit}
          onChange={(e) => props.setDebugFcrLimit(Number(e.target.value))}
        />
        <span className="text-[9px] text-amber-700/80 leading-tight">Ubah ini untuk melonggarkan pengecekan FCR Historis (standar: 1.5)</span>
      </div>

      {/* Checklist Rekomendasi Historis */}
      {historisCheck && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[10px] font-bold text-slate-600 mb-1">
            Cek Rekomendasi Historis: {historisCheck.source === "historis" ? "AKTIF (ikut siklus sukses)" : "FALLBACK ke SNI"}
          </p>
          {historisCheck.source === "historis" ? (
            <p className="text-[10px] text-emerald-600">Semua syarat mutlak terpenuhi - rekomendasi mengikuti siklus sukses Bapak.</p>
          ) : (
            <ul className="list-disc pl-4 space-y-0.5">
              {(historisCheck.gagalDi || []).map((g: string, i: number) => (
                <li key={i} className="text-[10px] text-amber-700">{g}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {debugMsg && (
        <div className="mt-2 rounded-lg border border-[#2ABFC8]/30 bg-[#E3F1F2] p-2.5 text-[10px] leading-relaxed text-[#2F6E7B]">
          {debugMsg}
        </div>
      )}
      {insertError && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-white p-2 text-[10px] text-amber-700">
          {insertError}
        </div>
      )}
    </section>
  );
}
