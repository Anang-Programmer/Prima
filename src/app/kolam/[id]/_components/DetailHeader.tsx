"use client";

import { ArrowLeft, MoreVertical, Pencil, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function DetailHeader({ d, router, setPondForm, setSheet, onEndCycle, onDeletePond }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="bg-[#74B6BE] px-4 pb-5 pt-5 md:rounded-b-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => router.push("/dashboard")} className="rounded-full p-1.5 text-white hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-white">{d.pond.name}</h1>
            <p className="truncate text-[11px] text-white/80">
              {Number(d.pond.area_m2).toLocaleString("id-ID")} m² | {d.pond.location || "-"}
            </p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <MoreVertical size={18} />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPondForm({ name: d.pond.name, area: d.pond.area_m2, depth: d.pond.depth_m, location: d.pond.location });
                  setSheet("editPond");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Pencil size={15} /> Edit
              </button>
              {d.cycle && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onEndCycle) onEndCycle();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#F26B4E] hover:bg-red-50 transition"
                >
                  <CheckCircle2 size={15} /> Akhiri Siklus
                </button>
              )}
              <div className="my-1 h-px w-full bg-slate-100" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onDeletePond) onDeletePond();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                Hapus Kolam
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
