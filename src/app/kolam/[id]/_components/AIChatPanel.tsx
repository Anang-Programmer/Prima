"use client";

import { Sparkles, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { inputCls } from "../_lib/constants";

export function AIChatPanel(props: any) {
  const { messages, isAiTyping, chatEndRef, inputMsg, setInputMsg, sendToAI, busy, saveChanges, setShowAIChat } = props;
  
  // Periksa apakah kesepakatan sudah dicapai oleh AI
  const hasDeal = messages.some((m: any) => m.role === "assistant" && m.content.includes("DEAL_DATA"));

  return (
    <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="bg-[#4C9AA6] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAIChat(false)} className="text-white/80 hover:text-white transition">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-white" />
            <span className="text-xs font-semibold text-white">Konsultasi Prima AI</span>
          </div>
        </div>
        <button onClick={() => { setShowAIChat(false); }} className="text-white/70 hover:text-white text-xs font-medium hidden">
          Tutup
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-[#4C9AA6] text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"}`}>
              {msg.content.replace(/\[?DEAL_DATA:\s*\{[\s\S]*?\}\]?/g, "").trim()}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <form onSubmit={sendToAI} className="flex gap-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={isAiTyping}
            placeholder="Ketik alasan perubahan..."
            className={inputCls}
          />
          <button type="submit" disabled={isAiTyping || !inputMsg.trim()} className="shrink-0 rounded-[10px] bg-[#4C9AA6] px-4 text-white disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
        <button
          onClick={() => saveChanges(true)}
          disabled={busy || !hasDeal}
          className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[#4C9AA6] py-3 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 mt-2"
        >
          <CheckCircle2 size={14} /> {busy ? "Menyimpan..." : "Simpan Kesepakatan Ini"}
        </button>
      </div>
    </section>
  );
}
