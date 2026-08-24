"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const inputCls = "w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50";

function Label({ children }: any) {
  return <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{children}</p>;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profileForm, setProfileForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/"); return; }
        
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        
        const meta = user.user_metadata || {};
        const fname = meta.first_name || meta.firstName || "";
        const lname = meta.last_name || meta.lastName || "";
        
        setProfileForm({
          firstName: fname,
          lastName: lname,
          email: user.email || "",
          phone: prof?.phone || meta.phone || "",
          kecamatan: meta.kecamatan || "",
          kota: meta.kota || "",
          provinsi: meta.provinsi || ""
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [router]);

  async function saveProfile() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ 
        phone: profileForm.phone 
      }).eq("id", user.id);
      
      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          phone: profileForm.phone,
          kecamatan: profileForm.kecamatan,
          kota: profileForm.kota,
          provinsi: profileForm.provinsi,
        }
      });
    }
    setBusy(false);
    router.push("/profil");
  }

  return (
    <div className="min-h-screen bg-[#F2F5F7] flex flex-col md:justify-center md:items-center">
      <div className="w-full max-w-md bg-white min-h-screen md:min-h-0 md:rounded-[24px] md:shadow-sm md:overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center px-4 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <button onClick={() => router.back()} className="mr-3 p-1 text-slate-600 hover:bg-slate-100 rounded-full transition">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-base font-extrabold text-slate-800">Profile</h1>
        </header>

        {loadingData ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : (
          <main className="flex-1 px-5 py-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#8E9F9F] text-white shadow-sm border-4 border-white">
                   <Pencil size={28} className="opacity-80" />
                </div>
              </div>

              <div>
                <Label>Nama anda</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input className={inputCls} placeholder="Nama depan" value={profileForm.firstName ?? ""} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                  <input className={inputCls} placeholder="Nama belakang" value={profileForm.lastName ?? ""} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
                </div>
              </div>
              <div><Label>Email</Label><input className={`${inputCls} bg-slate-100 opacity-70`} disabled placeholder="Ketik" value={profileForm.email ?? ""} /></div>
              <div><Label>No HP</Label><input className={inputCls} type="tel" placeholder="Ketik" value={profileForm.phone ?? ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
              
              <hr className="border-slate-200 my-4" />

              <div><Label>Kecamatan</Label><input className={inputCls} placeholder="Ketik" value={profileForm.kecamatan ?? ""} onChange={(e) => setProfileForm({ ...profileForm, kecamatan: e.target.value })} /></div>
              <div><Label>Kota</Label><input className={inputCls} placeholder="Ketik Nama" value={profileForm.kota ?? ""} onChange={(e) => setProfileForm({ ...profileForm, kota: e.target.value })} /></div>
              <div><Label>Provinsi</Label><input className={inputCls} placeholder="Ketik Nama" value={profileForm.provinsi ?? ""} onChange={(e) => setProfileForm({ ...profileForm, provinsi: e.target.value })} /></div>
              
              <div className="pt-8 pb-4">
                <button onClick={saveProfile} disabled={busy} className="w-full rounded-xl bg-[#2ABFC8] py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition active:scale-[0.98]">
                  {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Simpan"}
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
