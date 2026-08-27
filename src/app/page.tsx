"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ============================================================
   ONBOARDING / LANDING — halaman utama sebelum login & daftar
   Mobile 100% sama dengan desain UI/UX, desktop menyesuaikan.
============================================================ */

// TODO: ganti src dengan asset ilustrasi kamu sendiri (taruh di /public/images)
const SLIDES = [
  {
    // img: "/images/onboarding-1.png",
    // alt: "Tebar benur",
    text: "Mulai budidaya tanpa tebak-tebakan. Catat tebar benur dan pakan, Prima yang hitung.",
  },
  {
    img: "/images/onboarding-2.png",
    alt: "Pantau pakan dan air",
    text: "Pantau pakan, air, dan pertumbuhan udang tanpa ribet cukup catat, Prima yang angkat.",
  },
  {
    img: "/images/onboarding-3.png",
    alt: "Panen maksimal",
    text: "Hemat pakan, air tetap sehat, udang cepat besar, dan panen maksimal bersama Prima.",
  },
];

// TODO: ganti ke /daftar dan /masuk setelah halaman auth jadi
const LINK_DAFTAR = "/daftar";
const LINK_MASUK = "/masuk";

/* Logo — menggunakan aset asli dari folder public */
function Logo() {
  return (
    <div className="flex select-none items-center justify-center md:mb-4">
      <Image src="/logo.png" alt="PRIMA Logo" width={180} height={60} className="h-12 w-auto object-contain md:h-16" priority />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  /* update dot aktif saat di-swipe */
  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const d = Math.abs(center - (c.offsetLeft + c.offsetWidth / 2));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setIndex(best);
  }

  /* klik dot -> slide ke kartu tersebut */
  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({
      left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F4F6F7]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-6xl md:justify-center md:py-16">
        {/* ================= LOGO ================= */}
        <header className="pt-9 md:pt-0">
          <Logo />
        </header>

        {/* ================= CAROUSEL KARTU ================= */}
        <section className="flex flex-1 flex-col justify-center py-8 md:py-12 md:flex-none">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory overflow-x-auto px-6 gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-8 md:px-8 md:overflow-visible"
          >
            {SLIDES.map((s, i) => (
              <article
                key={i}
                className="flex flex-col w-full shrink-0 snap-center rounded-xl bg-white px-6 pb-8 pt-8  md:snap-none md:hover:-translate-y-2 md:transition-transform md:duration-300 md:px-8 md:pb-10 md:pt-10 md:items-center md:justify-center md:text-center"
              >
                {s.img && (
                  <div className="flex h-56 items-center justify-center md:h-64 w-full mb-6">
                    {/* ganti src di array SLIDES dengan asset kamu */}
                    <img src={s.img} alt={s.alt || "Onboarding"} className="h-full w-full object-contain" />
                  </div>
                )}
                <p className="mt-auto text-[14px] font-medium leading-relaxed text-slate-700 md:text-sm text-center md:text-left">
                  {s.text}
                </p>
              </article>
            ))}
          </div>

          {/* dot indicator */}
          <div className="mt-6 flex items-center justify-center gap-1.5 md:hidden">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-[#20606D]" : "w-1.5 bg-[#C7D5D8]"
                  }`}
              />
            ))}
          </div>
        </section>

        {/* ================= TOMBOL CTA ================= */}
        <footer className="space-y-3 px-7 pb-9 md:flex md:flex-row md:justify-center md:gap-6 md:space-y-0 md:px-0 md:mt-4 md:pb-0">
          <Link
            href={LINK_DAFTAR}
            className="block w-full rounded-xl bg-[#2ABFC8] py-3.5 text-center text-sm font-semibold text-white  transition active:scale-[0.98] md:w-56 md:py-4 md:text-base md:hover:bg-[#3A7C86]"
          >
            Daftar
          </Link>
          <Link
            href={LINK_MASUK}
            className="block w-full rounded-xl border-[1.5px] border-[#2ABFC8] py-3 text-center text-sm font-semibold text-[#2ABFC8] transition active:scale-[0.98] md:w-56 md:py-4 md:text-base md:hover:bg-[#F1F4F5]"
          >
            Masuk
          </Link>
        </footer>
      </div>
    </main>
  );
}
