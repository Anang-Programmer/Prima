-- ============================================================
-- PRIMA - Database Migration
-- File: 005_create_probiotic_logs.sql
-- Deskripsi: Tabel log pemberian probiotik
-- ============================================================
-- Jalankan query ini SETELAH 004_create_feed_logs.sql
-- ============================================================

-- Tabel Log Probiotik
CREATE TABLE public.probiotic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),              -- Waktu pemberian
  amount_ml NUMERIC(8,2) NOT NULL DEFAULT 0,             -- Dosis (ml)
  probiotic_type TEXT DEFAULT 'Bacillus',                 -- Jenis probiotik
  method TEXT NOT NULL DEFAULT 'Tebar ke air'
    CHECK (method IN ('Ke Air', 'Campur Pakan')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.probiotic_logs IS 'Catatan pemberian probiotik per siklus';

-- Index
CREATE INDEX idx_probiotic_logs_cycle_id ON public.probiotic_logs(cycle_id);

-- RLS
ALTER TABLE public.probiotic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own probiotic logs"
  ON public.probiotic_logs FOR SELECT
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own probiotic logs"
  ON public.probiotic_logs FOR INSERT
  WITH CHECK (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own probiotic logs"
  ON public.probiotic_logs FOR UPDATE
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
