"use client";

import { FormEvent, useState } from "react";
import { Loader2, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ============================================================
   HALAMAN MASUK (LOGIN)
   Bisa pakai EMAIL atau USERNAME + password.
   Mobile 100% senafas dengan desain halaman Daftar.
============================================================ */

import Image from "next/image";

function LogoOnTeal() {
    return (
        <div className="flex select-none items-center justify-center">
            <Image src="/logo.png" alt="PRIMA Logo" width={180} height={60} className="h-12 w-auto object-contain brightness-0 invert" priority />
        </div>
    );
}

/* Watermark ilustrasi header (ganti <img> asset asli kalau ada) */
function HeaderArt() {
    return (
        <svg
            viewBox="0 0 360 120"
            fill="none"
            stroke="#0E3A46"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-20"
            aria-hidden
        >
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
    icon: React.ReactNode;
    bordered?: boolean;
};
function Field({ label, icon, bordered, ...rest }: FieldProps) {
    return (
        <div>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{label}</p>
            <div className="relative">
                <input
                    {...rest}
                    className={`w-full rounded-[10px] bg-[#E7EAEB] py-3.5 pl-4 pr-11 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50 ${bordered ? "border-[1.5px] border-[#2ABFC8]" : ""
                        }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-800">{icon}</span>
            </div>
        </div>
    );
}

export default function MasukPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState(""); // email ATAU username
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            let email = identifier.trim();

            // Kalau bukan format email -> anggap username, cari emailnya via RPC
            if (!email.includes("@")) {
                const { data, error: rpcErr } = await supabase.rpc("get_email_by_username", {
                    p_username: email,
                });
                if (rpcErr) throw rpcErr;
                if (!data) throw new Error("Username tidak ditemukan.");
                email = data as string;
            }

            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err?.message || "Terjadi kesalahan, coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#2ABFC8] md:bg-white md:flex md:items-center md:justify-center">
            <div className="flex h-dvh flex-col overflow-hidden md:h-screen md:w-full md:max-w-none md:flex-row md:rounded-none md:bg-white">
                {/* ============ HEADER TEAL (Mobile) / KIRI (Desktop) ============ */}
                <header className="relative shrink-0 bg-[#2ABFC8] pb-10 pt-6 md:w-1/2 md:pb-0 md:pt-0 md:flex md:flex-col md:items-center md:justify-center md:bg-gradient-to-br md:from-[#2ABFC8] md:to-[#20606D]">
                    <LogoOnTeal />
                    <div className="hidden md:block mt-8 text-center px-12 z-10">
                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Selamat Datang Kembali</h2>
                        <p className="text-white/80 leading-relaxed text-sm">Masuk ke akun Anda untuk terus memantau tambak dan mendapatkan panen udang terbaik bersama Prima.</p>
                    </div>
                    <HeaderArt />
                </header>

                {/* ============ BOTTOM SHEET (Mobile) / KANAN (Desktop) ============ */}
                <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-[24px] bg-white md:w-1/2 md:rounded-none md:justify-center md:px-8 md:py-4">
                    <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />

                    <div className="hidden md:block text-center mt-6 mb-8">
                        <h3 className="text-2xl font-bold text-slate-800">Masuk Akun</h3>
                        <p className="text-sm text-slate-500 mt-2">Silakan masuk menggunakan Email atau Username.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden md:flex-none md:overflow-visible">
                        <div className="space-y-4 overflow-y-auto px-4 pt-5 md:px-4 md:pt-0 md:overflow-visible">
                            <Field
                                label="Email atau Username"
                                icon={<User size={18} />}
                                type="text"
                                placeholder="Ketik Username / Email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                autoComplete="username"
                            />
                            <Field
                                label="Password"
                                icon={<Lock size={18} />}
                                type="password"
                                placeholder="Ketik Nama"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />

                            {error && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                            )}
                        </div>

                        <div className="shrink-0 px-4 pb-7 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-[10px] bg-[#2ABFC8] py-3.5 text-sm font-semibold text-white  transition active:scale-[0.98] disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Masuk"}
                            </button>
                            <p className="mt-4 text-center text-xs text-slate-500">
                                Belum punya akun?{" "}
                                <Link href="/daftar" className="font-semibold text-[#37808C]">
                                    Daftar
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
