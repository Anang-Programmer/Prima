"use client";

import { useState, useEffect } from "react";

export function ConfirmAncoModal({
  open,
  pondName,
  onClose,
  onConfirm,
  isExecuting
}: {
  open: boolean;
  pondName: string;
  onClose: () => void;
  onConfirm: (result: string) => void;
  isExecuting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  if (!open) return null;

  const options = [
    { label: "Habis", sub: "< 5%", value: "Habis" },
    { label: "Sisa Sedikit", sub: "5 - 25%", value: "Sisa Sedikit" },
    { label: "Sisa Banyak", sub: "> 25%", value: "Sisa Banyak" }
  ];

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
        <div className="mb-6">
          <p className="text-sm text-slate-400 font-medium">Cek Anco</p>
          <h2 className="text-xl font-bold text-slate-800">{pondName}</h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4 mb-8 px-1">
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95
                  ${isSelected ? 'border-[#1FB4B2] bg-[#1FB4B2]/5' : 'border-slate-300 hover:border-[#1FB4B2]/50 bg-white'}
                `}
              >
                <span className={`text-base font-bold ${isSelected ? 'text-[#1FB4B2]' : 'text-slate-500'}`}>
                  {opt.label}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || isExecuting}
          className="w-full rounded-xl bg-[#1FB4B2] py-4 text-base font-bold text-white  #1FB4B2]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isExecuting ? "Memproses..." : "Konfirmasi Cek Anco"}
        </button>
      </div>
    </div>
  );
}
