"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, ChevronRight, Home, MessageCircle, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { projectRemainingFeed, pelletType } from "@/lib/feed-calculator";
import { DesktopSidebar } from "@/components/DesktopSidebar";

const TARGET_HARI = 120;
const HARGA_PAKAN_PER_KG = 12000; // TODO: sesuaikan harga pakan di daerahmu

const fmtKg = (n: number) => `${Math.round(n).toLocaleString("id-ID")}kg`;
const fmtKg1 = (n: number) => `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}kg`;
const fmtJt = (v: number) => (v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)}jt` : `Rp ${(v / 1e3).toFixed(0)}rb`);
const fmtJtRow = (v: number) => (v >= 1e6 ? `Rp. ${(v / 1e6).toFixed(0)}jt` : `Rp. ${(v / 1e3).toFixed(0)}rb`);

export default function ProyeksiPage() {
  const router = useRouter();
  const [ponds, setPonds] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // null = semua kolam
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPonds([]); return; }
      const { data: rows } = await supabase.from("v_pond_dashboard").select("*").eq("user_id", user.id).not("cycle_id", "is", null);
      const ids = (rows ?? []).map((r: any) => r.cycle_id);
      let srMap: Record<string, number> = {};
      if (ids.length) {
        const { data: samp } = await supabase.from("sampling_logs").select("cycle_id, estimated_sr_pct, date").in("cycle_id", ids).order("date", { ascending: false });
        (samp ?? []).forEach((s: any) => { if (!(s.cycle_id in srMap) && s.estimated_sr_pct != null) srMap[s.cycle_id] = Number(s.estimated_sr_pct); });
      }
      setPonds((rows ?? []).map((r: any) => {
        const doc = Number(r.doc);
        const sr = srMap[r.cycle_id] ?? 90;
        return { ...r, doc, sr, proj: projectRemainingFeed(doc, Number(r.initial_shrimp_count), sr) };
      }));
    })();
  }, []);

  const agg = useMemo(() => {
    const list = ponds ?? [];
    const act = selected ? list.filter((p) => p.pond_id === selected) : list;
    const totalKg = act.reduce((a, p) => a + p.proj.totalKg, 0);
    return { list, act, totalKg, cost: totalKg * HARGA_PAKAN_PER_KG };
  }, [ponds, selected]);

  if (!ponds) return <div className="flex min-h-screen items-center justify-center bg-[#F2F5F7]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4C9AA6] border-t-transparent" /></div>;

  const single = selected ? agg.act[0] : null;
  const weeks = single?.proj.weeks ?? [];
  const maxWeek = Math.max(...weeks.map((w: any) => w.kg), 1);
  const niceMax = Math.max(600, Math.ceil(maxWeek / 150) * 150);

  return (
    <div className="min-h-screen bg-[#F2F5F7] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full md:flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-md pb-28 md:max-w-3xl md:pb-12 md:pt-4">
        {/* ============ HEADER ============ */}
        <header className="flex items-center gap-2 px-4 pb-4 pt-6 md:px-8">
          <button onClick={() => router.push("/dashboard")} className="rounded-full p-1.5 text-slate-700 hover:bg-white md:hidden"><ArrowLeft size={20} /></button>
          <h1 className="text-base font-extrabold md:text-2xl">Proyeksi Pakan</h1>
        </header>

        <main className="space-y-4 px-4 md:px-8">
          {/* ============ KARTU RINGKASAN ============ */}
          {!single ? (
            <div className="grid grid-cols-2 overflow-hidden rounded-xl shadow-sm">
              <div className="bg-white p-4">
                <p className="text-[11px] text-slate-500">Total Pakan</p>
                <p className="mt-1 text-xl font-extrabold text-slate-800">{fmtKg(agg.totalKg)}</p>
              </div>
              <div className="bg-[#BFDDE2] p-4">
                <p className="text-[11px] text-[#2F6E7B]">Estimasi Biaya</p>
                <p className="mt-1 text-xl font-extrabold text-slate-800">{fmtJt(agg.cost)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 rounded-xl bg-white p-4 shadow-sm">
              <div><p className="text-base font-extrabold text-[#2F6E7B]">{fmtKg(single.proj.totalKg)}</p><p className="text-[10px] text-slate-500">Total Pakan</p></div>
              <div><p className="text-base font-extrabold text-[#2F6E7B]">{fmtJt(single.proj.totalKg * HARGA_PAKAN_PER_KG)}</p><p className="text-[10px] text-slate-500">Estimasi Biaya</p></div>
              <div><p className="text-base font-extrabold text-[#2F6E7B]">{Math.max(0, TARGET_HARI - single.doc)} hari</p><p className="text-[10px] text-slate-500">Sisa Hari</p></div>
            </div>
          )}

          {/* ============ PEMILIH KOLAM ============ */}
          {!single && <p className="text-[11px] font-semibold text-slate-700">Pilih Kolam</p>}
          <button onClick={() => setShowPicker(true)} className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3.5 text-sm text-slate-700 shadow-sm">
            {single ? single.pond_name : "Semua Kolam"}
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* ============ MODE SEMUA: LIST PER KOLAM ============ */}
          {!single && (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
              {agg.list.map((p) => (
                <button key={p.pond_id} onClick={() => setSelected(p.pond_id)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
                  <span className="text-xs text-slate-500">{p.pond_name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] text-[#3E97A5]">{fmtJtRow(p.proj.totalKg * HARGA_PAKAN_PER_KG)}</span>
                    <span className="text-xs font-bold text-slate-800">{fmtKg1(p.proj.dailyTodayKg)}</span>
                  </span>
                </button>
              ))}
              {agg.list.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Belum ada siklus berjalan.</p>}
            </div>
          )}

          {/* ============ MODE SATU KOLAM: CHART + RINCIAN ============ */}
          {single && (
            <>
              <section>
                <h2 className="mb-3 text-xs font-bold">Kebutuhan Pakan Mingguan</h2>
                <div className="flex gap-2">
                  <div className="flex h-40 flex-col justify-between text-right text-[9px] text-slate-400">
                    {[1, 0.75, 0.5, 0.25, 0].map((t) => <span key={t}>{Math.round(niceMax * t)}</span>)}
                  </div>
                  <div className="relative h-40 flex-1">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <div key={p} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${p}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-end justify-around gap-1.5 overflow-x-auto px-1">
                      {weeks.map((w: any) => (
                        <div key={w.week} className="w-7 shrink-0 rounded-t-md bg-[#4C9AA6]" style={{ height: `${Math.max(2, (w.kg / niceMax) * 100)}%` }} title={fmtKg1(w.kg)} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ml-8 mt-1 flex justify-around gap-1.5">
                  {weeks.map((w: any) => <span key={w.week} className="w-7 shrink-0 text-center text-[9px] text-slate-500">Mgg {w.week}</span>)}
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-bold">Rincian Pakan Perminggu</h2>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
                  {weeks.map((w: any) => (
                    <div key={w.week} className="flex items-center justify-between px-4 py-3">
                      <span className="rounded-lg bg-[#F2F5F7] px-3 py-2 text-xs font-medium text-slate-700">Minggu {w.week}</span>
                      <span className="text-right">
                        <p className="text-xs font-bold text-[#3E97A5]">{fmtKg1(w.kg)}</p>
                        <p className="text-[10px] text-slate-400">{pelletType(single.doc + w.week * 7)}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      </div>

      {/* ============ SHEET PEMILIH KOLAM ============ */}
      {showPicker && (
        <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
          <button aria-label="Tutup" onClick={() => setShowPicker(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-3 md:relative z-10 md:w-full md:max-w-md md:rounded-[24px]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
            <h3 className="mb-3 text-base font-extrabold">Pilih Kolam</h3>
            <button onClick={() => { setSelected(null); setShowPicker(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-50">
              Semua Kolam {selected === null && <Check size={16} className="text-[#4C9AA6]" />}
            </button>
            {(ponds ?? []).map((p) => (
              <button key={p.pond_id} onClick={() => { setSelected(p.pond_id); setShowPicker(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-50">
                {p.pond_name} <span className="text-[10px] text-slate-400">DOC {p.doc}</span>
                {selected === p.pond_id && <Check size={16} className="text-[#4C9AA6]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ BOTTOM NAV + FAB ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="relative border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <button className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#4C9AA6] text-white shadow-lg ring-4 ring-white/70">
            <Plus size={24} />
          </button>
          <div className="grid grid-cols-4">
            {[
              { label: "Beranda", icon: Home, href: "/dashboard", active: false },
              { label: "Proyeksi", icon: BarChart3, href: "/proyeksi", active: true },
              { label: "Komunitas", icon: MessageCircle, href: "/komunitas", active: false },
              { label: "Profil", icon: User, href: "/profil", active: false },
            ].map(({ label, icon: Icon, href, active }) => (
              <a key={label} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#3E97A5]" : "text-slate-400"}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "fill-[#3E97A5]" : ""} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}