import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { type, messages, pondContext, ancoContext, sniValues, userValues } = await req.json();
    const isProb = type === 'probiotik';

    // --- Hitung batas toleransi berdasarkan angka lapangan (anco-adjusted) ---
    // NOTE: variabel bounds ini dihitung SEKALI dan dipakai dua kali:
    //   1) untuk teks system prompt (biar AI tahu batasnya)
    //   2) untuk validasi server-side setelah AI membalas (jaring pengaman)
    let toleranceBlock = '';
    let bounds: { lower: number; upper: number; floor?: number } = { lower: 0, upper: 0 };

    if (!isProb) {
      const baselineKg = ancoContext?.adjustedDailyFeedKg ?? sniValues.dailyFeedKg;
      const sniKg = sniValues.dailyFeedKg;
      
      // FIX BUG: Jangan sampai lower > upper. 
      // - Batas bawah: paling kecil antara 80% pakan aktual ATAU 50% SNI.
      // - Batas atas: maksimal antara 120% pakan aktual ATAU kembali ke angka SNI penuh.
      const absoluteFloor = +(sniKg * 0.50).toFixed(2);
      const rawLower = +(baselineKg * 0.80).toFixed(2);
      const lower = rawLower; // Harus rawLower agar pakan tidak boleh didrop lebih dari 20% sekaligus
      const upper = Math.max(+(baselineKg * 1.20).toFixed(2), sniKg);
      
      const isCritical = baselineKg < absoluteFloor;
      const userFeed = userValues.dailyFeedKg;
      const isIncrease = userFeed > baselineKg;
      const actionText = isIncrease
        ? `MENAIKKAN pakan dari ${baselineKg} kg menjadi ${userFeed} kg`
        : `MENURUNKAN pakan dari ${baselineKg} kg menjadi ${userFeed} kg`;
      const directionAlert =
        userFeed > upper
          ? `PERHATIAN: Angka ${userFeed} kg ini MELEBIHI batas atas aman (${upper} kg). Tolak dengan halus dan sarankan maksimal ${upper} kg.`
          : userFeed < lower
          ? `PERHATIAN: Angka ${userFeed} kg ini DI BAWAH batas bawah aman (${lower} kg). Tolak dengan halus dan sarankan minimal ${lower} kg.`
          : `PERHATIAN: Angka ${userFeed} kg ini MASIH DALAM BATAS AMAN (${lower} - ${upper} kg). Kamu BOLEH menyetujuinya.`;

      bounds = { lower, upper, floor: absoluteFloor };

      toleranceBlock = `
BATAS TOLERANSI (WAJIB DIPATUHI):
- Niat Petambak: Ingin ${actionText}.
- Status Permintaan: ${directionAlert}
- Angka acuan utamamu adalah pakan lapangan (anco-adjusted): ${baselineKg} kg/hari.
- Angka SNI (rumus standar): ${sniKg} kg/hari.
- Lantai absolut acuan: ${absoluteFloor} kg.
- Kamu DILARANG KERAS menyetujui pakan di bawah ${lower} kg (batas minimum baru) atau di atas ${upper} kg (batas maksimum).
- Frekuensi makan hanya boleh 3x, 4x, atau 5x per hari.
- Interval cek anco hanya boleh antara 1.0 - 3.0 jam.
- Jika petambak meminta angka DI LUAR batas ini, TOLAK dengan sopan, jelaskan risikonya, dan sarankan angka terdekat yang masih dalam batas aman.
- Kamu TIDAK BOLEH dibujuk atau dirayu untuk melebihi batas ini dalam keadaan apapun.${
        isCritical
          ? `
- PERINGATAN KRITIS: Pakan lapangan saat ini (${baselineKg} kg) sudah turun di bawah 50% dari standar SNI (${sniKg} kg). Ini menandakan kemungkinan ada masalah serius di kolam (udang sakit, kualitas air buruk, dll). Sampaikan kekhawatiran ini ke petambak dan sarankan evaluasi menyeluruh.`
          : ''
      }`;
    } else {
      // FIX: parsing dosis SNI lebih tahan banting — sebelumnya cuma .replace('ml','')
      // yang gampang jadi NaN kalau formatnya "600 ml", "600ML", dsb.
      const parsedDosis = parseFloat(String(sniValues.dosis).replace(/,/g, '.').replace(/[^0-9.]/g, ''));
      const baselineMl = Number.isFinite(parsedDosis) ? parsedDosis : 0;
      const lower = +(baselineMl * 0.70).toFixed(0);
      const upper = +(baselineMl * 1.30).toFixed(0);

      bounds = { lower, upper };

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
      const last5 =
        (ancoContext.last5Results || []).length > 0
          ? (ancoContext.last5Results as string[]).join(' → ')
          : 'Belum ada data';
      ancoBlock = `
DATA LAPANGAN (KONDISI ANCO TERKINI):
- Hasil anco terakhir: ${ancoContext.latestResult ?? 'Belum ada'}
- Pakan sudah di-adjust otomatis menjadi: ${ancoContext.adjustedDailyFeedKg} kg/hari${
        ancoContext.multiplier !== 1
          ? ` (dipotong ${Math.round((1 - ancoContext.multiplier) * 100)}% dari SNI)`
          : ' (belum ada koreksi anco)'
      }
- 5 sesi cek anco terakhir: ${last5}
- Anco habis berturut-turut: ${ancoContext.consecutiveHabis} kali`;
    }

    // FIX (bug utama #1): format DEAL_DATA sebelumnya pakai angka contoh literal
    // (600, 2, 0.45, 4, 2.0). Model kecil/gratisan (fallback provider) sering
    // MENIRU angka contoh itu apa adanya alih-alih menghitung angka kesepakatan
    // yang sebenarnya — ini penyebab rekomendasi kelihatan "ngasal"/seragam.
    // Sekarang pakai placeholder bertanda <...> supaya jelas itu BUKAN nilai final.
    const dealFormatInstruction = isProb
      ? `[DEAL_DATA: {"dosis": <angka_ml_hasil_kesepakatan>, "freq": <1_2_atau_3>, "metode": "<metode_hasil_kesepakatan>"}]`
      : `[DEAL_DATA: {"pakan": <angka_kg_hasil_kesepakatan>, "freq": <3_4_atau_5>, "anco": <angka_jam_hasil_kesepakatan>}]`;

    const systemPrompt = `Kamu adalah konsultan budidaya udang vaname bernama "Prima AI". Kamu sedang berdiskusi singkat dengan petambak yang ingin mengubah rekomendasi ${
      isProb ? 'probiotik' : 'pakan'
    } dari standar.

KONTEKS KOLAM PETAMBAK:
- DOC (umur pemeliharaan): ${pondContext.doc ?? '-'} hari
- Populasi: ${pondContext.population?.toLocaleString() ?? '-'} ekor
- Luas kolam: ${pondContext.area ?? '-'} m²
- ABW (berat rata-rata): ${pondContext.abw ?? '-'} gram
- Biomassa estimasi: ${pondContext.biomass ?? '-'} kg

BASE 1 - REKOMENDASI SNI (angka dari rumus standar nasional):
${
  isProb
    ? `- Dosis: ${sniValues.dosis}
