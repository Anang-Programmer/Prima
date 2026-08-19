"use client";

import { FormEvent, useState } from "react";
import { Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

/* ============================================================
   HALAMAN DAFTAR (REGISTER) - MULTI STEP
   Langkah 1: Akun (Email, Username, dll)
   Langkah 2: Lengkapi Profil (Nama, Kecamatan, Kota, Provinsi)
============================================================ */

function LogoOnTeal() {
  return (
    <div className="flex select-none items-center justify-center">
      <Image src="/logo.png" alt="PRIMA Logo" width={180} height={60} className="h-12 w-auto object-contain brightness-0 invert" priority />
    </div>
  );
}

function LogoOnGray() {
  return (
    <div className="flex select-none items-center justify-center mb-8">
      <Image src="/logo.png" alt="PRIMA Logo" width={180} height={60} className="h-10 w-auto object-contain" priority />
    </div>
  );
}

function HeaderArt() {
  return (
    <svg viewBox="0 0 360 120" fill="none" stroke="#0E3A46" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-20" aria-hidden>
      <path d="M30 78l-10-6M34 64l-12-3M42 52l-9-8" />
      <path d="M78 62c8-10 34-10 42 0" />
      <path d="M88 60c1-12 22-12 23 0" />
      <path d="M92 74c0 8 5 14 8 16M118 74c0 8-5 14-8 16" />
      <path d="M99 80c2 3 8 3 10 0" />
      <rect x="228" y="30" width="76" height="52" rx="12" />
      <path d="M244 66V56M256 66V48M268 66V52M280 66V42" />
      <path d="M240 46l14-6 12 6 16-10" />
      <path d="M20 108c20-8 40 8 60 0s40 8 60 0 40 8 60 0 40 8 60 0 40 8 60 0" />
    </svg>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
};
function Field({ label, icon, ...rest }: FieldProps) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{label}</p>
      <div className="relative">
        <input
          {...rest}
          className={`w-full rounded-[10px] bg-[#EAEAEA] py-3.5 pl-4 ${icon ? 'pr-11' : 'pr-4'} text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#4C9AA6]/50 focus:bg-white transition-all`}
        />
        {icon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      </div>
    </div>
  );
}

export default function DaftarPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    phone: "", username: "", email: "", password: "", confirm: "",
    firstName: "", lastName: "", kecamatan: "", kota: "", provinsi: "", alamat: "" // Update database tambahin kolom alamat
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Handler Step 1 -> Step 2
  async function handleNext(e: FormEvent) {
    e.preventDefault();
    setError("");
    
    if (form.password !== form.confirm) return setError("Password dan konfirmasi password tidak sama.");
    if (form.password.length < 6) return setError("Password minimal 6 karakter.");

    setLoading(true);
    try {
      const { data: existingEmail, error: rpcErr } = await supabase.rpc("get_email_by_username", {
        p_username: form.username,
      });

      if (rpcErr) throw rpcErr;
      if (existingEmail) {
        throw new Error("Username sudah dipakai orang lain, silakan pilih username yang berbeda.");
      }

      setStep(2); // Lanjut ke lengkapi profil
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Handler Step 2 -> Submit ke Supabase
  async function handleDaftar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { 
          data: { 
            full_name: form.username, 
            phone: form.phone,
            first_name: form.firstName,
            last_name: form.lastName,
            kecamatan: form.kecamatan,
            kota: form.kota,
            provinsi: form.provinsi
          } 
        },
      });
      
      if (error) throw error;
      
      if (data.session) {
        router.push("/dashboard");
      } else {
        router.push("/masuk"); // Kalau butuh verifikasi email
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F2F5F7] flex flex-col pt-16 md:justify-center md:pt-0">
        <LogoOnGray />
        <div className="w-full max-w-md mx-auto bg-white rounded-t-[24px] md:rounded-[24px] shadow-sm flex flex-col flex-1 md:flex-none overflow-hidden relative md:my-8 md:max-h-[90vh]">
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />
          
          <form onSubmit={handleDaftar} className="flex flex-col flex-1 px-6 pt-6 pb-8 overflow-y-auto">
            <div className="space-y-4 flex-1">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-slate-800">Nama anda</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama depan"
                    value={form.firstName}
                    onChange={set("firstName")}
                    required
                    className="w-full rounded-[10px] bg-[#EAEAEA] py-3.5 px-4 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#4C9AA6]/50 focus:bg-white transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Nama Belakang"
                    value={form.lastName}
                    onChange={set("lastName")}
                    className="w-full rounded-[10px] bg-[#EAEAEA] py-3.5 px-4 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#4C9AA6]/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <Field
                label="Kecamatan"
                type="text"
                placeholder="Ketik Kecamatan"
                value={form.kecamatan}
                onChange={set("kecamatan")}
                required
              />
              <Field
                label="Kota"
                type="text"
                placeholder="Ketik Kota"
                value={form.kota}
                onChange={set("kota")}
                required
              />
              <Field
                label="Provinsi"
                type="text"
                placeholder="Ketik Provinsi"
                value={form.provinsi}
                onChange={set("provinsi")}
                required
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 shrink-0 w-full rounded-[10px] bg-[#4C9AA6] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Daftar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Langkah 1
  return (
    <div className="min-h-screen bg-[#4C9AA6] md:bg-white md:flex md:items-center md:justify-center">
      <div className="flex h-dvh flex-col overflow-hidden md:h-screen md:w-full md:max-w-none md:flex-row md:rounded-none md:bg-white">
        {/* ============ HEADER TEAL (Mobile) / KIRI (Desktop) ============ */}
        <header className="relative shrink-0 bg-[#4C9AA6] pb-10 pt-6 md:w-1/2 md:pb-0 md:pt-0 md:flex md:flex-col md:items-center md:justify-center md:bg-gradient-to-br md:from-[#4C9AA6] md:to-[#20606D]">
          <LogoOnTeal />
          <div className="hidden md:block mt-8 text-center px-12 z-10">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Mulai Budidaya Udang Pintar</h2>
            <p className="text-white/80 leading-relaxed text-sm">Catat pakan, pantau kualitas air, dan optimalkan panen udang Anda secara presisi dengan Prima.</p>
          </div>
          <HeaderArt />
        </header>

        {/* ============ BOTTOM SHEET (Mobile) / KANAN (Desktop) ============ */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-[24px] bg-white md:w-1/2 md:rounded-none md:justify-center md:px-8 md:py-4">
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />

          <div className="hidden md:block text-center mt-6 mb-8">
            <h3 className="text-2xl font-extrabold text-slate-800">Daftar Akun</h3>
            <p className="text-sm text-slate-500 mt-2">Lengkapi data di bawah untuk bergabung.</p>
          </div>

          <form onSubmit={handleNext} className="flex flex-1 flex-col overflow-hidden">
            <div className="space-y-4 overflow-y-auto px-4 pt-5 md:px-4 md:pt-0">
              <Field
                label="Username"
                icon={<User size={18} />}
                
                type="text"
                placeholder="Ketik Username"
                value={form.username}
                onChange={set("username")}
                required
                autoComplete="username"
              />
              <Field
                label="Nomor hp"
                icon={<Phone size={18} />}
                
                type="tel"
                inputMode="numeric"
                placeholder="No Hp"
                value={form.phone}
                onChange={set("phone")}
                required
                autoComplete="tel"
              />
              <Field
                label="Email"
                icon={<Mail size={18} />}
                
                type="email"
                placeholder="Ketik Email"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
              />
              <Field
                label="Password"
                icon={<Lock size={18} />}
                
                type="password"
                placeholder="Ketik Password"
                value={form.password}
                onChange={set("password")}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <Field
                label="Konfirmasi Password"
                icon={<Lock size={18} />}
                
                type="password"
                placeholder="Ketik Ulang Password"
                value={form.confirm}
                onChange={set("confirm")}
                required
                minLength={6}
                autoComplete="new-password"
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}
            </div>

            <div className="shrink-0 px-4 pb-7 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] bg-[#4C9AA6] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Selanjutnya"}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                Sudah punya akun?{" "}
                <Link href="/masuk" className="font-semibold text-[#37808C]">
                  Masuk
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
