"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Home, MessageCircle, User } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

/**
 * Sidebar navigasi khusus desktop (>= md). Meniru sidebar di halaman Dashboard
 * agar seluruh halaman utama konsisten. Disembunyikan di mobile (`hidden md:flex`)
 * sehingga tampilan mobile TIDAK terpengaruh sama sekali.
 */
const NAV = [
  { label: "Beranda", icon: Home, href: "/dashboard" },
  { label: "Proyeksi", icon: BarChart3, href: "/proyeksi" },
  { label: "Komunitas", icon: MessageCircle, href: "/komunitas" },
  { label: "Profil", icon: User, href: "/profil" },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:z-20 md:flex md:w-64 md:flex-col md:border-r md:border-slate-100 md:bg-white md:shadow-xl">
      <div className="flex items-center justify-center border-b border-slate-50 px-8 py-8">
        <Image src="/logo.png" alt="PRIMA Logo" width={140} height={48} className="h-10 w-auto object-contain" priority />
      </div>
      <nav className="flex-1 space-y-2 px-4 py-8">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                active ? "bg-[#E3F1F2] text-[#2F6E7B]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} /> {label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <LogoutButton variant="full" />
      </div>
    </aside>
  );
}
