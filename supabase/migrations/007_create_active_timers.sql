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
  notified BOOLEAN DEFAULT FALSE,
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
