"use client";
import { Loader2 } from "lucide-react";
import { Sheet, Label } from "./Sheet";
import { inputCls, fmt1 } from "../_lib/constants";

export default function EndCycleSheet({ sheet, setSheet, d, endForm, setEndForm, endCycle, busy }: any) {
  return (
      <Sheet open={sheet === "endCycle"} onClose={() => setSheet(null)} title="Akhiri Siklus">
        <div className="mb-4 rounded-xl bg-[#CFE8EB] px-4 py-3 text-xs text-[#1F6470]">
          Total pakan terpakai <b>{fmt1(d.totalFeed)} kg</b> · FCR berjalan <b>{d.fcr}</b> · SR terakhir <b>{d.sr}%</b>. Data panen akan dinilai otomatis untuk pelatihan AI.
        </div>
        <div className="space-y-4">
          <div>
            <Label>Hasil Panen (kg)</Label>
            <input type="number" min="0" step="0.1" className={inputCls} value={endForm.harvest ?? ""} onChange={(e) => setEndForm({ ...endForm, harvest: e.target.value })} />
          </div>
          <div>
            <Label>Rata Rata Berat Udang per Ekor</Label>
            <input type="number" min="0" className={inputCls} placeholder="Otomatis dari ABW" value={endForm.count ?? ""} onChange={(e) => setEndForm({ ...endForm, count: e.target.value })} />
          </div>
          <div>
            <Label>Catatan</Label>
            <textarea rows={2} className={inputCls} value={endForm.notes ?? ""} onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })} />
          </div>
          <button onClick={endCycle} disabled={busy || !Number(endForm.harvest)} className="w-full rounded-[10px] bg-[#F26B4E] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Akhiri Siklus"}
          </button>
        </div>
      </Sheet>
  );
}
