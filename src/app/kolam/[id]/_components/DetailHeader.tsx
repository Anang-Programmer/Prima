"use client";

import { ArrowLeft, Pencil } from "lucide-react";

export function DetailHeader({ d, router, setPondForm, setSheet }: any) {
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
            <button
              onClick={() => {
                setPondForm({ name: d.pond.name, area: d.pond.area_m2, depth: d.pond.depth_m, location: d.pond.location });
                setSheet("editPond");
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#4C9AA6] px-4 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
        </header>
  );
}