- Frekuensi: ${sniValues.frekuensi}
- Metode: ${sniValues.metode}`
    : `- Pakan harian (SNI murni): ${sniValues.dailyFeedKg} kg
- Frekuensi: ${sniValues.mealsPerDay}× per hari
- Feeding rate: ${sniValues.feedingRate}%
- Cek anco: ${sniValues.ancoHours} jam`
}

BASE 2 - DATA LAPANGAN (angka yang sudah disesuaikan berdasarkan kondisi anco nyata):
${ancoBlock || '(Belum ada data anco. Gunakan Base 1 sebagai acuan utama.)'}

YANG PETAMBAK INGIN UBAH:
${
  isProb
    ? `- Dosis → ${userValues.dosis} ml
- Frekuensi → ${userValues.freq}× per minggu
- Metode → ${userValues.metode}`
    : `- Pakan harian → ${userValues.dailyFeedKg} kg
- Frekuensi → ${userValues.mealsPerDay}× per hari
- Cek anco → ${userValues.ancoHours} jam`
}
${toleranceBlock}

ATURAN:
1. Jawab dalam Bahasa Indonesia yang ramah, empatik, dan profesional layaknya konsultan budidaya. Panggil "Pak" atau "Bapak".
2. Kamu punya 2 BASIS DATA: Base 1 (SNI rumus standar) dan Base 2 (data lapangan dari anco). Gunakan KEDUANYA saat menilai permintaan petambak. Jika Base 2 tersedia, itu adalah acuan utamamu karena lebih dekat dengan kondisi nyata.
3. Jangan langsung menutup percakapan atau memaksa "kesepakatan final" di awal. Gali dulu masalahnya jika petambak curhat (misal: krisis keuangan, udang sakit, air keruh).
4. JIKA angka permintaan petambak MASIH DALAM BATAS AMAN, langsung SETUJUI dan berikan angka yang SAMA PERSIS dengan yang diminta petambak (misal petambak minta 2.48, setujui 2.48). DILARANG KERAS menawar/mengubah angkanya menjadi sedikit berbeda (seperti 2.45) karena akan terlihat tidak sinkron.
5. Diskusikan sampai petambak benar-benar setuju dengan suatu angka yang spesifik.
6. HANYA JIKA petambak sudah bilang "setuju", "oke", "deal", "iya", barulah akhiri percakapan dengan merekap kesepakatan dalam bentuk teks yang jelas (misal: "Baik Pak, kesepakatannya adalah pakan 2.4 kg, 4x sehari...").
7. SEBELUM menulis DEAL_DATA, cek ulang: apakah angka yang disepakati benar-benar berada di dalam BATAS TOLERANSI di atas? Jika TIDAK, jangan tulis DEAL_DATA — lanjutkan diskusi dan tawarkan angka yang masih aman.
8. JIKA sudah deal dan angkanya valid, WAJIB sertakan baris berikut sebagai BARIS PALING TERAKHIR balasanmu, dan TIDAK ADA teks apapun setelahnya:
${dealFormatInstruction}
   PENTING soal format ini:
   - Ganti SETIAP placeholder <...> dengan angka/teks hasil kesepakatan SEBENARNYA dari percakapan. JANGAN PERNAH menyalin angka placeholder apa adanya.
   - Nilai pakan/dosis WAJIB berupa angka Kilogram/ml pakai titik desimal (contoh: 0.45), BUKAN koma, dan BUKAN dalam satuan gram.
   - Jangan bungkus JSON dengan markdown code block (tanpa \`\`\`), jangan tambahkan komentar apapun di baris itu.
9. Jika belum ada kesepakatan final, JANGAN tulis baris DEAL_DATA sama sekali — cukup balas seperti biasa.
10. Balasan jangan terlalu panjang seperti robot, gunakan gaya bahasa chat (maksimal 3-4 kalimat).
11. DILARANG KERAS menggunakan format Markdown seperti tanda bintang (**) untuk menebalkan teks, atau membuat list. Tulis dengan teks murni biasa seperti membalas pesan WhatsApp.`;

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
      },
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
    let usedProvider = '';

    // Loop berurutan mencoba API sampai ada yang berhasil (Fallback Mechanism)
    for (const provider of AI_PROVIDERS) {
      if (!provider.key) continue; // Lewati jika API Key tidak ada di .env

      const isDeepSeek = provider.model.includes('deepseek');

      try {
        const bodyPayload: any = {
          model: provider.model,
          temperature: 0.4,
          max_tokens: 800,
          top_p: 1,
          messages: chatMessages,
        };

        if (isDeepSeek) {
          bodyPayload.user_id = 'user_konsultasi_prima';
        }

        const res = await fetch(provider.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });

        const data = await res.json();

        if (res.ok && data.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
          usedProvider = provider.name;
          console.log(`✅ Berhasil menggunakan: ${provider.name}`);
          break;
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

    // FIX (bug utama #2 & #3): jaring pengaman server-side.
    // Apapun yang dijawab AI (provider manapun yang kepakai), kalau ada baris
    // DEAL_DATA, kita parse dan PAKSA angkanya tetap di dalam batas toleransi
    // yang sudah kita hitung sendiri di server (bukan cuma percaya prompt).
    // Ini yang mencegah data "ngaco" ke-save, dan mencegah parsing gagal total
    // di frontend gara-gara format JSON yang sedikit berbeda.
    reply = sanitizeDealData(reply, isProb, bounds);

    return NextResponse.json({ reply, provider: usedProvider });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server AI.';
    console.error('Error ai-konsultasi:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Cari baris [DEAL_DATA: {...}] di reply, lalu:
 * - kalau JSON-nya rusak/tidak ada -> kembalikan reply apa adanya (jangan crash)
 * - kalau JSON valid -> clamp semua angka ke batas toleransi yang dihitung di server,
 *   dan normalisasi angka yang mungkin ditulis pakai koma ("0,45" -> 0.45)
 */
function sanitizeDealData(
  rawReply: string,
  isProb: boolean,
  bounds: { lower: number; upper: number; floor?: number }
): string {
  const match = rawReply.match(/\[DEAL_DATA:\s*(\{[\s\S]*?\})\]/);
  if (!match) return rawReply;

  let deal: any;
  try {
    deal = JSON.parse(match[1]);
  } catch {
    // JSON tidak valid (misal model masih nulis placeholder <...> yang lupa diganti).
    // Lebih aman buang baris ini daripada frontend nyoba parse & gagal diam-diam.
    return rawReply.replace(match[0], '').trim();
  }

  const toNumber = (v: unknown) => Number(String(v).replace(',', '.'));
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  if (isProb) {
    const dosis = toNumber(deal.dosis);
    deal.dosis = Number.isFinite(dosis) ? clamp(dosis, bounds.lower, bounds.upper) : bounds.lower;
    const freq = Number(deal.freq);
    deal.freq = [1, 2, 3].includes(freq) ? freq : 2;
  } else {
    const pakan = toNumber(deal.pakan);
    deal.pakan = Number.isFinite(pakan) ? +clamp(pakan, bounds.lower, bounds.upper).toFixed(2) : bounds.lower;
    const freq = Number(deal.freq);
    deal.freq = [3, 4, 5].includes(freq) ? freq : 4;
    const anco = toNumber(deal.anco);
    deal.anco = Number.isFinite(anco) ? +clamp(anco, 1.0, 3.0).toFixed(1) : 2.0;
  }

  return rawReply.replace(match[0], `[DEAL_DATA: ${JSON.stringify(deal)}]`);
}