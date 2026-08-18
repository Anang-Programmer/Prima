"use client";

import { AlarmClock, Loader2 } from "lucide-react";

export function DebugTimePanel(props: any) {
  const { busy, insertError, debugMsg, debugAdvance } = props;
  return (
    <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-amber-700">
        <AlarmClock size={13} /> Debug: Simulasi Waktu
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-amber-700/80">
        Majukan waktu virtual. Timer pakan/probiotik yang jatuh tempo otomatis dicatat ke Log Book. Aktifkan Countdown dulu agar ada timer berjalan.
      </p>
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
      {debugMsg && (
        <div className="mt-2 rounded-lg border border-[#4C9AA6]/30 bg-[#E3F1F2] p-2.5 text-[10px] leading-relaxed text-[#2F6E7B]">
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