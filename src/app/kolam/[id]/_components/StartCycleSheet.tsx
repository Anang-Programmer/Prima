"use client";

import { useState, FormEvent, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { estimateHarvestYield } from "@/lib/feed-calculator";
import { CalendarDays } from "lucide-react";

export default function StartCycleSheet({ pond, open, onClose, onSaved }: { pond: any; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [benur, setBenur] = useState("");
  const [tebar, setTebar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const est = useMemo(() => {
    if (Number(benur) > 0 && Number(pond?.area_m2) > 0) return estimateHarvestYield(Number(benur), Number(pond.area_m2));
    return null;
  }, [benur, pond?.area_m2]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (Number(benur) <= 0 || !tebar) return setError("Lengkapi data siklus.");

    setLoading(true);
    try {
      const { error: cErr } = await supabase.from("cycles").insert({
        pond_id: pond.id,
        start_date: tebar,
        initial_shrimp_count: Number(benur),
        target_yield_kg_per_m2: est?.yieldKgPerM2 ?? 3,
        status: "Berjalan",
      });
      if (cErr) throw cErr;

      onSaved();
    } catch (err: any) {
      setError(err?.message || "Gagal memulai siklus.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50";

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-x-0 bottom-0 top-[auto] flex flex-col overflow-hidden rounded-t-[24px] bg-white md:relative md:inset-auto md:w-full md:max-w-sm md:rounded-[24px]">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />

        <div className="px-5 py-6 pb-10 md:pb-6">
          <h2 className="text-lg font-extrabold text-[#125B69]">Mulai Siklus</h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-800">Jumlah Benur (Ekor)</p>
              <input className={inputCls} type="number" min="1" inputMode="numeric" placeholder="cth. 500" value={benur} onChange={(e) => setBenur(e.target.value)} required />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-800">Tanggal Mulai</p>
              <div className="relative">
                <input type="date" className={inputCls} value={tebar} onChange={(e) => setTebar(e.target.value)} required />
                <CalendarDays size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button disabled={loading} type="submit" className="mt-4 w-full rounded-xl bg-[#3EC4CE] py-3.5 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50">
              {loading ? "Menyimpan..." : "Mulai Siklus"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
