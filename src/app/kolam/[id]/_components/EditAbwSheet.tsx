import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sheet } from "./Sheet";

export default function EditAbwSheet({ sheet, setSheet, abwInput, setAbwInput, handleEditAbw, busy }: any) {
  if (sheet !== "edit-abw") return null;
  return (
    <Sheet open={true} title="Edit ABW (Data Sampling)" onClose={() => setSheet(null)}>
      <form onSubmit={handleEditAbw} className="mt-4 flex flex-col gap-4">
        <div>
          <Label>ABW Terkini (gram/ekor)</Label>
          <Input 
            type="number" 
            step="0.01"
            required 
            value={abwInput} 
            onChange={(e) => setAbwInput(e.target.value)} 
            placeholder="Cth: 15.5"
            className="mt-1" 
          />
          <p className="mt-1 text-[10px] text-slate-500">Nilai ini akan menimpa angka ABW (Average Body Weight) saat ini.</p>
        </div>
        <button
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-[#3E97A5] py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Menyimpan..." : "Simpan ABW"}
        </button>
      </form>
    </Sheet>
  );
}
