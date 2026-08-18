-- ============================================================
-- PRIMA - Database Migration
-- File: 009_create_ai_training_data.sql
-- Deskripsi: Tabel dataset pelatihan AI dari siklus-siklus
--            yang berhasil (panen bagus). Menyimpan ringkasan
--            performa riil lapangan untuk memperkaya
--            rekomendasi AI di siklus mendatang.
-- ============================================================
-- Jalankan query ini SETELAH 008_create_views.sql
-- ============================================================

-- =====================================================
-- TABEL: ai_training_data
-- Menyimpan "pengalaman baik" dari setiap siklus panen
-- yang lolos filter kualitas.
-- =====================================================
CREATE TABLE public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,

  -- === KONTEKS KOLAM ===
  pond_area_m2 NUMERIC(10,2) NOT NULL,
  pond_depth_m NUMERIC(5,2) NOT NULL,
  pond_location TEXT DEFAULT '',

  -- === DATA SIKLUS ===
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,                   -- Durasi siklus (hari)
  initial_shrimp_count INTEGER NOT NULL,
  density_per_m2 NUMERIC(8,2) NOT NULL,          -- Kepadatan tebar (ekor/m²)

  -- === HASIL PANEN ===
  harvest_biomass_kg NUMERIC(10,2) NOT NULL,     -- Total udang dipanen (kg)
  harvest_abw_gram NUMERIC(8,2) NOT NULL,        -- Berat rata-rata saat panen (gram/ekor)
  harvest_sr_pct NUMERIC(5,2) NOT NULL,          -- Survival Rate akhir (%)
  yield_kg_per_m2 NUMERIC(8,2) NOT NULL,         -- Produktivitas (kg/m²)

  -- === EFISIENSI PAKAN ===
  total_feed_kg NUMERIC(10,2) NOT NULL,          -- Total pakan selama siklus
  final_fcr NUMERIC(5,2) NOT NULL,               -- Feed Conversion Ratio akhir
  avg_daily_feed_kg NUMERIC(8,2),                -- Rata-rata pakan per hari

  -- === STATISTIK HARIAN (Agregasi dari log) ===
  total_feed_sessions INTEGER DEFAULT 0,         -- Total berapa kali beri pakan
  anco_habis_count INTEGER DEFAULT 0,            -- Berapa kali anco habis
  anco_sisa_sedikit_count INTEGER DEFAULT 0,     -- Berapa kali anco sisa sedikit
  anco_sisa_banyak_count INTEGER DEFAULT 0,      -- Berapa kali anco sisa banyak
  anco_habis_pct NUMERIC(5,2) DEFAULT 0,         -- Persentase anco habis (%)

  -- === DATA PROBIOTIK ===
  total_probiotic_sessions INTEGER DEFAULT 0,    -- Total berapa kali beri probiotik
  total_probiotic_ml NUMERIC(10,2) DEFAULT 0,    -- Total probiotik selama siklus (ml)

  -- === DATA SAMPLING ===
  total_samplings INTEGER DEFAULT 0,             -- Berapa kali sampling dilakukan
  abw_growth_rate NUMERIC(8,4),                  -- Rata-rata pertumbuhan ABW per hari (gram/hari)

  -- === SKOR KUALITAS ===
  quality_score NUMERIC(5,2) NOT NULL DEFAULT 0, -- Skor kualitas siklus (0-100)
  quality_grade TEXT NOT NULL DEFAULT 'C'         -- Grade: A (Excellent), B (Good), C (Average)
    CHECK (quality_grade IN ('A', 'B', 'C')),
  is_approved_for_training BOOLEAN NOT NULL DEFAULT FALSE, -- Lolos filter? Hanya TRUE yang dipakai AI

  -- === METADATA ===
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_training_data IS 
  'Dataset pelatihan AI. Setiap baris = 1 siklus panen yang sudah selesai dan di-evaluasi. '
  'Hanya data dengan is_approved_for_training = TRUE dan quality_grade A atau B yang akan dipakai AI '
  'untuk memperkaya rekomendasi di siklus mendatang.';

-- Constraint: 1 cycle = 1 training data (tidak boleh duplikat)
CREATE UNIQUE INDEX idx_ai_training_cycle ON public.ai_training_data(cycle_id);

-- Index untuk query AI
CREATE INDEX idx_ai_training_user ON public.ai_training_data(user_id);
CREATE INDEX idx_ai_training_approved ON public.ai_training_data(is_approved_for_training) WHERE is_approved_for_training = TRUE;
CREATE INDEX idx_ai_training_grade ON public.ai_training_data(quality_grade);

-- RLS
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training data"
  ON public.ai_training_data FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own training data"
  ON public.ai_training_data FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FUNCTION: Hitung Quality Score dari data siklus
