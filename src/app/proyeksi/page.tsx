"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, ChevronRight, Home, MessageCircle, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { projectRemainingFeed, pelletType, calculateDailyFeed } from "@/lib/feed-calculator";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import TambahKolamSheet from "@/components/tambah-kolam-sheet";

const TARGET_HARI = 120;

const fmtKg = (n: number) => `${Math.round(n).toLocaleString("id-ID")}kg`;
const fmtKg1 = (n: number) => `${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}kg`;

export default function ProyeksiPage() {
  const router = useRouter();
  const [ponds, setPonds] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // null = semua kolam
  const [showPicker, setShowPicker] = useState(false);
  const [showTambah, setShowTambah] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPonds([]); return; }
      const { data: rows } = await supabase.from("v_pond_dashboard").select("*").eq("user_id", user.id).not("cycle_id", "is", null);
      const ids = (rows ?? []).map((r: any) => r.cycle_id);
      
      let srMap: Record<string, number> = {};
      let feedMap: Record<string, any[]> = {};
      let cycleStartMap: Record<string, number> = {};
      let planMap: Record<string, any> = {};
      
      if (ids.length) {
        const { data: samp } = await supabase.from("sampling_logs").select("cycle_id, estimated_sr_pct").in("cycle_id", ids).order("date", { ascending: false });
        (samp ?? []).forEach((s: any) => { if (!(s.cycle_id in srMap) && s.estimated_sr_pct != null) srMap[s.cycle_id] = Number(s.estimated_sr_pct); });
        
        const { data: feeds } = await supabase.from("feed_logs").select("cycle_id, feed_amount_kg, date").in("cycle_id", ids);
        (feeds ?? []).forEach((f: any) => {
          if (!feedMap[f.cycle_id]) feedMap[f.cycle_id] = [];
          feedMap[f.cycle_id].push(f);
        });

        // We need cycle start dates and plans to map feed logs and AI overrides
        const { data: cycles } = await supabase.from("cycles").select("id, start_date, plan").in("id", ids);
        (cycles ?? []).forEach((c: any) => {
          cycleStartMap[c.id] = c.start_date ? new Date(c.start_date).getTime() : Date.now();
          planMap[c.id] = c.plan;
        });
      }
      
      setPonds((rows ?? []).map((r: any) => {
        const doc = Number(r.doc);
        const sr = srMap[r.cycle_id] ?? 90;
        const feeds = feedMap[r.cycle_id] ?? [];
        const cycleStartMs = cycleStartMap[r.cycle_id] ?? Date.now();
        const plan = planMap[r.cycle_id];
        
        // Calculate hybrid projection
        const weeks = [];
        let totalKg = 0;
        let dailyTodayKg = 0;
        
        const currentWeekNum = Math.floor(doc / 7) + 1;
        const totalWeeksToShow = Math.ceil(TARGET_HARI / 7); // 18 weeks for 120 days
        
        // Calculate today's SNI feed
        const todayCalc = calculateDailyFeed(doc, Number(r.initial_shrimp_count), Number(r.area_m2), 0, sr);
        const aiDailyFeed = plan?.feed?.dailyFeedKg ? Number(plan.feed.dailyFeedKg) : 0;
        dailyTodayKg = aiDailyFeed > 0 ? aiDailyFeed : todayCalc.dailyFeedKg;
        
        // Ratio of AI feed to SNI feed (used to scale future projections so they reflect the user's intent)
        const feedRatio = aiDailyFeed > 0 ? (aiDailyFeed / todayCalc.dailyFeedKg) : 1;

        for (let w = 1; w <= totalWeeksToShow; w++) {
          const weekStartDoc = (w - 1) * 7;
          const weekEndDoc = w * 7 - 1;
          
          let weeklyFeed = 0;
          let isReal = false;
          
          if (weekStartDoc <= doc) {
            // Historical week
            const realFeeds = feeds.filter((f: any) => {
              const feedDoc = Math.floor((new Date(f.date).getTime() - cycleStartMs) / 86400000);
              return feedDoc >= weekStartDoc && feedDoc <= weekEndDoc;
            });
            const realTotal = realFeeds.reduce((acc: number, f: any) => acc + Number(f.feed_amount_kg), 0);
            
            if (realTotal > 0) {
              // Use real data
              weeklyFeed = realTotal;
            } else {
              // No feed logs recorded -- fallback to SNI calculation so it doesn't show 0
              const endDay = Math.min(weekEndDoc, doc);
              for (let dayDoc = weekStartDoc; dayDoc <= endDay; dayDoc++) {
                const calcDay = calculateDailyFeed(dayDoc, Number(r.initial_shrimp_count), Number(r.area_m2), 0, sr);
                weeklyFeed += (calcDay.dailyFeedKg * feedRatio);
              }
            }
            isReal = true;
            
            // If current week is ongoing, add SNI projection for remaining days scaled by AI ratio
            if (weekEndDoc > doc) {
              let projectedRemainder = 0;
              for (let dayDoc = doc + 1; dayDoc <= weekEndDoc; dayDoc++) {
                const calcFuture = calculateDailyFeed(dayDoc, Number(r.initial_shrimp_count), Number(r.area_m2), 0, sr);
                projectedRemainder += (calcFuture.dailyFeedKg * feedRatio);
              }
              weeklyFeed += projectedRemainder;
            }
          } else {
            // Pure projection week scaled by AI ratio
            for (let day = 0; day < 7; day++) {
              const targetDoc = weekStartDoc + day;
              const calcWeekly = calculateDailyFeed(targetDoc, Number(r.initial_shrimp_count), Number(r.area_m2), 0, sr);
              weeklyFeed += (calcWeekly.dailyFeedKg * feedRatio);
            }
            isReal = false;
          }
          
          totalKg += weeklyFeed;
          weeks.push({ week: w, kg: weeklyFeed, docStart: weekStartDoc, isReal });
        }
        
        return { ...r, doc, sr, proj: { totalKg, dailyTodayKg, weeks } };
      }));
    })();
  }, []);

  const agg = useMemo(() => {
    const list = ponds ?? [];
    const act = selected ? list.filter((p) => p.pond_id === selected) : list;
    const totalKg = act.reduce((a, p) => a + p.proj.totalKg, 0);
    return { list, act, totalKg };
  }, [ponds, selected]);

  if (!ponds) return <div className="flex min-h-screen items-center justify-center bg-[#F1F4F5]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" /></div>;

  const single = selected ? agg.act[0] : null;
  const weeks = single?.proj.weeks ?? [];
  const maxWeek = Math.max(...weeks.map((w: any) => w.kg), 10);
  const niceMax = maxWeek * 1.1;

  return (
    <div className="min-h-screen bg-[#F1F4F5] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full md:flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-md pb-28 md:max-w-3xl md:pb-12 md:pt-4">
        {/* ============ HEADER ============ */}
        <header className="flex items-center gap-2 px-4 pb-4 pt-6 md:px-8">
          <button onClick={() => router.push("/dashboard")} className="rounded-full p-1.5 text-slate-700 hover:bg-white md:hidden"><ArrowLeft size={20} /></button>
          <h1 className="text-base font-bold md:text-2xl">Proyeksi Pakan</h1>
        </header>

        <main className="space-y-4 px-4 md:px-8">
          {/* ============ KARTU RINGKASAN ============ */}
          {!single ? (
            <div className="grid grid-cols-1 overflow-hidden rounded-xl ">
              <div className="bg-white p-4">
                <p className="text-[11px] text-slate-500">Total Pakan</p>
                <p className="mt-1 text-xl font-bold text-slate-800">{fmtKg(agg.totalKg)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 rounded-xl bg-white p-4 ">
              <div><p className="text-base font-bold text-[#2F6E7B]">{fmtKg(single.proj.totalKg)}</p><p className="text-[10px] text-slate-500">Total Pakan</p></div>
              <div><p className="text-base font-bold text-[#2F6E7B]">{Math.max(0, TARGET_HARI - single.doc)} hari</p><p className="text-[10px] text-slate-500">Sisa Hari</p></div>
            </div>
          )}

          {/* ============ PEMILIH KOLAM ============ */}
          {!single && <p className="mb-2 text-[14px] font-semibold text-slate-700">Pilih Kolam</p>}
          <div className="relative">
            <button onClick={() => setShowPicker(!showPicker)} className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3.5 text-sm text-slate-700  ring-1 ring-slate-100">
              {single ? single.pond_name : "Semua Kolam"}
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${showPicker ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showPicker && (
              <>
                <button aria-label="Tutup" onClick={() => setShowPicker(false)} className="fixed inset-0 z-40 cursor-default" />
                <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-white p-2  ring-1 ring-slate-100 z-50">
                  <button onClick={() => { setSelected(null); setShowPicker(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition ${selected === null ? "bg-[#E3F1F2] text-[#2F6E7B] font-semibold" : "text-slate-600 hover:bg-[#F1F4F5]"}`}>
                    Semua Kolam {selected === null && <Check size={16} className="text-[#2ABFC8]" />}
                  </button>
                  {(ponds ?? []).map((p) => (
                    <button key={p.pond_id} onClick={() => { setSelected(p.pond_id); setShowPicker(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition ${selected === p.pond_id ? "bg-[#E3F1F2] text-[#2F6E7B] font-semibold" : "text-slate-600 hover:bg-[#F1F4F5]"}`}>
                      <span>{p.pond_name} <span className="text-[10px] text-slate-400 font-normal ml-1">DOC {p.doc}</span></span>
                      {selected === p.pond_id && <Check size={16} className="text-[#2ABFC8]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>



          {/* ============ MODE SATU KOLAM: CHART + RINCIAN ============ */}
          {single && (
            <>
              <section>
                <h2 className="mb-3 text-[14px] font-bold">Kebutuhan Pakan Mingguan</h2>
                <div className="flex h-56 w-full gap-1">
                  <div className="flex flex-col justify-between pb-6 pr-2 text-right text-[9px] text-slate-400">
                    {[1, 0.75, 0.5, 0.25, 0].map((t) => <span key={t} className="leading-none">{Math.round(niceMax * t)}</span>)}
                  </div>
                  <div className="relative flex-1 overflow-x-auto border-b border-slate-300">
                    <div className="absolute inset-x-0 bottom-6 top-0">
                      {[0, 25, 50, 75, 100].map((p) => (
                        <div key={p} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${p}%` }} />
                      ))}
                    </div>
                    <div className="relative flex h-full items-end gap-3 px-1 pb-0 min-w-max">
                      {weeks.map((w: any) => (
                        <div key={w.week} className="flex h-full flex-col items-center justify-end w-7 shrink-0">
                          <div className={`w-full rounded-t-sm mb-1 ${w.isReal ? 'bg-[#2ABFC8]' : 'bg-[#2ABFC8]/60'}`} style={{ height: `${Math.max(2, (w.kg / niceMax) * 100)}%` }} title={`${fmtKg1(w.kg)} ${w.isReal ? '(Historis)' : '(Proyeksi)'}`} />
                          <span className="text-center text-[9px] text-slate-500 whitespace-nowrap h-5 flex items-center">Mgg {w.week}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[14px] font-bold">Rincian Pakan Perminggu</h2>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ">
                  {weeks.map((w: any) => (
                    <div key={w.week} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#F1F4F5] px-3 py-2 text-xs font-medium text-slate-700">Minggu {w.week}</span>
                        {w.isReal && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Aktual</span>}
                      </div>
                      <span className="text-right">
                        <p className="text-xs font-bold text-[#1C9098]">{fmtKg1(w.kg)}</p>
                        <p className="text-[10px] text-slate-400">{pelletType(w.docStart + 3)}</p>
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



      {/* ============ BOTTOM NAV + FAB ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="relative border-t border-slate-100 bg-white">
          <button onClick={() => setShowTambah(true)} className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#2ABFC8] text-white  ring-4 ring-white/70 transition active:scale-95">
            <Plus size={24} />
          </button>
          <div className="grid grid-cols-5">
            {[
              { label: "Beranda", icon: Home, href: "/dashboard", active: false },
              { label: "Proyeksi", icon: BarChart3, href: "/proyeksi", active: true },
              { empty: true },
              { label: "Komunitas", icon: MessageCircle, href: "/komunitas", active: false },
              { label: "Profil", icon: User, href: "/profil", active: false },
            ].map((item: any) => {
              if (item.empty) return <div key="empty" className="pointer-events-none" />;
              const { label, icon: Icon, href, active } = item;
              return (
                <a key={label} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#1C9098]" : "text-slate-400"}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "fill-[#1C9098]" : ""} />
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      <TambahKolamSheet
        open={showTambah}
        onClose={() => setShowTambah(false)}
        onSaved={() => {
          setShowTambah(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
