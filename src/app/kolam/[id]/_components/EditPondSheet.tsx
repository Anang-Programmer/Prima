"use client";
import { Loader2 } from "lucide-react";
import { Sheet, Label } from "./Sheet";
import { inputCls } from "../_lib/constants";

export default function EditPondSheet({ sheet, setSheet, pondForm, setPondForm, savePond, busy }: any) {
  return (
      <Sheet open={sheet === "editPond"} onClose={() => setSheet(null)} title="Edit Kolam">
        <div className="space-y-4">
          <div>
            <Label>Nama Kolam</Label>
            <input className={inputCls} value={pondForm.name ?? ""} onChange={(e) => setPondForm({ ...pondForm, name: e.target.value })} />
          </div>
          <div>
            <Label>Luas (m²)</Label>
            <input type="number" min="0" className={inputCls} value={pondForm.area ?? ""} onChange={(e) => setPondForm({ ...pondForm, area: e.target.value })} />
          </div>
          <div>
            <Label>Kedalaman (m)</Label>
            <input type="number" min="0" step="0.1" className={inputCls} value={pondForm.depth ?? ""} onChange={(e) => setPondForm({ ...pondForm, depth: e.target.value })} />
          </div>
          <div>
            <Label>Lokasi</Label>
            <input className={inputCls} value={pondForm.location ?? ""} onChange={(e) => setPondForm({ ...pondForm, location: e.target.value })} />
          </div>
          <button onClick={savePond} disabled={busy} className="w-full rounded-[10px] bg-[#4C9AA6] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Simpan"}
          </button>
        </div>
      </Sheet>
  );
}
