"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  variant?: "icon" | "text" | "full";
}

export function LogoutButton({ className = "", variant = "full" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Arahkan kembali ke halaman awal/login setelah sukses keluar
      router.push("/masuk"); 
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Varian 1: Hanya Ikon (Cocok untuk navbar/header sempit)
  if (variant === "icon") {
    return (
      <button 
        onClick={handleLogout} 
        disabled={loading}
        title="Keluar"
        className={`p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition disabled:opacity-50 flex items-center justify-center ${className}`}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      </button>
    );
  }

  // Varian 2: Teks biasa + Ikon (Cocok untuk menu dropdown)
  if (variant === "text") {
    return (
      <button 
        onClick={handleLogout} 
        disabled={loading}
        className={`text-sm font-medium text-red-500 hover:text-red-600 transition disabled:opacity-50 flex items-center gap-2 ${className}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        Keluar
      </button>
    );
  }

  // Varian 3: Tombol Penuh/Full (Cocok untuk ditaruh di paling bawah Sidebar/Menu Profil)
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      Keluar Akun
    </button>
  );
}
