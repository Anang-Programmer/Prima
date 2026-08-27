"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { fmtFeed } from "@/app/kolam/[id]/_lib/constants";

export function ConfirmFeedModal({
  open,
  pondName,
  pondId,
  feedAmount,
  onClose,
  onConfirm,
  isExecuting
}: {
  open: boolean;
  pondName: string;
  pondId: string;
  feedAmount: number;
  onClose: () => void;
  onConfirm: () => void;
  isExecuting: boolean;
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => !isExecuting && onClose()} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-xl  overflow-hidden flex flex-col p-5 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        
        <div className="flex justify-center pt-1 pb-4 sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-slate-400 font-medium">Kasih Pakan</p>
            <h2 className="text-xl font-bold text-slate-800">{pondName}</h2>
          </div>
          <button
            onClick={() => router.push(`/kolam/${pondId}`)}
            className="flex items-center gap-1.5 rounded-full border border-[#1FB4B2] px-4 py-2 text-sm font-semibold text-[#1FB4B2] transition active:bg-[#F1F4F5]"
          >
            <Pencil size={16} /> Edit
          </button>
        </div>

        {/* Big Gray Box */}
        <div className="rounded-xl bg-[#EBEFEF] py-8 text-center mb-3">
          <span className="text-2xl font-bold text-slate-600">{fmtFeed(feedAmount)}</span>
        </div>

        <p className="text-xs text-slate-500 font-medium mb-8 px-1">
          Pakan sudah sesuai dengan rekomendasi PRIMA
        </p>

        {/* Action Button */}
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className="w-full rounded-xl bg-[#1FB4B2] py-4 text-base font-bold text-white  #1FB4B2]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isExecuting ? "Memproses..." : "Sudah Kasih Pakan"}
        </button>
      </div>
    </div>
  );
}
