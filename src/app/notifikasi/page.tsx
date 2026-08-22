"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, AlertTriangle, MessageCircle, Heart, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT";
  actor_name: string;
  post_id: string;
  is_read: boolean;
  created_at: string;
}

interface PondTimer {
  id: string;
  pond_id: string;
  type: string;
  due_time: string;
}

interface PondInfo {
  pond_id: string;
  pond_name: string;
  doc: number | null;
}

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [pondTimers, setPondTimers] = useState<{ pond: PondInfo, timers: PondTimer[] }[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Tick for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/masuk");
          return;
        }

        const [{ data: userNotifs }, { data: ponds }] = await Promise.all([
          supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("v_pond_dashboard").select("pond_id, pond_name, doc").eq("user_id", user.id)
        ]);

        const rawPondList = (ponds || []) as PondInfo[];
        // Deduplikasi berdasarkan pond_id (view bisa return >1 baris per kolam)
        const seen = new Set<string>();
        const pondList: PondInfo[] = [];
        for (const p of rawPondList) {
          if (!seen.has(p.pond_id)) {
            seen.add(p.pond_id);
            pondList.push(p);
          }
        }
        const pondIds = pondList.map(p => p.pond_id);

        let activeTimers: PondTimer[] = [];
        if (pondIds.length > 0) {
          const { data: timers } = await supabase
            .from("active_timers")
            .select("id, pond_id, type, due_time")
            .in("pond_id", pondIds)
            .eq("is_completed", false);
          if (timers) activeTimers = timers;
        }

        // Hanya tampilkan timer yang waktunya sudah tiba (<= now)
        const dueAlarms = activeTimers.filter(t => new Date(t.due_time).getTime() <= Date.now());

        // Group by pond
        const groupedTimers: { pond: PondInfo, timers: PondTimer[] }[] = [];
        for (const pond of pondList) {
          const tForPond = dueAlarms.filter(t => t.pond_id === pond.pond_id);
          if (tForPond.length > 0) {
            groupedTimers.push({ pond, timers: tForPond });
          }
        }

        setNotifs(userNotifs || []);
        setPondTimers(groupedTimers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleCommunityNotifClick = async (notif: Notification) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    router.push(`/komunitas/${notif.post_id}`);
  };

  function formatCountdown(ms: number) {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / 3600000).toString().padStart(2, "0");
    const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, "0");
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // Avatar memakai inisial nama, tanpa foto profil.
  function getInitial(name: string) {
    return name.trim().charAt(0).toUpperCase() || "?";
  }

  // Pisahkan notifikasi ke Hari Ini dan Kemarin (sederhana)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayNotifs = notifs.filter(n => new Date(n.created_at) >= todayStart);
  const olderNotifs = notifs.filter(n => new Date(n.created_at) < todayStart);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1FB4B2] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F5F6] text-[#10242E] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-[#F2F5F6] px-5 py-4">
        <Link href="/dashboard" className="mr-2 -ml-1 rounded-full p-1 text-[#10242E] transition active:bg-slate-200">
          <ChevronLeft size={25} strokeWidth={2.2} />
        </Link>
        <h1 className="text-[23px] font-bold tracking-[-0.02em]">Notifikasi</h1>
      </div>

      <div className="px-5 pb-6 pt-1">
        
        {/* HARI INI */}
        {(todayNotifs.length > 0 || pondTimers.length > 0) && (
          <section>
            <h2 className="mb-4 text-[18px] font-medium text-[#0C202A]">Hari Ini</h2>
            
            <div className="space-y-5">
              {/* Social Notifs Hari Ini */}
              {todayNotifs.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleCommunityNotifClick(notif)}
                  className="flex cursor-pointer items-start gap-4"
                >
                  <div className="relative">
                    {!notif.is_read && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9E0E3]">
                      <span className="text-[17px] font-bold text-[#5D6B72]">{getInitial(notif.actor_name)}</span>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#F2F5F6] text-white ${notif.type === 'LIKE' ? 'bg-[#FF8B7C]' : 'bg-[#8AB7CB]'}`}>
                          {notif.type === 'LIKE' ? <Heart size={9} className="fill-current" /> : <MessageCircle size={9} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <p className="text-[15px] leading-[1.25] text-[#536169]">
                      <span className="font-semibold text-[#10242E]">{notif.actor_name}</span> {notif.type === 'LIKE' ? 'Memberi suka pada postingan anda' : 'Memberi komentar pada postingan anda'}
                    </p>
                    <p className="mt-1 text-[12px] text-[#8A949A]">
                      {Math.max(1, Math.floor((Date.now() - new Date(notif.created_at).getTime()) / 3600000))}j
                    </p>
                  </div>
                </div>
              ))}

              {/* Kolam Alarms Hari Ini */}
              {pondTimers.map(pt => (
                <Link
                  key={pt.pond.pond_id}
                  href={`/kolam/${pt.pond.pond_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-transform active:scale-[0.985]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AlertTriangle className="shrink-0 text-[#FF4D3D]" size={27} strokeWidth={2.2} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#172A33]">{pt.pond.pond_name}</p>
                      <p className="text-[12px] text-[#7B878E]">{pt.pond.doc && pt.pond.doc > 0 ? `DOC ${pt.pond.doc}` : "Belum Mulai"}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex flex-col gap-1.5">
                      {pt.timers.map(timer => {
                        const ms = new Date(timer.due_time).getTime() - now;
                        return (
                          <div key={timer.id} className="flex overflow-hidden rounded-[9px]">
                            <div className="min-w-[67px] bg-[#FFD5CC] px-2 py-1.5 text-center text-[10px] font-medium text-[#4C565B]">
                              {timer.type}
                            </div>
                            <div className="min-w-[72px] bg-[#FF4335] px-2 py-1.5 text-center text-[10px] font-bold tabular-nums text-white">
                              {formatCountdown(ms)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <ChevronRight size={21} className="text-[#B8C0C5]" strokeWidth={2.4} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* KEMARIN */}
        {olderNotifs.length > 0 && (
          <section>
            <h2 className="mb-4 text-[18px] font-medium text-[#0C202A]">Kemarin</h2>
            
            <div className="space-y-4">
              {olderNotifs.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleCommunityNotifClick(notif)}
                  className="flex cursor-pointer items-start gap-4"
                >
                  <div className="relative">
                    {!notif.is_read && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9E0E3]">
                      <span className="text-[17px] font-bold text-[#5D6B72]">{getInitial(notif.actor_name)}</span>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#F2F5F6] text-white ${notif.type === 'LIKE' ? 'bg-[#FF8B7C]' : 'bg-[#8AB7CB]'}`}>
                          {notif.type === 'LIKE' ? <Heart size={9} className="fill-current" /> : <MessageCircle size={9} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <p className="text-[15px] leading-[1.25] text-[#536169]">
                      <span className="font-semibold text-[#10242E]">{notif.actor_name}</span> {notif.type === 'LIKE' ? 'Memberi suka pada postingan anda' : 'Memberi komentar pada postingan anda'}
                    </p>
                    <p className="mt-1 text-[12px] text-[#8A949A]">
                      {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pondTimers.length === 0 && notifs.length === 0 && (
          <div className="text-center text-sm text-slate-500 mt-10">
            Belum ada notifikasi
          </div>
        )}

      </div>
    </div>
  );
}