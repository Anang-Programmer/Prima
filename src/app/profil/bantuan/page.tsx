"use client";

import { ChevronLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function FacebookIcon({ className, size }: { className?: string, size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function InstagramIcon({ className, size }: { className?: string, size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function LinkedinIcon({ className, size }: { className?: string, size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  );
}

import { useState } from "react";

export default function BantuanPage() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);

  const handleSocialClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  return (
    <div className="min-h-screen bg-[#F1F4F5] flex flex-col md:justify-center md:items-center">
      <div className="w-full max-w-md bg-[#F1F4F5] min-h-screen md:min-h-0 md:rounded-xl md: md:overflow-hidden flex flex-col relative">
        {/* Header */}
        <header className="flex items-center px-4 py-4 sticky top-0 z-10 bg-transparent">
          <button onClick={() => router.back()} className="mr-3 p-1 text-slate-600 hover:bg-slate-200 rounded-full transition">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-base font-medium text-slate-800">Pusat Bantuan</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="mb-12">
            <Image 
              src="/logo1.png" 
              alt="Prima Linc Logo" 
              width={200} 
              height={80} 
              className="w-auto h-24 object-contain"
              priority
            />
          </div>

          <div className="w-full space-y-3">
            <button 
              onClick={handleSocialClick}
              className="flex items-center gap-3 w-full bg-white rounded-xl px-5 py-4  active:scale-[0.98] transition-transform"
            >
              <FacebookIcon className="text-[#1877F2]" size={24} />
              <span className="text-sm font-medium text-slate-700">Prima Linc Indonesia</span>
            </button>

            <button 
              onClick={handleSocialClick}
              className="flex items-center gap-3 w-full bg-white rounded-xl px-5 py-4  active:scale-[0.98] transition-transform"
            >
              <InstagramIcon className="text-[#E4405F]" size={24} />
              <span className="text-sm font-medium text-slate-700">@prima.linc</span>
            </button>

            <button 
              onClick={handleSocialClick}
              className="flex items-center gap-3 w-full bg-white rounded-xl px-5 py-4  active:scale-[0.98] transition-transform"
            >
              <LinkedinIcon className="text-[#0A66C2]" size={24} />
              <span className="text-sm font-medium text-slate-700">Prima Linc Indonesia</span>
            </button>
          </div>
        </main>
      </div>

      {/* COMING SOON POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPopup(false)} />
          <div className="relative z-10 w-full max-w-[280px] rounded-xl bg-white p-6 text-center ">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E5F5F7]">
              <Clock size={24} className="text-[#2ABFC8]" />
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-800">Coming Soon!</h3>
            <p className="mb-6 text-xs text-slate-500">
              Sosial media Prima Linc sedang dalam tahap persiapan. Nantikan kehadiran kami ya!
            </p>
            <button 
              onClick={() => setShowPopup(false)}
              className="w-full rounded-xl bg-[#2ABFC8] py-3 text-sm font-bold text-white transition active:scale-95"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
