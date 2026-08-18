"use client";
import { Send } from "lucide-react";
import { Sheet } from "./Sheet";
import { inputCls } from "../_lib/constants";

export default function ConsultAISheet({ sheet, setSheet, chat, chatInput, setChatInput, sendChat }: any) {
  return (
      <Sheet open={sheet === "ai"} onClose={() => setSheet(null)} title="Konsultasi AI">
        <div className="space-y-2">
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {chat.map((m: any, i: number) => (
              <div key={i} className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${m.me ? "ml-8 bg-[#4C9AA6] text-white" : "mr-8 bg-[#EAF4F5] text-slate-700"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dosis pakan?", "FCR tinggi?", "Kualitas air?"].map((s) => (
              <button key={s} onClick={() => sendChat(s)} className="rounded-full bg-[#EAF4F5] px-3 py-1.5 text-[10px] font-semibold text-[#1F6470]">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Tulis pertanyaan..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
            <button onClick={() => sendChat()} className="shrink-0 rounded-[10px] bg-[#4C9AA6] px-4 text-white">
              <Send size={16} />
            </button>
          </div>
        </div>
      </Sheet>
  );
}
