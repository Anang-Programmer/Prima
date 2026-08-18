'use client'

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, Loader2, Sparkles, ChevronDown, ChevronRight, RefreshCw } from "lucide-react"

type AIMessage = {
  role: 'user' | 'ai'
  content: string
  reasoning?: string[]
  suggestions?: string[]
  confidence?: number
}

interface ChatbotProps {
  doc: number;
  populasi: number;
  luas: number;
  calcResult: any;
  ancoStatus: string | null;
  probiotik: any;
}

export function Chatbot({ doc, populasi, luas, calcResult, ancoStatus, probiotik }: ChatbotProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'ai',
      content: 'Halo! Saya Prima AI. Kolam Anda sudah saya analisis — ada 3 hal yang perlu perhatian hari ini. Lihat panel Proactive Insights di kanan atas, atau tanya saya apa saja tentang pakan, anco, atau probiotik.',
      reasoning: [
        'Mengambil data kolam: DOC 47, 100.000 ekor, 1000 m²',
        'Menghitung biomassa & feeding rate (SNI 8008:2014)',
        'Mendeteksi 3 insight kritis untuk disampaikan'
      ],
      confidence: 0.94
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingPhase, setTypingPhase] = useState("")
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ===== Quick Actions =====
  const quickActions = [
    { label: "Analisis FCR", msg: "Bagaimana cara menghitung FCR dan apa yang mempengaruhi angkanya?" },
    { label: "Strategi anco", msg: "Jelaskan cara baca hasil anco dengan benar dan kapan harus curiga?" },
    { label: "Optimasi pakan", msg: `Kolam saya DOC ${doc}, feeding rate saat ini berapa persen dan bagaimana cara optimasi?` },
    { label: "Probiotik", msg: "Jelaskan perbedaan Bacillus dan Lactobacillus, kapan pakai masing-masing?" },
  ]

  // ===== Typing animation phases =====
  const typingPhases = useMemo(() => [
    `Menganalisis parameter kolam (DOC ${doc})...`,
    `Menghitung biomassa & feeding rate SNI...`,
    `Menyusun rekomendasi...`
  ], [doc])

  // ===== Send chat =====
  async function handleSendChat(preset?: string) {
    const text = (preset || chatInput).trim() 
    if (!text || isTyping) return

    const userMsg: AIMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setChatInput("")
    setIsTyping(true)

    // Animate typing phases
    let phaseIdx = 0
    setTypingPhase(typingPhases[0])
    const phaseInterval = setInterval(() => {
      phaseIdx++
      if (phaseIdx < typingPhases.length) setTypingPhase(typingPhases[phaseIdx])
    }, 600)

    try {
      const res = await fetch('/api/ai-pakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            doc,
            shrimpCount: populasi,
            pondArea: luas,
            abw: calcResult?.abw,
            biomass: calcResult?.biomassKg,
            feedingRate: calcResult?.feedingRatePct,
            ancoResult: ancoStatus || "Belum dicek",
            probiotic: probiotik
          }
        })
      })

      clearInterval(phaseInterval)
      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: data.reply,
          reasoning: data.reasoning,
          suggestions: data.suggestions,
          confidence: data.confidence
        }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Maaf, sistem AI sedang gangguan: ${data.error}` }])
      }
    } catch (err) {
      clearInterval(phaseInterval)
      setMessages(prev => [...prev, { role: 'ai', content: 'Maaf, gagal terhubung ke server AI. Periksa koneksi internet Anda.' }])
    } finally {
      setIsTyping(false)
      setTypingPhase("")
    }
  }

  return (
    <section className="bg-white border border-[#002530]/10 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#002530] p-4 flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#56C1CD] to-[#0A4D58] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] border-2 border-[#002530] rounded-full" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-[#F6F1E6] text-sm">Prima AI</h3>
          <p className="font-data text-[9px] tracking-wider text-[#56C1CD]">LIVE · LLAMA 70B · CONTEXT-AWARE</p>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="text-white/40 hover:text-white transition-colors" aria-label="Reset chat" title="Reset percakapan">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat messages */}
      <div className="h-[420px] overflow-y-auto p-4 space-y-4 bg-[#FBF8F1]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${m.role === 'user' ? '' : 'w-full'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                ${m.role === 'user'
                  ? 'bg-[#0A4D58] text-white rounded-tr-sm'
                  : 'bg-white border border-[#002530]/10 text-[#002530] rounded-tl-sm'}`}>
                {m.content}
              </div>

              {/* Reasoning steps (only for AI, expandable) */}
              {m.role === 'ai' && m.reasoning && m.reasoning.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedReasoning(expandedReasoning === i ? null : i)}
                    className="flex items-center gap-1.5 text-[10px] font-data tracking-wider text-[#0A4D58] hover:text-[#002530] uppercase">
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedReasoning === i ? "" : "-rotate-90"}`} />
                    Lihat proses berpikir AI
                    {m.confidence && (
                      <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#56C1CD]/15 text-[#0A4D58] normal-case tracking-normal">
                        confidence {Math.round(m.confidence * 100)}%
                      </span>
                    )}
                  </button>
                  {expandedReasoning === i && (
                    <div className="mt-2 pl-3 border-l-2 border-[#56C1CD]/40 space-y-1.5">
                      {m.reasoning.map((step, si) => (
                        <p key={si} className="text-[11px] text-[#002530]/60 flex items-start gap-2">
                          <span className="font-data text-[9px] bg-[#0A4D58]/10 text-[#0A4D58] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                          {step}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up suggestions */}
              {m.role === 'ai' && m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.suggestions.map((s, si) => (
                    <button key={si} onClick={() => handleSendChat(s)} disabled={isTyping}
                      className="text-[10px] font-data tracking-wide bg-white border border-[#0A4D58]/20 text-[#0A4D58] px-2.5 py-1 rounded-full hover:bg-[#0A4D58] hover:text-white transition-colors disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#002530]/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
              <div className="flex items-center gap-2 text-[11px] text-[#0A4D58]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="font-data tracking-wide">{typingPhase}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pt-3 pb-2 bg-[#FBF8F1] border-t border-[#002530]/5">
        <p className="font-data text-[9px] tracking-[0.2em] uppercase text-[#002530]/40 mb-2">Pertanyaan Populer</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => handleSendChat(a.msg)} disabled={isTyping}
              className="flex items-center gap-1.5 shrink-0 text-[11px] bg-white border border-[#002530]/10 text-[#002530]/70 px-3 py-1.5 rounded-full hover:border-[#0A4D58] hover:text-[#0A4D58] transition-colors disabled:opacity-50">
              <ChevronRight className="w-3 h-3" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="p-3 bg-white border-t border-[#002530]/10">
        <div className="flex items-end gap-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
            }}
            placeholder="Tanya apa saja tentang kolam Anda..."
            className="flex-1 bg-[#F8F5ED] border border-[#002530]/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0A4D58] focus:ring-1 focus:ring-[#0A4D58] resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <button type="submit" disabled={!chatInput.trim() || isTyping}
            className="w-11 h-11 rounded-xl bg-[#0A4D58] hover:bg-[#002530] text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#002530]/30 text-center mt-2 font-data tracking-wide">AI bisa membuat kesalahan. Gunakan sebagai referensi pendamping.</p>
      </form>
    </section>
  )
}
