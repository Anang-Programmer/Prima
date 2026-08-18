import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {


    const { type, messages, pondContext, sniValues, userValues } = await req.json();
    const isProb = type === 'probiotik';

    const systemPrompt = `Kamu adalah konsultan budidaya udang vaname bernama "Prima AI". Kamu sedang berdiskusi singkat dengan petambak yang ingin mengubah rekomendasi ${isProb ? 'probiotik' : 'pakan'} dari standar SNI.

KONTEKS KOLAM PETAMBAK:
- DOC (umur pemeliharaan): ${pondContext.doc ?? '-'} hari
- Populasi: ${pondContext.population?.toLocaleString() ?? '-'} ekor
- Luas kolam: ${pondContext.area ?? '-'} m²
- ABW (berat rata-rata): ${pondContext.abw ?? '-'} gram
- Biomassa estimasi: ${pondContext.biomass ?? '-'} kg

REKOMENDASI STANDAR:
${isProb ?
        `- Dosis: ${sniValues.dosis}
- Frekuensi: ${sniValues.frekuensi}
- Metode: ${sniValues.metode}` :
        `- Pakan harian: ${sniValues.dailyFeedKg} kg
- Frekuensi: ${sniValues.mealsPerDay}× per hari
- Feeding rate: ${sniValues.feedingRate}%
- Cek anco: ${sniValues.ancoHours}`}

YANG PETAMBAK INGIN UBAH:
${isProb ?
        `- Dosis → ${userValues.dosis} ml
- Frekuensi → ${userValues.freq}× per minggu
- Metode → ${userValues.metode}` :
        `- Pakan harian → ${userValues.dailyFeedKg} kg
- Frekuensi → ${userValues.mealsPerDay}× per hari
- Cek anco → ${userValues.ancoHours} jam`}

ATURAN:
1. Jawab dalam Bahasa Indonesia yang ramah, empatik, dan profesional layaknya konsultan budidaya. Panggil "Pak" atau "Bapak".
2. Jangan langsung menutup percakapan atau memaksa "kesepakatan final" di awal. Gali dulu masalahnya jika petambak curhat (misal: krisis keuangan, udang sakit, air keruh).
3. JIKA petambak meminta rekomendasi atau saran jalan tengah, berikan saran spesifik yang masuk akal secara budidaya.
4. Diskusikan sampai petambak benar-benar setuju dengan suatu angka yang spesifik.
5. HANYA JIKA petambak sudah bilang "setuju", "oke", "deal", "iya", barulah akhiri percakapan dengan merekap kesepakatan. 
6. PENTING: Di baris paling akhir dari balasanmu jika SUDAH DEAL, WAJIB sertakan data kesepakatan dalam format persis seperti ini (tanpa format markdown):
${isProb ?
        `[DEAL_DATA: {"dosis": 600, "freq": 2, "metode": "Tebar ke air"}]` :
        `[DEAL_DATA: {"pakan": 25.5, "freq": 3, "anco": 2.0}]`}
7. Balasan jangan terlalu panjang seperti robot, gunakan gaya bahasa chat (maksimal 3-4 kalimat).
8. DILARANG KERAS menggunakan format Markdown seperti tanda bintang (**) untuk menebalkan teks, atau membuat list. Tulis dengan teks murni biasa seperti membalas pesan WhatsApp.`;

    // Daftar AI Provider & Model untuk Fallback (Prioritas dari yang paling cerdas berdasarkan tes logika)
    const AI_PROVIDERS = [
      {
        name: 'Bynara (Mistral Large)',
        url: 'https://router.bynara.id/v1/chat/completions',
        key: process.env.BYNARA_API_KEY,
        model: 'mistral-large',
      },
      {
        name: 'Bynara (Qwen Max)',
        url: 'https://router.bynara.id/v1/chat/completions',
        key: process.env.BYNARA_API_KEY,
        model: 'qwen-3.8-max-free',
      },
      {
        name: 'Bynara (DeepSeek V4)',
        url: 'https://router.bynara.id/v1/chat/completions',
        key: process.env.BYNARA_API_KEY,
        model: 'deepseek-v4-flash-free',
      },
      {
        name: 'Groq (GPT-OSS 120b)',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: 'openai/gpt-oss-120b',
      },
      {
        name: 'Lynx (Gemini 3.5 Flash Thinking)',
        url: 'https://lynx-gateway-three.vercel.app/v1/chat/completions',
        key: process.env.LYNX_API_KEY,
        model: 'gemini-3.5-flash-thinking',
      },
      {
        name: 'Lynx (Gemini 3.5 Flash)',
        url: 'https://lynx-gateway-three.vercel.app/v1/chat/completions',
        key: process.env.LYNX_API_KEY,
        model: 'gemini-3.5-flash',
      },
      {
        name: 'Lynx (Gemini 3.6 Flash)',
        url: 'https://lynx-gateway-three.vercel.app/v1/chat/completions',
        key: process.env.LYNX_API_KEY,
        model: 'gemini-3.6-flash',
      }
    ];

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    let reply = '';
    let lastError = '';

    // Loop berurutan mencoba API sampai ada yang berhasil (Fallback Mechanism)
    for (const provider of AI_PROVIDERS) {
      if (!provider.key) continue; // Lewati jika API Key tidak ada di .env

      // Cek apakah model ini adalah model deepseek yang butuh user_id
      const isDeepSeek = provider.model.includes('deepseek');

      try {
        const bodyPayload: any = {
          model: provider.model,
          temperature: 0.4,
          max_tokens: 300,
          top_p: 1,
          messages: chatMessages
        };

        // DeepSeek mewajibkan/menyarankan user_id untuk isolation
        if (isDeepSeek) {
          bodyPayload.user_id = 'user_konsultasi_prima'; 
        }

        const res = await fetch(provider.url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        });

        const data = await res.json();

        if (res.ok && data.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
          console.log(`✅ Berhasil menggunakan: ${provider.name}`);
          break; // Keluar dari loop karena sudah berhasil dapat balasan!
        } else {
          console.warn(`⚠️ Gagal di ${provider.name}:`, data.error?.message || res.statusText);
          lastError = data.error?.message || res.statusText;
        }
      } catch (err: any) {
        console.warn(`⚠️ Koneksi putus ke ${provider.name}:`, err.message);
        lastError = err.message;
      }
    }

    if (!reply) {
      return NextResponse.json({ error: lastError || 'Gagal terhubung ke layanan AI.' }, { status: 500 });
    }

    // Pembersihan karakter markdown khas AI agar terlihat lebih natural (menghapus ** dan *)
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '');

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server AI.';
    console.error('Error ai-konsultasi:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
