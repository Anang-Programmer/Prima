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
