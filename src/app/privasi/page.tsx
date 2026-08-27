"use client";

import { ArrowLeft, CheckCircle2, ShieldCheck, Lock, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/DesktopSidebar";

export default function PrivasiPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F1F4F5] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />

      <div className="w-full md:flex-1 md:overflow-y-auto bg-[#F1F4F5]">
        <div className="mx-auto flex h-screen w-full flex-col md:h-auto md:max-w-3xl md:py-8">
          
          {/* HEADER */}
          <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 pb-4 pt-5 md:rounded-t-2xl md:border-none md:px-8">
            <button
              onClick={() => router.back()}
              className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={21} />
            </button>
            <h1 className="text-[18px] font-semibold text-slate-800 md:text-2xl md:font-bold">
              Privasi & Keamanan
            </h1>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto bg-white px-5 py-6 md:px-8 md:py-8">
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5F5F7]">
                <ShieldCheck size={40} className="text-[#2ABFC8]" />
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-800">
                  {/* <Lock size={18} className="text-[#2ABFC8]" /> */}
                  Keamanan Data Berlapis
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Seluruh data tambak, siklus, log pakan, dan profil Anda dilindungi menggunakan teknologi enkripsi terkini. Kami menerapkan <strong>Row Level Security (RLS)</strong> pada database kami, yang menjamin bahwa data Anda hanya dan hanya bisa diakses oleh akun Anda sendiri. Bahkan administrator sistem tidak dapat membaca data operasional tambak Anda secara sepihak.
                </p>
              </section>

              <section>
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-800">
                  {/* <EyeOff size={18} className="text-[#2ABFC8]" /> */}
                  Privasi Komunitas
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Saat Anda menggunakan fitur Komunitas, nama profil dan avatar Anda akan terlihat oleh pengguna lain. Namun, data sensitif operasional (seperti nama tambak asli, detail lokasi spesifik, dan metrik panen pribadi) tidak akan pernah dibagikan tanpa persetujuan eksplisit dari Anda.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-base font-bold text-slate-800">Penggunaan Data oleh AI</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Asisten cerdas kami menganalisis data logbook harian (seperti pakan, tingkat kelangsungan hidup, dan probiotik) secara anonim untuk memberikan rekomendasi standar SNI yang presisi. Kami tidak memperjualbelikan data analitik Anda kepada pihak ketiga manapun.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-base font-bold text-slate-800">Hak Penghapusan Data</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Anda memiliki kendali penuh atas akun Anda. Jika Anda ingin menghapus seluruh data dan riwayat tambak secara permanen dari server kami, Anda dapat menghubungi tim dukungan (support) kami melalui Pusat Bantuan.
                </p>
              </section>
            </div>
          </main>

          {/* FOOTER ACTION */}
          <div className="shrink-0 border-t border-slate-100 bg-white p-5 md:rounded-b-2xl">
            <p className="mb-4 text-center text-[11px] text-slate-500">
              Dengan menekan tombol di bawah, Anda menyetujui seluruh kebijakan privasi dan ketentuan keamanan aplikasi PRIMA.
            </p>
            <button 
              onClick={() => router.back()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ABFC8] py-3.5 text-sm font-bold text-white transition active:scale-95"
            >
              {/* <CheckCircle2 size={18} /> */}
              Saya Setuju & Mengerti
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
