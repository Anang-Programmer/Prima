"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck, BarChart3, Bell, ChevronRight, Crown, Fish, HelpCircle, History,
  Home, Info, Loader2, LogOut, MessageCircle, Plus, ShieldCheck, User, Warehouse,
  CircleUser, FileText, Pencil
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DesktopSidebar } from "@/components/DesktopSidebar";

const inputCls = "w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50";

function Sheet({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-3 md:relative z-10 md:w-full md:max-w-md md:rounded-[24px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
        <h3 className="mb-4 text-base font-extrabold text-slate-800">{title}</h3>
        {children}
      </div>
    </div>
  );
}
function MenuRow({ icon: Icon, label, onClick, danger }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-slate-100 bg-white px-4 py-4 text-left last:border-0 transition active:bg-slate-50">
      <Icon size={20} className={danger ? "text-[#F26B4E]" : "text-[#2ABFC8]"} />
      <span className={`flex-1 text-sm font-medium ${danger ? "text-[#F26B4E]" : "text-slate-700"}`}>{label}</span>
      <ChevronRight size={16} className="text-slate-400" />
    </button>
  );
}
function Label({ children }: any) {
  return <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{children}</p>;
}

const DEMO = {
  name: "Pak Matta", location: "Takalar, Sulawesi Selatan", premium: true, premiumExpiry: null,
  farmName: "Tambak Prima", phone: "",
  stats: { aktif: 3, selesai: 12, fcr: 1.15 },
  harvests: [
    { pond_name: "Kolam A1", end_date: "2026-07-20", harvest_biomass_kg: 3200, harvest_fcr: 1.15, harvest_sr_pct: 88 },
    { pond_name: "Kolam B2", end_date: "2026-05-02", harvest_biomass_kg: 2100, harvest_fcr: 1.32, harvest_sr_pct: 81 },
  ],
};

