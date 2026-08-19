"use client";

import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { QuickActionType } from "./QuickActionModal";

interface PondOption {
  pond_id: string;
  pond_name: string;
  cycle_id?: string | null;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000).toString().padStart(2, "0");
  const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function SelectPondModal({
  open,
  action,
  ponds,
  timers,
  now,
  onClose,
  onExecute,
  isExecuting
}: {
  open: boolean;
  action: QuickActionType | null;
  ponds: PondOption[];
  timers: any[];
  now: number;
  onClose: () => void;
  onExecute: (cycleIds: string[]) => void;
  isExecuting: boolean;
}) {
  const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());

  // Reset selection when opened
  useEffect(() => {
    if (open) setSelectedCycles(new Set());
  }, [open, action]);

  if (!open || !action) return null;

  const handleToggle = (cycleId: string, disabled: boolean) => {
    if (disabled) return;
    const newSet = new Set(selectedCycles);
    if (newSet.has(cycleId)) {
      newSet.delete(cycleId);
    } else {
      newSet.add(cycleId);
    }
    setSelectedCycles(newSet);
  };

  const handleExecute = () => {
    if (selectedCycles.size === 0) return;
    onExecute(Array.from(selectedCycles));
  };

  // Only show active cycles
  const activePonds = ponds.filter(p => p.cycle_id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => !isExecuting && onClose()} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="px-5 pt-2 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pilih Kolam</h2>
              <p className="text-xs text-slate-500">Aksi: <span className="font-semibold text-[#4C9AA6]">{action}</span></p>
            </div>
            <button 
              onClick={onClose} 
              disabled={isExecuting}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-3">
          {activePonds.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">Tidak ada kolam aktif.</p>
          ) : (
            activePonds.map(pond => {
              // Find timer for this specific action
              const timerType = action === "Pakan" ? "Pakan" : action === "Cek Anco" ? "Cek Anco" : "Probiotik";
              const pondTimer = timers.find(t => t.pond_id === pond.pond_id && t.type === timerType);
              
              let msRemaining = 0;
              let isWaiting = false;
              let noSession = false;
              
              if (pondTimer) {
                const due = new Date(pondTimer.due_time).getTime();
                msRemaining = due - now;
                if (msRemaining > 0) isWaiting = true;
              } else {
                if (action === "Cek Anco") {
                  noSession = true; // Tidak bisa cek anco jika tidak ada sesi pakan
                }
              }

              const isSelected = selectedCycles.has(pond.cycle_id!);
              const disabled = isWaiting || noSession || isExecuting;

              return (
                <div 
                  key={pond.pond_id}
                  onClick={() => handleToggle(pond.cycle_id!, disabled)}
                  className={`relative flex items-center justify-between p-3.5 border-2 rounded-xl transition-all cursor-pointer select-none
                    ${disabled ? 'border-slate-100 bg-slate-50 opacity-70 cursor-not-allowed' : 
                      isSelected ? 'border-[#4C9AA6] bg-[#4C9AA6]/5' : 'border-slate-200 hover:border-[#4C9AA6]/50'
                    }
                  `}
                >
                  <div>
                    <h3 className={`text-sm font-bold ${disabled ? 'text-slate-500' : 'text-slate-800'}`}>
                      {pond.pond_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {isWaiting ? (
                         <span className="inline-flex text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                           Menunggu {formatCountdown(msRemaining)}
                         </span>
                      ) : noSession ? (
                         <span className="inline-flex text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                           Belum Ada Sesi
                         </span>
                      ) : (
                         <span className="inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                           Siap Diberikan
                         </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                    ${disabled ? 'border-slate-200 bg-slate-100' : 
                      isSelected ? 'border-[#4C9AA6] bg-[#4C9AA6] text-white' : 'border-slate-300 bg-white'
                    }
                  `}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0 bg-white">
          <button
            onClick={handleExecute}
            disabled={selectedCycles.size === 0 || isExecuting}
            className="w-full rounded-xl bg-[#4C9AA6] py-3.5 text-sm font-bold text-white shadow-md shadow-[#4C9AA6]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              `Terapkan ke ${selectedCycles.size} Kolam`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
