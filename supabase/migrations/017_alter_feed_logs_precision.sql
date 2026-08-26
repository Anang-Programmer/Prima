-- Migration: Ubah presisi feed_amount_kg dari NUMERIC(8,2) menjadi NUMERIC(8,3)
-- Agar tidak membulatkan 0.058 (58g) menjadi 0.06 (60g)

-- 1. Hapus view yang bergantung pada kolom feed_amount_kg (CASCADE untuk memastikan bersih)
DROP VIEW IF EXISTS public.v_daily_logbook CASCADE;

-- 2. Ubah presisi kolom menjadi 3 desimal
ALTER TABLE feed_logs
ALTER COLUMN feed_amount_kg TYPE NUMERIC(8,3);

-- 3. Buat ulang view persis seperti aslinya
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

-- 4. Berikan kembali deskripsi dan hak akses standar (untuk berjaga-jaga)
COMMENT ON VIEW public.v_daily_logbook IS 'Logbook harian gabungan pakan + probiotik untuk halaman Logbook';
GRANT SELECT ON public.v_daily_logbook TO anon, authenticated, service_role;
