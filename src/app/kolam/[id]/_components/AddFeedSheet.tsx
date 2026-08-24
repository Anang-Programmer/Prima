"use client";
import { Loader2 } from "lucide-react";
import { Sheet, Label } from "./Sheet";
import { inputCls } from "../_lib/constants";

export default function AddFeedSheet({ sheet, setSheet, logForm, setLogForm, addFeedLog, busy }: any) {
  return (
      <Sheet open={sheet === "addFeed"} onClose={() => setSheet(null)} title="Tambah Pakan">
        <div className="space-y-4">
          <div>
            <Label>Jumlah Pakan (kg)</Label>
            <input type="number" min="0" step="0.1" className={inputCls} value={logForm.amount ?? ""} onChange={(e) => setLogForm({ ...logForm, amount: e.target.value })} />
          </div>
          <div>
            <Label>Jenis Pakan</Label>
            <input className={inputCls} value={logForm.type ?? ""} onChange={(e) => setLogForm({ ...logForm, type: e.target.value })} />
          </div>
          <div>
            <Label>Hasil Anco</Label>
            <div className="grid grid-cols-2 gap-3">
              {["Belum Dicek", "Habis", "Sisa Sedikit", "Sisa Banyak"].map((a) => (
                <button
                  key={a}
                  onClick={() => setLogForm({ ...logForm, anco: a })}
                  className={`rounded-[10px] border-[1.5px] border-[#2ABFC8] py-2.5 text-xs font-semibold ${logForm.anco === a ? "bg-[#2ABFC8] text-white" : "bg-white text-[#2ABFC8]"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addFeedLog} disabled={busy} className="w-full rounded-[10px] bg-[#2ABFC8] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Simpan"}
          </button>
        </div>
      </Sheet>
  );
}
