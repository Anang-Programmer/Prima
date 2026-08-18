-- ============================================================
-- PRIMA - Database Migration
-- File: 003_create_cycles.sql
-- Deskripsi: Tabel siklus budidaya (tebar - panen)
-- ============================================================
-- Jalankan query ini SETELAH 002_create_ponds.sql
-- ============================================================

-- Tabel Siklus Budidaya
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Berjalan'
    CHECK (status IN ('Berjalan', 'Selesai', 'Jeda')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,        -- Tanggal tebar benur
  end_date DATE,                                         -- Tanggal panen (NULL = belum panen)
  initial_shrimp_count INTEGER NOT NULL DEFAULT 0,       -- Jumlah benur tebar awal
  target_yield_kg_per_m2 NUMERIC(5,2) DEFAULT 3.0,      -- Target panen kg/m²

  -- Data terkini (di-update saat sampling / akhir siklus)
  current_biomass_kg NUMERIC(10,2) NOT NULL DEFAULT 0,   -- Biomassa terkini (kg)
  current_abw_gram NUMERIC(8,2) NOT NULL DEFAULT 0,      -- ABW terkini (gram/ekor)

  -- Data panen (diisi saat akhiri siklus)
  harvest_biomass_kg NUMERIC(10,2),                       -- Total hasil panen (kg)
  harvest_abw_gram NUMERIC(8,2),                          -- ABW saat panen (gram/ekor)
  harvest_shrimp_count INTEGER,                            -- Estimasi ekor saat panen
  harvest_fcr NUMERIC(5,2),                                -- FCR akhir siklus
  harvest_sr_pct NUMERIC(5,2),                             -- Survival Rate akhir (%)
  total_feed_kg NUMERIC(10,2),                             -- Total pakan selama siklus (kg)
  notes TEXT DEFAULT '',                                   -- Catatan petambak

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cycles IS 'Siklus budidaya dari tebar benur sampai panen. Data harvest diisi saat akhiri siklus.';
COMMENT ON COLUMN public.cycles.harvest_fcr IS 'Feed Conversion Ratio = total pakan / total biomassa panen';

-- Auto-update updated_at
CREATE TRIGGER on_cycles_updated
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX idx_cycles_pond_id ON public.cycles(pond_id);
CREATE INDEX idx_cycles_status ON public.cycles(status);

-- RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- User hanya bisa akses siklus di kolam miliknya
CREATE POLICY "Users can view own cycles"
  ON public.cycles FOR SELECT
  USING (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own cycles"
  ON public.cycles FOR INSERT
  WITH CHECK (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own cycles"
  ON public.cycles FOR UPDATE
  USING (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  )
  WITH CHECK (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );
