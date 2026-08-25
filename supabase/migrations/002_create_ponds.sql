-- ============================================================
-- PRIMA - Database Migration
-- File: 002_create_ponds.sql
-- Deskripsi: Tabel kolam tambak
-- ============================================================
-- Jalankan query ini SETELAH 001_create_profiles.sql
-- ============================================================

-- Tabel Kolam
CREATE TABLE public.ponds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- "Kolam Alpha"
  area_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,   -- Luas kolam (m²)
  depth_m NUMERIC(5,2) NOT NULL DEFAULT 1.5,  -- Kedalaman kolam (meter)
  location TEXT DEFAULT '',                    -- "Blok A Utara"
  shape TEXT NOT NULL DEFAULT 'Persegi'        -- 'Persegi' | 'Lingkaran'
    CHECK (shape IN ('Persegi', 'Lingkaran')),
  status TEXT NOT NULL DEFAULT 'Aktif'         -- 'Aktif' | 'Non-aktif'
    CHECK (status IN ('Aktif', 'Non-aktif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ponds IS 'Data kolam tambak milik petambak';

-- Auto-update updated_at
CREATE TRIGGER on_ponds_updated
  BEFORE UPDATE ON public.ponds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index untuk query cepat per user
CREATE INDEX idx_ponds_user_id ON public.ponds(user_id);

-- RLS
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;

-- User hanya bisa CRUD kolam miliknya sendiri
CREATE POLICY "Users can view own ponds"
  ON public.ponds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ponds"
  ON public.ponds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ponds"
  ON public.ponds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ponds"
  ON public.ponds FOR DELETE
  USING (auth.uid() = user_id);
