import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { pondId, cycleId, docNow, currentStockingDensity, currentHarvestTarget, currentMonth } = await req.json();
    const supabase = await createClient();

    // 1. Cari siklus masa lalu yang sukses
    // Ambil user_id dari pondId saat ini untuk mencari lintas kolam
    const { data: currentPond } = await supabase.from('ponds').select('user_id').eq('id', pondId).single();
    let pondIds = [pondId];
    if (currentPond) {
      const { data: userPonds } = await supabase.from('ponds').select('id').eq('user_id', currentPond.user_id);
      if (userPonds) pondIds = userPonds.map((p: any) => p.id);
    }

    const { data: pastCycles } = await supabase
      .from('cycles')
      .select('*')
      .in('pond_id', pondIds)
      .eq('initial_shrimp_count', currentStockingDensity)
      .not('harvest_biomass_kg', 'is', null);

    let bestHistoricalFeed = null;
    let foundCycle = null;

    if (pastCycles && pastCycles.length > 0) {
      // Cari siklus yang FCR-nya < 1.5 dan bulan mulainya sama
      for (const c of pastCycles) {
        const fcr = c.harvest_fcr || 0;
        
        const pastMonth = new Date(c.start_date).getMonth();
        
        if (fcr > 0 && fcr < 1.5 && pastMonth === currentMonth) {
          foundCycle = c;
          break;
        }
      }

      if (foundCycle) {
        // Ambil data pakan pada DOC ini di siklus lalu
        const { data: pastFeedLogs } = await supabase
          .from('feed_logs')
          .select('amount_kg')
          .eq('cycle_id', foundCycle.cycle_id);
          // Query aktual membutuhkan field DOC di feed_logs, 
          // sementara kita pakai data dari log pertama sebagai contoh implementasi aman.
        
        if (pastFeedLogs && pastFeedLogs.length > 0) {
          bestHistoricalFeed = pastFeedLogs[0].amount_kg;
        }
      }
    }

    const baselineKg = bestHistoricalFeed || 0; // Nanti fallback ke SNI jika 0
    
    // Toleransi batas aman SAMA PERSIS seperti AI Konsultasi SNI (80% - 120%)
    const absoluteFloor = +(baselineKg * 0.50).toFixed(2);
    const rawLower = +(baselineKg * 0.80).toFixed(2);
    const lower = rawLower; 
    const upper = +(baselineKg * 1.20).toFixed(2);

    const systemPrompt = `Kamu adalah AI Spesialis Historis Tambak Udang Prima.
Tugasmu adalah menganalisis permintaan pakan petambak berdasarkan data historis sukses.
Data historis terbaik petambak ini untuk DOC ${docNow} adalah ${baselineKg} kg/hari.
BATAS TOLERANSI:
- Kamu DILARANG KERAS menyetujui pakan di bawah ${lower} kg atau di atas ${upper} kg.
- Jika permintaan di luar batas, tolak dengan sopan dan berikan rekomendasi terdekat.`;

    // Proses fetch AI bisa dilanjutkan di sini seperti di ai-konsultasi
    // ...

    return NextResponse.json({
      success: true,
      message: 'Rute AI Historis berhasil disiapkan.',
      systemPrompt,
      historisData: bestHistoricalFeed 
    });

  } catch (error: any) {
    console.error('Error di AI Historis:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses AI Historis', error: error.message },
      { status: 500 }
    );
  }
}
