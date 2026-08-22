"use client";

import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { QuickActionType } from "./QuickActionModal";

interface PondOption {
  pond_id: string;
  pond_name: string;
  cycle_id?: string | null;
  doc: number;
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

  const handleExecute = (cycleIds: string[]) => {
    if (cycleIds.length === 0) return;
    onExecute(cycleIds);
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
            <h2 className="text-lg font-bold text-slate-800">Pilih Aksi</h2>
            <button 
              onClick={onClose} 
              disabled={isExecuting}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {activePonds.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">Tidak ada kolam aktif.</p>
          ) : (
            <div className="flex flex-col">
              {/* Semua Kolam */}
              <button
                type="button"
                onClick={() => handleExecute(activePonds.map(p => p.cycle_id!))}
                disabled={isExecuting}
                className="flex items-center justify-between p-4 bg-white border-b border-slate-200 border-dashed hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-slate-400">Semua Kolam</span>
                <span className="text-slate-300 text-lg font-light">{'>'}</span>
              </button>

              {activePonds.map(pond => {
                // Find timer for this specific action
                const timerType = action === "Pakan" ? "Pakan" : action === "Cek Anco" ? "Cek Anco" : "Probiotik";
                const pondTimer = timers.find(t => t.pond_id === pond.pond_id && t.type === timerType);
                
                let msRemaining = 0;
                let isWaiting = false;
                let noSession = false;
                const belumMulai = pond.doc <= 0;
                
                if (pondTimer) {
                  const due = new Date(pondTimer.due_time).getTime();
                  msRemaining = due - now;
                  if (msRemaining > 0) isWaiting = true;
                } else {
                  if (action === "Cek Anco") {
                    noSession = true;
                  }
                }

                const disabled = isWaiting || noSession || belumMulai || isExecuting;

                return (
                  <button 
                    key={pond.pond_id}
                    onClick={() => {
                      if (!disabled) handleExecute([pond.cycle_id!]);
                    }}
                    disabled={disabled}
                    className={`flex items-center justify-between p-4 border-b border-slate-300 transition-colors text-left w-full
                      ${disabled ? 'bg-[#C1C4C7]' : 'bg-white hover:bg-slate-50'}
                    `}
                  >
                    <span className={`text-sm font-semibold ${disabled ? 'text-slate-400' : 'text-slate-600'}`}>
                      {pond.pond_name}
                    </span>
                    
                    {belumMulai ? (
                      <span className="inline-flex text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Belum Mulai
                      </span>
                    ) : !noSession ? (
                      <div className={`flex overflow-hidden rounded-full ${disabled ? 'opacity-50 grayscale' : ''}`}>
                        <div className="bg-[#F9D9CE] py-1.5 text-[10px] font-semibold text-slate-700 w-[75px] text-center">
                          {action === "Pakan" ? "Beri Pakan" : action}
                        </div>
                        <div className="bg-[#F26B4E] py-1.5 text-[10px] font-bold text-white tabular-nums w-[65px] text-center">
                          {formatCountdown(msRemaining)}
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
