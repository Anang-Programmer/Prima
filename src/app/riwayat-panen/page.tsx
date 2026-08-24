"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DesktopSidebar } from "@/components/DesktopSidebar";

const fmtDateShort = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

export default function RiwayatPanenPage() {
  const router = useRouter();
  const [harvests, setHarvests] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/masuk");
          return;
        }

        // We fetch directly from cycles and ponds to get location as well,
        // or just use v_harvest_history.
        const { data } = await supabase
          .from("v_harvest_history")
          .select("*")
          .eq("user_id", user.id)
          .order("end_date", { ascending: false });

        // Since location is not in v_harvest_history, we can fetch it separately 
        // or just rely on what we have. Let's fetch ponds to map the location.
        const { data: ponds } = await supabase
          .from("ponds")
          .select("id, location")
          .eq("user_id", user.id);
        
        const pondLocMap: Record<string, string> = {};
        if (ponds) {
          ponds.forEach((p) => {
            pondLocMap[p.id] = p.location || "Lokasi belum diisi";
          });
        }

        setHarvests(data ?? []);
      } catch (err) {
        console.error(err);
        setHarvests([]);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F2F5F7] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />

      <div className="w-full md:flex-1 md:overflow-y-auto bg-[#F2F5F7]">
        <div className="mx-auto flex h-screen w-full flex-col md:h-auto md:max-w-3xl md:py-8">
          
          {/* HEADER */}
          <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 pb-4 pt-5 md:rounded-t-2xl md:border-none md:px-8">
            <button
              onClick={() => router.back()}
              className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={21} />
            </button>
            <h1 className="text-[18px] font-semibold text-slate-800 md:text-2xl md:font-extrabold">
              Riwayat Panen
            </h1>
          </header>

          <main className="flex-1 overflow-y-auto bg-[#F2F5F7] p-4 md:rounded-b-2xl md:bg-white md:px-8 md:pb-8">
            {!harvests ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#2ABFC8]" size={32} />
              </div>
            ) : harvests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <ArrowLeft size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Panen</p>
                <p className="mt-1 text-xs text-slate-500">
                  Data panen Anda akan muncul di sini setelah siklus selesai.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {harvests.map((h, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    {/* Top Info */}
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-base font-semibold text-slate-800">{h.pond_name}</h3>
                      <span className="text-xs text-slate-500">Mulai {fmtDateShort(h.start_date)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-slate-500">
                        {Number(h.area_m2).toFixed(2)}m²
                      </p>
                      <span className="text-xs text-slate-500">Panen {fmtDateShort(h.end_date)}</span>
                    </div>

                    {/* Pills Row 1 */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 rounded-lg border border-slate-200 py-2 text-center">
                        <p className="text-[11px] text-slate-500">
                          SR <span className="font-bold text-slate-800 text-[13px] ml-1">{Number(h.harvest_sr_pct).toFixed(0)}%</span>
                        </p>
                      </div>
                      <div className="flex-1 rounded-lg border border-slate-200 py-2 text-center">
                        <p className="text-[11px] text-slate-500">
                          FCR <span className="font-bold text-slate-800 text-[13px] ml-1">{Number(h.harvest_fcr).toFixed(2)}</span>
                        </p>
                      </div>
                      <div className="flex-1 rounded-lg border border-slate-200 py-2 text-center">
                        <p className="text-[11px] text-slate-500">
                          ABW <span className="font-bold text-slate-800 text-[13px] ml-1">{Number(h.harvest_abw_gram).toFixed(1)}g</span>
                        </p>
                      </div>
                    </div>

                    {/* Pills Row 2 */}
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg border border-slate-200 py-2 text-center">
                        <p className="text-[11px] text-slate-500">
                          Total Pangan <span className="font-bold text-[#2C626E] text-[13px] ml-1">{Number(h.total_feed_kg).toLocaleString("id-ID")}kg</span>
                        </p>
                      </div>
                      <div className="flex-1 rounded-lg border border-slate-200 py-2 text-center">
                        <p className="text-[11px] text-slate-500">
                          Total Panen <span className="font-bold text-[#2C626E] text-[13px] ml-1">{Number(h.harvest_biomass_kg).toLocaleString("id-ID")}kg</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
