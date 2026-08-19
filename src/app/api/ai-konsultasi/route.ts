import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {


    const { type, messages, pondContext, ancoContext, sniValues, userValues } = await req.json();
    const isProb = type === 'probiotik';

    // --- Hitung batas toleransi berdasarkan angka lapangan (anco-adjusted) ---
    let toleranceBlock = '';
    if (!isProb) {
      const baselineKg = ancoContext?.adjustedDailyFeedKg ?? sniValues.dailyFeedKg;
      const sniKg = sniValues.dailyFeedKg;
      const absoluteFloor = +(sniKg * 0.50).toFixed(2);
      const rawLower = +(baselineKg * 0.80).toFixed(2);
      const lower = Math.max(rawLower, absoluteFloor);
      const upper = +(baselineKg * 1.20).toFixed(2);
      const isCritical = baselineKg < absoluteFloor;
      toleranceBlock = `
BATAS TOLERANSI (WAJIB DIPATUHI):
- Angka acuan utamamu adalah pakan lapangan (anco-adjusted): ${baselineKg} kg/hari.
- Angka SNI (rumus standar): ${sniKg} kg/hari.
- Lantai absolut (50% SNI): ${absoluteFloor} kg — pakan TIDAK BOLEH turun di bawah ini dalam keadaan apapun.
- Kamu DILARANG KERAS menyetujui pakan di bawah ${lower} kg atau di atas ${upper} kg.
- Frekuensi makan hanya boleh 3x, 4x, atau 5x per hari.
- Interval cek anco hanya boleh antara 1.0 - 3.0 jam.
- Jika petambak meminta angka DI LUAR batas ini, TOLAK dengan sopan, jelaskan risikonya, dan sarankan angka terdekat yang masih dalam batas aman.
- Kamu TIDAK BOLEH dibujuk atau dirayu untuk melebihi batas ini dalam keadaan apapun.${isCritical ? `
- PERINGATAN KRITIS: Pakan lapangan saat ini (${baselineKg} kg) sudah turun di bawah 50% dari standar SNI (${sniKg} kg). Ini menandakan kemungkinan ada masalah serius di kolam (udang sakit, kualitas air buruk, dll). Sampaikan kekhawatiran ini ke petambak dan sarankan evaluasi menyeluruh.` : ''}`;
    } else {
      const baselineMl = Number(String(sniValues.dosis).replace('ml', ''));
      const lower = +(baselineMl * 0.70).toFixed(0);
      const upper = +(baselineMl * 1.30).toFixed(0);
      toleranceBlock = `
BATAS TOLERANSI (WAJIB DIPATUHI):
- Angka acuan dosis probiotik: ${baselineMl} ml.
- Kamu DILARANG KERAS menyetujui dosis di bawah ${lower} ml atau di atas ${upper} ml (±30% dari acuan).
- Frekuensi hanya boleh 1x, 2x, atau 3x per minggu.
- Jika petambak meminta angka DI LUAR batas ini, TOLAK dengan sopan dan sarankan angka terdekat yang masih aman.
- Kamu TIDAK BOLEH dibujuk untuk melebihi batas ini.`;
    }

    // --- Blok data anco lapangan ---
    let ancoBlock = '';
    if (ancoContext) {
      const last5 = (ancoContext.last5Results || []).length > 0
        ? (ancoContext.last5Results as string[]).join(' → ')
        : 'Belum ada data';
      ancoBlock = `
DATA LAPANGAN (KONDISI ANCO TERKINI):
- Hasil anco terakhir: ${ancoContext.latestResult ?? 'Belum ada'}
- Pakan sudah di-adjust otomatis menjadi: ${ancoContext.adjustedDailyFeedKg} kg/hari${ancoContext.multiplier !== 1 ? ` (dipotong ${Math.round((1 - ancoContext.multiplier) * 100)}% dari SNI)` : ' (belum ada koreksi anco)'}
- 5 sesi cek anco terakhir: ${last5}
- Anco habis berturut-turut: ${ancoContext.consecutiveHabis} kali`;
    }

    const systemPrompt = `Kamu adalah konsultan budidaya udang vaname bernama "Prima AI". Kamu sedang berdiskusi singkat dengan petambak yang ingin mengubah rekomendasi ${isProb ? 'probiotik' : 'pakan'} dari standar.

KONTEKS KOLAM PETAMBAK:
- DOC (umur pemeliharaan): ${pondContext.doc ?? '-'} hari
- Populasi: ${pondContext.population?.toLocaleString() ?? '-'} ekor
- Luas kolam: ${pondContext.area ?? '-'} m²
- ABW (berat rata-rata): ${pondContext.abw ?? '-'} gram
- Biomassa estimasi: ${pondContext.biomass ?? '-'} kg

BASE 1 - REKOMENDASI SNI (angka dari rumus standar nasional):
${isProb ?
        `- Dosis: ${sniValues.dosis}
- Frekuensi: ${sniValues.frekuensi}
- Metode: ${sniValues.metode}` :
        `- Pakan harian (SNI murni): ${sniValues.dailyFeedKg} kg
- Frekuensi: ${sniValues.mealsPerDay}× per hari
- Feeding rate: ${sniValues.feedingRate}%
- Cek anco: ${sniValues.ancoHours} jam`}

BASE 2 - DATA LAPANGAN (angka yang sudah disesuaikan berdasarkan kondisi anco nyata):
${ancoBlock || '(Belum ada data anco. Gunakan Base 1 sebagai acuan utama.)'}

YANG PETAMBAK INGIN UBAH:
${isProb ?
        `- Dosis → ${userValues.dosis} ml
- Frekuensi → ${userValues.freq}× per minggu
- Metode → ${userValues.metode}` :
        `- Pakan harian → ${userValues.dailyFeedKg} kg
- Frekuensi → ${userValues.mealsPerDay}× per hari
- Cek anco → ${userValues.ancoHours} jam`}
${toleranceBlock}

ATURAN:
1. Jawab dalam Bahasa Indonesia yang ramah, empatik, dan profesional layaknya konsultan budidaya. Panggil "Pak" atau "Bapak".
2. Kamu punya 2 BASIS DATA: Base 1 (SNI rumus standar) dan Base 2 (data lapangan dari anco). Gunakan KEDUANYA saat menilai permintaan petambak. Jika Base 2 tersedia, itu adalah acuan utamamu karena lebih dekat dengan kondisi nyata.
3. Jangan langsung menutup percakapan atau memaksa "kesepakatan final" di awal. Gali dulu masalahnya jika petambak curhat (misal: krisis keuangan, udang sakit, air keruh).
4. JIKA petambak meminta rekomendasi atau saran jalan tengah, berikan saran spesifik yang masuk akal secara budidaya.
5. Diskusikan sampai petambak benar-benar setuju dengan suatu angka yang spesifik.
6. HANYA JIKA petambak sudah bilang "setuju", "oke", "deal", "iya", barulah akhiri percakapan dengan merekap kesepakatan. 
7. PENTING: Di baris paling akhir dari balasanmu jika SUDAH DEAL, WAJIB sertakan data kesepakatan dalam format persis seperti ini (tanpa format markdown):
${isProb ?
        `[DEAL_DATA: {"dosis": 600, "freq": 2, "metode": "Tebar ke air"}]` :
        `[DEAL_DATA: {"pakan": 0.45, "freq": 4, "anco": 2.0}] (Catatan: Nilai "pakan" WAJIB dalam satuan Kilogram (kg) menggunakan titik desimal, bukan koma. Dilarang mereturn dalam satuan gram!)`}
8. Balasan jangan terlalu panjang seperti robot, gunakan gaya bahasa chat (maksimal 3-4 kalimat).
9. DILARANG KERAS menggunakan format Markdown seperti tanda bintang (**) untuk menebalkan teks, atau membuat list. Tulis dengan teks murni biasa seperti membalas pesan WhatsApp.`;

    // Daftar AI Provider & Model untuk Fallback (Prioritas dari yang paling cerdas berdasarkan tes logika)
    const AI_PROVIDERS = [
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
        name: 'Bynara (Mistral Large)',
        url: 'https://router.bynara.id/v1/chat/completions',
        key: process.env.BYNARA_API_KEY,
        model: 'mistral-large',
      },
      {
        name: 'Lynx (Gemini 3.6 Flash)',
        url: 'https://lynx-gateway-three.vercel.app/v1/chat/completions',
        key: process.env.LYNX_API_KEY,
        model: 'gemini-3.6-flash',
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
          max_tokens: 800,
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
