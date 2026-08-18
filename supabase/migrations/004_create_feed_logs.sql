-- ============================================================
-- PRIMA - Database Migration
-- File: 004_create_feed_logs.sql
-- Deskripsi: Tabel log pemberian pakan harian
-- ============================================================
-- Jalankan query ini SETELAH 003_create_cycles.sql
-- ============================================================

-- Tabel Log Pakan
CREATE TABLE public.feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),             -- Waktu pemberian pakan
  feed_amount_kg NUMERIC(8,2) NOT NULL DEFAULT 0,      -- Jumlah pakan yang ditebar (kg)
  feed_type TEXT DEFAULT 'Pelet',                       -- Jenis pakan ("Pelet 1mm", "Pelet 1.5mm")
  anco_result TEXT NOT NULL DEFAULT 'Belum Dicek'
    CHECK (anco_result IN ('Habis', 'Sisa Sedikit', 'Sisa Banyak', 'Belum Dicek')),
  anco_remaining_pct NUMERIC(5,2),                      -- Persentase sisa anco (opsional, untuk detail)
  notes TEXT DEFAULT '',                                 -- Catatan tambahan
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feed_logs IS 'Catatan harian pemberian pakan dan hasil pengecekan anco';
COMMENT ON COLUMN public.feed_logs.anco_result IS 'Habis = dosis aman. Sisa Sedikit = kurangi 5-10%. Sisa Banyak = kurangi 20-30%.';

-- Index
CREATE INDEX idx_feed_logs_cycle_id ON public.feed_logs(cycle_id);
CREATE INDEX idx_feed_logs_date ON public.feed_logs(date DESC);

-- RLS
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;

-- User hanya bisa akses log pakan dari siklus di kolamnya
CREATE POLICY "Users can view own feed logs"
  ON public.feed_logs FOR SELECT
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own feed logs"
  ON public.feed_logs FOR INSERT
  WITH CHECK (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own feed logs"
  ON public.feed_logs FOR UPDATE
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own feed logs"
  ON public.feed_logs FOR DELETE
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