export default function ProfilPage() {
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [sheet, setSheet] = useState<null | string>(null);
  const [farm, setFarm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { logout(); return; }
        
        const [{ data: prof }, { count: aktif }, { count: selesai }, { data: harvests }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("ponds").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "Aktif"),
          supabase.from("cycles").select("*", { count: "exact", head: true }).eq("status", "Selesai"),
          supabase.from("v_harvest_history").select("*").eq("user_id", user.id).order("end_date", { ascending: false }),
        ]);
        const fcrs = (harvests ?? []).map((h: any) => Number(h.harvest_fcr)).filter((n: number) => n > 0);
        
        const meta = user.user_metadata || {};
        const metaLocation = [meta.kota, meta.provinsi].filter(Boolean).join(", ");
        
        setD({
          name: meta.username || user.email?.split('@')[0], 
          location: prof?.location || metaLocation || "", 
          isPremium: !!prof?.is_premium,
          premiumExpiry: prof?.premium_expires_at, 
          farmName: prof?.farm_name || "", 
          phone: prof?.phone || meta.phone || "",
          stats: { aktif: aktif ?? 0, selesai: selesai ?? 0, fcr: fcrs.length ? Math.min(...fcrs) : null },
          harvests: harvests ?? [],
        });

        // Fetch is done
      } catch {
        setD(DEMO); setIsDemo(true);
      }
    })();
  }, []);

  async function saveFarm() {
    setBusy(true);
    await supabase.from("profiles").update({ farm_name: farm.farmName, location: farm.location, phone: farm.phone }).eq("id", (await supabase.auth.getUser()).data.user?.id);
    setBusy(false); setSheet(null); location.reload();
  }
  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const [confirmAction, setConfirmAction] = useState<"upgrade" | "downgrade" | null>(null);

  async function handleUpgrade() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);
      location.reload();
    }
    setBusy(false);
  }

  async function handleDowngrade() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Set is_premium = false
      await supabase.from("profiles").update({ is_premium: false }).eq("id", user.id);
      
      // 2. Reduce ponds to 1
      const { data: ponds } = await supabase.from("ponds").select("id").eq("user_id", user.id).eq("status", "Aktif").order("created_at", { ascending: true });
      if (ponds && ponds.length > 1) {
        const pondsToArchive = ponds.slice(1).map(p => p.id);
        const res = await supabase.from("ponds").update({ status: "Non-aktif" }).in("id", pondsToArchive);
        console.log("Archive result:", res);
      }
      location.reload();
    }
    setBusy(false);
  }

  if (!d) return <div className="flex min-h-screen items-center justify-center bg-[#F2F5F7]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" /></div>;

  const initial = (d.name || "?")[0]?.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F2F5F7] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full pb-28 md:flex-1 md:overflow-y-auto md:pb-12">
        {/* ============ HEADER ============ */}
        <header className="relative overflow-hidden bg-[#2ABFC8] px-5 pb-6 pt-12 md:rounded-b-3xl md:px-10 md:pb-12 md:pt-14 shadow-sm">
          
          <div className="relative mx-auto w-full max-w-md md:max-w-5xl z-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#BEE5EA] text-[26px] font-medium text-[#2F6E7B] md:h-20 md:w-20 md:text-3xl shadow-sm">
                {initial}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[22px] font-semibold text-white tracking-wide md:text-2xl">{d.name}</h1>
                <p className="truncate text-xs text-white/90 font-light mt-0.5 md:text-sm">{d.location || "Lokasi belum diisi"}</p>
                <div className="mt-2">
                  {d.isPremium ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#003746] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      Prime <BadgeCheck size={12} className="text-white fill-white stroke-[#003746]" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm border border-white/30">
                      Gratis
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-3 divide-x divide-white/20 md:mt-10">
              {[
                [String(d.stats.aktif), "Kolam Aktif"],
                [String(d.stats.selesai), "Siklus Selesai"],
                [d.stats.fcr != null ? Number(d.stats.fcr).toFixed(2) : "–", "FCR Terbaik"],
              ].map(([v, l]) => (
                <div key={l} className="text-center px-1">
                  <p className="text-[22px] font-semibold text-white md:text-3xl">{v}</p>
                  <p className="text-[11px] text-white/80 font-light mt-0.5 md:text-sm">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md md:max-w-5xl md:px-10">
          
          {/* ============ UPGRADE CARD ============ */}
          {!d.isPremium && (
            <section className="px-5 mt-4 md:px-0">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002D3A] to-[#00586D] p-5 shadow-md">
                <div className="relative z-10">
                  <h3 className="text-[17px] font-medium text-white mb-8 tracking-wide">Upgrade Akun ke Prime</h3>
                  <button onClick={() => setConfirmAction("upgrade")} className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-[#003746] transition active:scale-95 shadow-sm">
                    Upgrade <ChevronRight size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ============ DOWNGRADE CARD ============ */}
          {d.isPremium && (
            <section className="px-5 mt-4 md:px-0">
              <div className="relative overflow-hidden rounded-2xl bg-[#E3F1F2] p-5 shadow-sm border border-[#2ABFC8]/20">
                <div className="relative z-10">
                  <h3 className="text-[17px] font-medium text-[#2F6E7B] mb-8 tracking-wide">Akun Prime Aktif</h3>
                  <button onClick={() => setConfirmAction("downgrade")} className="flex items-center gap-1.5 rounded-lg bg-white border border-[#2ABFC8] px-4 py-2 text-[13px] font-bold text-[#2ABFC8] transition active:scale-95 shadow-sm">
                    Kembali ke Gratis <ChevronRight size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ============ MENU ============ */}
          <section className="mt-4 overflow-hidden rounded-none bg-white shadow-sm md:rounded-2xl md:mt-6 border-y border-slate-100 md:border-0">
            <MenuRow icon={CircleUser} label="Akun & Data Pribadi" onClick={() => router.push("/profil/edit")} />
            <MenuRow icon={FileText} label="Data Tambak" onClick={() => { setFarm({ farmName: d.farmName, location: d.location, phone: d.phone }); setSheet("farm"); }} />
            <MenuRow icon={History} label="Riwayat Panen" onClick={() => router.push("/riwayat-panen")} />
            <MenuRow icon={ShieldCheck} label="Privasi & Keamanan" onClick={() => router.push("/privasi")} />
          </section>
          
          <section className="mt-3 overflow-hidden rounded-none bg-white shadow-sm md:rounded-2xl border-y border-slate-100 md:border-0">
            <MenuRow icon={HelpCircle} label="Pusat Bantuan" onClick={() => router.push("/profil/bantuan")} />
            <MenuRow icon={Info} label="Tentang Aplikasi" onClick={() => setSheet("about")} />
          </section>

          <div className="px-5 py-6">
            <button onClick={logout} className="w-full rounded-xl bg-white border-[1.5px] border-[#F26B4E] py-3 text-sm font-bold text-[#F26B4E] transition active:bg-orange-50">
              Keluar
            </button>
          </div>
        </main>
      </div>

      {/* ============ BOTTOM NAV + FAB ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="relative border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <button onClick={() => router.push("/dashboard")} className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#2ABFC8] text-white shadow-lg ring-4 ring-white/70">
            <Plus size={24} />
          </button>
          <div className="grid grid-cols-4">
            {[
              { label: "Beranda", icon: Home, href: "/dashboard", active: false },
              { label: "Proyeksi", icon: BarChart3, href: "/proyeksi", active: false },
              { label: "Komunitas", icon: MessageCircle, href: "/komunitas", active: false },
              { label: "Profil", icon: User, href: "/profil", active: true },
            ].map(({ label, icon: Icon, href, active }) => (
              <a key={label} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#1C9098]" : "text-slate-400"}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ============ CONFIRM MODAL ============ */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Tutup" onClick={() => setConfirmAction(null)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl">
            <h3 className="text-center text-[18px] font-bold text-slate-800">
              {confirmAction === "upgrade" ? "Upgrade ke Prime?" : "Kembali ke Gratis?"}
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600 leading-relaxed">
              {confirmAction === "upgrade" 
                ? "Anda akan beralih ke paket Prime. (Ini adalah simulasi MVP)"
                : "Anda akan beralih ke paket Gratis. Kolam tambahan Anda akan otomatis diarsipkan dan hanya menyisakan 1 kolam aktif. Yakin ingin melanjutkan?"}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={confirmAction === "upgrade" ? handleUpgrade : handleDowngrade}
                disabled={busy}
                className="w-full rounded-[10px] bg-[#2ABFC8] py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {confirmAction === "upgrade" ? "Ya, Upgrade" : "Ya, Downgrade"}
              </button>
              <button 
                onClick={() => setConfirmAction(null)}
                disabled={busy}
                className="w-full rounded-[10px] py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ SHEET: DATA TAMBAK ============ */}
      <Sheet open={sheet === "farm"} onClose={() => setSheet(null)} title="Data Tambak">
        <div className="space-y-4">
          <div><Label>Nama Usaha Tambak</Label><input className={inputCls} placeholder="cth. Tambak Prima" value={farm.farmName ?? ""} onChange={(e) => setFarm({ ...farm, farmName: e.target.value })} /></div>
          <div><Label>Lokasi</Label><input className={inputCls} placeholder="cth. Takalar, Sulawesi Selatan" value={farm.location ?? ""} onChange={(e) => setFarm({ ...farm, location: e.target.value })} /></div>
          <div><Label>No. HP</Label><input className={inputCls} type="tel" value={farm.phone ?? ""} onChange={(e) => setFarm({ ...farm, phone: e.target.value })} /></div>
          <button onClick={saveFarm} disabled={busy} className="w-full rounded-[10px] bg-[#2ABFC8] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Simpan"}
          </button>
        </div>
      </Sheet>



      {/* ============ SHEET: PREMIUM ============ */}
      <Sheet open={sheet === "premium"} onClose={() => setSheet(null)} title="Langganan Premium">
        {d.premium ? (
          <div className="rounded-xl bg-[#CFE8EB] px-4 py-4 text-sm text-[#1F6470]">
            <p className="flex items-center gap-2 font-bold"><Crown size={16} /> Akun Premium aktif</p>
            <p className="mt-1 text-xs">Kolam tanpa batas + rekomendasi AI penuh.{d.premiumExpiry ? ` Berlaku s/d ${new Date(d.premiumExpiry).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.` : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• Kolam aktif tanpa batas (gratis: 1 kolam)</li>
            </ul>
            <button disabled className="w-full rounded-[10px] bg-[#2ABFC8] py-3 text-sm font-semibold text-white opacity-60">Segera Hadir</button>
          </div>
        )}
      </Sheet>

      {/* ============ SHEET: PLACEHOLDER ============ */}
      <Sheet open={sheet === "notif"} onClose={() => setSheet(null)} title="Notifikasi">
        <p className="py-6 text-center text-xs text-slate-400">Belum ada notifikasi baru.</p>
      </Sheet>
      <Sheet open={sheet === "about"} onClose={() => setSheet(null)} title="Tentang Aplikasi">
        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <p>Prima adalah platform budidaya udang berbasis AI yang membantu petambak mengelola kolam dengan lebih mudah dan terarah.</p>
          <p>Prima membantu Anda mencatat aktivitas budidaya, memantau perkembangan kolam, serta mendapatkan rekomendasi operasional berdasarkan kondisi kolam Anda.</p>
          <p>Mulai dari pakan, probiotik, kualitas air, hingga pertumbuhan udang. Prima membantu mengubah data budidaya menjadi informasi dan langkah yang lebih mudah dipahami. Tujuan kami sederhana: membantu Anda mengambil keputusan budidaya dengan lebih percaya diri, menggunakan sumber daya secara lebih efisien, dan mendapatkan hasil panen yang lebih konsisten.</p>
          
          <div className="pt-6 font-medium text-slate-800 text-center">
            <h3 className="text-base font-bold text-[#2ABFC8] mb-1">Prima</h3>
            <p className="text-[#8E9F9F]">Teman pintar untuk budidaya yang lebih terarah</p>
            <p className="mt-4 text-[10px] text-slate-400">Versi Aplikasi: 1.0.0<br/>© 2026 Prima. All rights reserved.</p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}