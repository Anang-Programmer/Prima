-- ============================================================
-- PRIMA - Migration 015
-- Deskripsi: Kolom escalated_at untuk eskalasi notifikasi timer
--            (timer yang sudah dinotifikasi tapi tidak dikonfirmasi
--            > 2 jam akan dikirim ulang dengan judul "Eskalasi").
-- Rollback: DROP COLUMN aktifkan baris di bawah.
-- ============================================================

ALTER TABLE public.active_timers ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.active_timers.escalated_at IS 'Waktu notifikasi eskalasi terkirim. NULL = belum pernah dieskalasi.';

-- ROLLBACK (jalankan manual bila perlu):
-- ALTER TABLE public.active_timers DROP COLUMN IF EXISTS escalated_at;