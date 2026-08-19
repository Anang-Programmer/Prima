"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { estimateHarvestYield } from "@/lib/feed-calculator";

/* ============================================================
   BOTTOM SHEET "TAMBAH KOLAM"
   Mobile 100% sama dengan desain, desktop jadi modal tengah.
============================================================ */

const inputCls =
  "w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#4C9AA6]/50";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{children}</p>;
}

type Props = { open: boolean; onClose: () => void; onSaved: () => void };

export default function TambahKolamSheet({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [shape, setShape] = useState<"" | "Persegi" | "Lingkaran">("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [benur, setBenur] = useState("");
  const [tebar, setTebar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState("");
  const est = useMemo(() => {
    if (Number(benur) > 0 && Number(area) > 0) return estimateHarvestYield(Number(benur), Number(area));
    return null;
  }, [benur, area]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!shape) return setError("Pilih jenis tambak dulu ya.");
    if (!Number(area)) return setError("Luas kolam wajib diisi.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Belum login, silakan masuk dulu.");

      // Cek batasan kolam untuk akun Free
      const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", user.id).single();
      if (!profile?.is_premium) {
        const { count } = await supabase.from("ponds").select("*", { count: "exact", head: true }).eq("user_id", user.id);
        if (count && count >= 1) {
          setLoading(false);
          return setError("Akun Gratis maksimal hanya bisa memiliki 1 kolam. Upgrade ke Prime untuk tambah kolam tanpa batas!");
        }
      }

      // 1) Simpan kolam
      const { data: pond, error: pErr } = await supabase
        .from("ponds")
        .insert({
          user_id: user.id,
          name,
          shape,
          area_m2: Number(area),
          location,
          status: "Aktif",
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // 2) Kalau benur + tanggal tebar diisi -> langsung mulai siklus
      if (Number(benur) > 0 && tebar) {
        const { error: cErr } = await supabase.from("cycles").insert({
          pond_id: pond.id,
          start_date: tebar,
          initial_shrimp_count: Number(benur),
          target_yield_kg_per_m2: est?.yieldKgPerM2 ?? 3,
          status: "Berjalan",
        });
        if (cErr) throw cErr;
      }

      onSaved();
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan kolam.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      {/* backdrop */}
      <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/40" />

      {/* sheet */}
      <div className="absolute inset-x-0 bottom-0 top-[14%] flex flex-col overflow-hidden rounded-t-[24px] bg-white md:relative md:inset-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-[24px]">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />

        <div className="flex-1 overflow-y-auto px-4 pb-7 pt-4">
          <h2 className="text-base font-extrabold text-slate-800">Tambah Kolam</h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label>Nama Kolam</Label>
              <input className={inputCls} placeholder="Ketik Nama" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <Label>Jenis Tambak</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["Persegi", "Lingkaran"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    className={`rounded-[10px] border-[1.5px] border-[#4C9AA6] py-2.5 text-xs font-semibold transition ${
                      shape === s ? "bg-[#4C9AA6] text-white" : "bg-white text-[#4C9AA6]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Luas (m²)</Label>
              <input className={inputCls} type="number" min="1" step="0.01" inputMode="decimal" placeholder="cth. 500" value={area} onChange={(e) => setArea(e.target.value)} required />
            </div>

            <div>
              <Label>Kedalaman (m)</Label>
              <input type="number" step="0.1" min="0.1" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="Default 1.5m" className={inputCls} />
            </div>

            <div>
              <Label>Lokasi</Label>
              <input className={inputCls} placeholder="cth. blok A kanan" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div>
              <Label>Jumlah Benur (Ekor)</Label>
              <input className={inputCls} type="number" min="0" inputMode="numeric" placeholder="cth. 500" value={benur} onChange={(e) => setBenur(e.target.value)} />
            </div>

            <div>
              <Label>Tanggal Tebar</Label>
              <div className="relative">
                <input
                  type="date"
                  value={tebar}
                  onChange={(e) => setTebar(e.target.value)}
                  className={`${inputCls} appearance-none pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:opacity-0`}
                />
                <CalendarDays size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-800" />
              </div>
            </div>

            {est && (
              <div className="rounded-xl bg-[#E3F1F2] px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-bold text-[#2F6E7B]">Estimasi Panen (SNI)</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target ABW panen</span>
                  <span className="font-bold text-slate-800">{est.abwGram}g / ekor</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi SR akhir</span>
                  <span className="font-bold text-slate-800">{est.srPct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi total panen</span>
                  <span className="font-bold text-slate-800">{est.totalKg.toLocaleString("id-ID")} kg</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-[#2F6E7B]/15 pt-1.5">
                  <span className="text-slate-500">Target yield</span>
                  <span className={`font-bold ${est.yieldKgPerM2 >= 2 && est.yieldKgPerM2 <= 4 ? "text-[#2F8E4E]" : est.yieldKgPerM2 < 2 ? "text-[#D4830B]" : "text-[#C0392B]"}`}>{est.yieldKgPerM2} kg/m²</span>
                </div>
                {est.yieldKgPerM2 < 2 && (
                  <p className="text-[10px] text-[#D4830B]">Di bawah standar SNI (2-4 kg/m²). Pertimbangkan tambah benur.</p>
                )}
                {est.yieldKgPerM2 > 4 && (
                  <p className="text-[10px] text-[#C0392B]">Di atas standar - kepadatan tinggi, monitoring ketat diperlukan.</p>
                )}
              </div>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#4C9AA6] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}