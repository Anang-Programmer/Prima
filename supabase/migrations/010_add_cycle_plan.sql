-- ============================================================
-- PRIMA - Database Migration
-- File: 010_add_cycle_plan.sql
-- Deskripsi: Tambah kolom `plan` (jsonb) & `feed_brand` (text) ke cycles.
--            `plan` menyimpan hasil modifikasi manual/kesepakatan AI untuk
--            pakan & probiotik, contoh:
--            {
--              "feed": { "dailyFeedKg": 25.5, "mealsPerDay": 3, "ancoIntervalHours": 2.0, "brand": "CP" },
--              "prob": { "doseMl": 600, "frequencyPerWeek": 2, "method": "Ke Air", "brand": "Bacillus" }
--            }
-- ============================================================
-- Jalankan query ini SETELAH 009_create_ai_training_data.sql
-- ============================================================

ALTER TABLE public.cycles
  ADD COLUMN IF NOT EXISTS plan JSONB,
  ADD COLUMN IF NOT EXISTS feed_brand TEXT DEFAULT 'Pelet';

COMMENT ON COLUMN public.cycles.plan IS 'Rencana pakan/probiotik hasil modifikasi manual atau kesepakatan AI. NULL = ikut rekomendasi SNI.';
COMMENT ON COLUMN public.cycles.feed_brand IS 'Merk pakan default untuk siklus ini.';
