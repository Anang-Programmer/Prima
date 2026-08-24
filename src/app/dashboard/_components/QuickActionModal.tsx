"use client";

import Image from "next/image";
import { X } from "lucide-react";

export type QuickActionType = "Probiotik" | "Cek Anco" | "Pakan";

export function QuickActionModal({
  open,
  onClose,
  onSelectAction,
}: {
  open: boolean;
  onClose: () => void;
  onSelectAction: (action: QuickActionType) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="px-5 pt-2 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800">Pilih Aksi</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { type: "Probiotik" as QuickActionType, label: "Beri Probiotik", img: "/images/items/Probiotik Icon.webp" },
              { type: "Cek Anco" as QuickActionType, label: "Cek anco", img: "/images/items/Cek Anco icon.webp" },
              { type: "Pakan" as QuickActionType, label: "Beri Pakan", img: "/images/items/Pakan udang icon.webp" },
            ].map((action) => (
              <button
                key={action.type}
                onClick={() => onSelectAction(action.type)}
                className="flex flex-col items-center justify-center p-3 gap-3 border-2 border-slate-100 rounded-xl hover:border-[#2ABFC8] hover:bg-[#2ABFC8]/5 transition-all group active:scale-95"
              >
                <div className="relative w-16 h-16 transition-transform group-hover:scale-110">
                  <Image src={action.img} alt={action.label} fill sizes="(max-width: 768px) 64px, 64px" className="object-contain" />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight group-hover:text-[#2ABFC8]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
