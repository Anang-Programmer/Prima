-- ============================================================
-- PRIMA - Database Migration
-- File: 001_create_profiles.sql
-- Deskripsi: Tabel profil pengguna (extends Supabase Auth)
-- ============================================================
-- Jalankan query ini PERTAMA KALI di Supabase SQL Editor.
-- Tabel ini terhubung otomatis ke sistem Auth bawaan Supabase.
-- ============================================================

-- Tabel Profil User (linked ke auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  kecamatan TEXT DEFAULT '',
  kota TEXT DEFAULT '',
  provinsi TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  farm_name TEXT DEFAULT '',           -- Nama usaha tambak
  location TEXT DEFAULT '',            -- Lokasi/alamat tambak
  avatar_url TEXT DEFAULT '',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,  -- Status langganan premium
  premium_expires_at TIMESTAMPTZ,             -- Kapan premium berakhir (NULL = belum pernah)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Komentar Tabel
COMMENT ON TABLE public.profiles IS 'Profil pengguna Prima, terhubung langsung ke Supabase Auth';
COMMENT ON COLUMN public.profiles.is_premium IS 'TRUE = user premium (unlimited kolam + AI rekomendasi). FALSE = user gratis (1 kolam, tanpa AI).';
COMMENT ON COLUMN public.profiles.premium_expires_at IS 'Tanggal kadaluarsa premium. NULL berarti belum pernah berlangganan.';

-- Auto-update kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profil saat user baru daftar via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name,
    first_name,
    last_name,
    kecamatan,
    kota,
    provinsi,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'kecamatan', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'kota', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'provinsi', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat & edit profilnya sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
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

  -- ============================================================
-- PRIMA - Migration 011
-- Deskripsi: Tambah kolom jenis/shape kolam (Persegi | Lingkaran)
-- ============================================================
ALTER TABLE public.ponds
ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'Persegi'
CHECK (shape IN ('Persegi', 'Lingkaran'));

COMMENT ON COLUMN public.ponds.shape IS 'Jenis/bentuk tambak: Persegi atau Lingkaran (dipakai saat hitung estimasi volume & kepadatan).';
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
-- ============================================================
-- PRIMA - Database Migration
-- File: 007_create_active_timers.sql
-- Deskripsi: Tabel timer aktif (alarm pakan, anco, probiotik)
-- ============================================================
-- Jalankan query ini SETELAH 006_create_sampling_logs.sql
-- ============================================================

-- Tabel Timer/Alarm Aktif
CREATE TABLE public.active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES public.ponds(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('Pakan', 'Cek Anco', 'Probiotik')),
  trigger_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- Kapan timer dibuat
  due_time TIMESTAMPTZ NOT NULL,                          -- Kapan timer berbunyi
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,            -- Sudah selesai?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.active_timers IS 'Timer/alarm aktif untuk jadwal pakan, cek anco, dan probiotik';

-- Index
CREATE INDEX idx_timers_pond_id ON public.active_timers(pond_id);
CREATE INDEX idx_timers_due_time ON public.active_timers(due_time);

-- RLS
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timers"
  ON public.active_timers FOR SELECT
  USING (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own timers"
  ON public.active_timers FOR INSERT
  WITH CHECK (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own timers"
  ON public.active_timers FOR UPDATE
  USING (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own timers"
  ON public.active_timers FOR DELETE
  USING (
    pond_id IN (SELECT id FROM public.ponds WHERE user_id = auth.uid())
  );
-- ============================================================
-- PRIMA - Database Migration
-- File: 008_create_views.sql
-- Deskripsi: Views (tampilan ringkasan) untuk mempermudah query
-- ============================================================
-- Jalankan query ini PALING TERAKHIR setelah semua tabel dibuat
-- ============================================================

-- =====================================================
-- VIEW 1: Ringkasan Dashboard per Kolam
-- Menggabungkan data kolam + siklus aktif + DOC
-- =====================================================
CREATE OR REPLACE VIEW public.v_pond_dashboard AS
SELECT
  p.id AS pond_id,
  p.user_id,
  p.name AS pond_name,
  p.area_m2,
  p.depth_m,
  p.location,
  p.status AS pond_status,
  c.id AS cycle_id,
  c.status AS cycle_status,
  c.start_date,
  c.initial_shrimp_count,
  c.target_yield_kg_per_m2,
  c.current_biomass_kg,
  c.current_abw_gram,
  -- Hitung DOC otomatis dari tanggal tebar
  CASE 
    WHEN c.start_date IS NOT NULL THEN (CURRENT_DATE - c.start_date)
    ELSE 0
  END AS doc
FROM public.ponds p
LEFT JOIN public.cycles c 
  ON c.pond_id = p.id AND c.status = 'Berjalan';

COMMENT ON VIEW public.v_pond_dashboard IS 'Ringkasan kolam + siklus aktif + DOC otomatis untuk dashboard utama';

-- =====================================================
-- VIEW 2: Ringkasan Logbook Harian
-- Gabungan feed logs + probiotic logs + nama kolam
-- =====================================================
CREATE OR REPLACE VIEW public.v_daily_logbook AS
SELECT
  'pakan' AS log_type,
  fl.id,
  fl.cycle_id,
  p.name AS pond_name,
  fl.date,
  fl.feed_amount_kg AS amount,
  'kg' AS unit,
  fl.feed_type AS item_type,
  fl.anco_result,
  fl.notes,
  fl.created_at
FROM public.feed_logs fl
JOIN public.cycles c ON fl.cycle_id = c.id
JOIN public.ponds p ON c.pond_id = p.id

UNION ALL

SELECT
  'probiotik' AS log_type,
  pl.id,
  pl.cycle_id,
  p.name AS pond_name,
  pl.date,
  pl.amount_ml AS amount,
  'ml' AS unit,
  pl.probiotic_type AS item_type,
  NULL AS anco_result,
  pl.notes,
  pl.created_at
FROM public.probiotic_logs pl
JOIN public.cycles c ON pl.cycle_id = c.id
JOIN public.ponds p ON c.pond_id = p.id

ORDER BY created_at DESC;

COMMENT ON VIEW public.v_daily_logbook IS 'Logbook harian gabungan pakan + probiotik untuk halaman Logbook';

-- =====================================================
-- VIEW 3: Riwayat Siklus Panen (untuk pembelajaran AI)
-- =====================================================
CREATE OR REPLACE VIEW public.v_harvest_history AS
SELECT
  c.id AS cycle_id,
  p.user_id,
  p.name AS pond_name,
  p.area_m2,
  c.start_date,
  c.end_date,
  (c.end_date - c.start_date) AS total_days,
  c.initial_shrimp_count,
  c.harvest_biomass_kg,
  c.harvest_abw_gram,
  c.harvest_shrimp_count,
  c.harvest_fcr,
  c.harvest_sr_pct,
  c.total_feed_kg,
  c.notes,
  -- Hitung produktivitas (kg/m²)
  CASE 
    WHEN p.area_m2 > 0 THEN ROUND((c.harvest_biomass_kg / p.area_m2)::numeric, 2)
    ELSE 0
  END AS yield_kg_per_m2
FROM public.cycles c
JOIN public.ponds p ON c.pond_id = p.id
WHERE c.status = 'Selesai' AND c.harvest_biomass_kg IS NOT NULL
ORDER BY c.end_date DESC;

COMMENT ON VIEW public.v_harvest_history IS 'Riwayat panen lengkap. Data ini akan digunakan AI untuk mempelajari performa siklus sebelumnya.';
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












-- Tambahan

-- ============================================================
-- PRIMA - Migration 010
-- Deskripsi: Function helper biar user bisa login pakai USERNAME.
--            Supabase auth wajib email, jadi kita cari email
--            dari username (full_name di metadata) via RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE lower(raw_user_meta_data ->> 'full_name') = lower(trim(p_username))
  ORDER BY created_at ASC
  LIMIT 1;
  RETURN v_email; -- NULL kalau username tidak ditemukan
END;
$$;

COMMENT ON FUNCTION public.get_email_by_username IS
'Helper login: mengembalikan email milik username (full_name saat daftar). Dipakai halaman Masuk.';       