-- ============================================================
-- PRIMA - Database Migration
-- File: 006_create_sampling_logs.sql
-- Deskripsi: Tabel log sampling mingguan (timbang udang)
-- ============================================================
-- Jalankan query ini SETELAH 005_create_probiotic_logs.sql
-- ============================================================

-- Tabel Log Sampling (Timbang Udang Mingguan)
CREATE TABLE public.sampling_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doc INTEGER NOT NULL,                                    -- DOC saat sampling
  sample_count INTEGER NOT NULL DEFAULT 30,                -- Jumlah udang yang ditimbang
  total_weight_gram NUMERIC(10,2) NOT NULL DEFAULT 0,      -- Total berat sampel (gram)
  abw_gram NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE WHEN sample_count > 0 THEN total_weight_gram / sample_count ELSE 0 END
  ) STORED,                                                -- ABW otomatis dihitung
  estimated_sr_pct NUMERIC(5,2),                           -- Estimasi survival rate (%)
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.sampling_logs IS 'Data sampling/timbang udang mingguan. ABW dihitung otomatis dari total berat / jumlah sampel.';
COMMENT ON COLUMN public.sampling_logs.abw_gram IS 'Average Body Weight, dihitung otomatis: total_weight_gram / sample_count';

-- Index
CREATE INDEX idx_sampling_logs_cycle_id ON public.sampling_logs(cycle_id);

-- RLS
ALTER TABLE public.sampling_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sampling logs"
  ON public.sampling_logs FOR SELECT
  USING (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sampling logs"
  ON public.sampling_logs FOR INSERT
  WITH CHECK (
    cycle_id IN (
      SELECT c.id FROM public.cycles c
      JOIN public.ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