-- Dipanggil saat akhiri siklus untuk menentukan apakah
-- data ini layak dijadikan bahan belajar AI atau tidak.
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_quality_score(
  p_fcr NUMERIC,
  p_sr_pct NUMERIC,
  p_anco_habis_pct NUMERIC,
  p_yield_kg_per_m2 NUMERIC
)
RETURNS TABLE(score NUMERIC, grade TEXT, approved BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_score NUMERIC := 0;
  v_grade TEXT := 'C';
  v_approved BOOLEAN := FALSE;
BEGIN
  -- === RUMUS SKOR KUALITAS ===
  -- Bobot: FCR (35%), SR (30%), Anco Habis (20%), Yield (15%)

  -- 1. Skor FCR (makin kecil makin bagus)
  --    FCR <= 1.0 = 100 poin, FCR 1.5 = 50 poin, FCR >= 2.0 = 0 poin
  IF p_fcr <= 1.0 THEN
    v_score := v_score + (35 * 1.0);
  ELSIF p_fcr <= 1.5 THEN
    v_score := v_score + (35 * (1.0 - ((p_fcr - 1.0) / 0.5)));
  ELSE
    v_score := v_score + 0;
  END IF;

  -- 2. Skor Survival Rate (makin tinggi makin bagus)
  --    SR >= 85% = 100 poin, SR 60% = 50 poin, SR < 50% = 0 poin
  IF p_sr_pct >= 85 THEN
    v_score := v_score + (30 * 1.0);
  ELSIF p_sr_pct >= 50 THEN
    v_score := v_score + (30 * ((p_sr_pct - 50) / 35));
  ELSE
    v_score := v_score + 0;
  END IF;

  -- 3. Skor Anco Habis (makin sering habis = dosis makin tepat)
  --    >= 80% habis = 100 poin, 50% = 50 poin
  IF p_anco_habis_pct >= 80 THEN
    v_score := v_score + (20 * 1.0);
  ELSIF p_anco_habis_pct >= 40 THEN
    v_score := v_score + (20 * ((p_anco_habis_pct - 40) / 40));
  ELSE
    v_score := v_score + 0;
  END IF;

  -- 4. Skor Yield / Produktivitas
  --    >= 3 kg/m² = 100 poin, 1 kg/m² = 33 poin
  IF p_yield_kg_per_m2 >= 3 THEN
    v_score := v_score + (15 * 1.0);
  ELSIF p_yield_kg_per_m2 >= 1 THEN
    v_score := v_score + (15 * (p_yield_kg_per_m2 / 3));
  ELSE
    v_score := v_score + 0;
  END IF;

  -- === TENTUKAN GRADE ===
  v_score := ROUND(v_score, 2);
  
  IF v_score >= 75 THEN
    v_grade := 'A';       -- Excellent: Data sangat layak untuk training AI
    v_approved := TRUE;
  ELSIF v_score >= 50 THEN
    v_grade := 'B';       -- Good: Data cukup layak untuk training AI
    v_approved := TRUE;
  ELSE
    v_grade := 'C';       -- Average/Poor: Data TIDAK dipakai untuk training AI
    v_approved := FALSE;  -- << INI YANG MENYARING DATA JELEK
  END IF;

  RETURN QUERY SELECT v_score, v_grade, v_approved;
END;
$$;

COMMENT ON FUNCTION public.calculate_quality_score IS 
  'Menghitung skor kualitas siklus (0-100). '
  'Grade A (>=75) dan B (>=50) = approved untuk training AI. '
  'Grade C (<50) = data jelek, TIDAK dipakai AI untuk belajar.';

-- =====================================================
-- VIEW: Dataset siap pakai untuk AI
-- Hanya menampilkan data yang lolos filter kualitas
-- =====================================================
CREATE OR REPLACE VIEW public.v_ai_ready_dataset AS
SELECT 
  atd.*,
  -- Tambahan: rata-rata feeding rate riil selama siklus
  CASE 
    WHEN atd.harvest_biomass_kg > 0 
    THEN ROUND((atd.avg_daily_feed_kg / atd.harvest_biomass_kg * 100)::numeric, 2)
    ELSE 0 
  END AS avg_feeding_rate_pct
FROM public.ai_training_data atd
WHERE atd.is_approved_for_training = TRUE
  AND atd.quality_grade IN ('A', 'B')
ORDER BY atd.quality_score DESC, atd.created_at DESC;

COMMENT ON VIEW public.v_ai_ready_dataset IS 
  'Dataset BERSIH yang siap dipakai AI untuk mempelajari performa siklus sebelumnya. '
  'Hanya berisi data grade A dan B (siklus panen yang berhasil baik).';
