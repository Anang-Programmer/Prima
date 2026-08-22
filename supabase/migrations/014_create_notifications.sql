-- ============================================================
-- PRIMA - Migration 014
-- Deskripsi: Fitur Notifikasi (dari Komentar & Like)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'LIKE' atau 'COMMENT'
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- TRIGGER UNTUK LIKE
CREATE OR REPLACE FUNCTION notify_post_like() RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
  v_actor_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF v_post_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Dapatkan nama orang yang ngelike dari profil
  SELECT COALESCE(full_name, first_name || ' ' || last_name) INTO v_actor_name FROM public.profiles WHERE id = NEW.user_id;
  IF trim(v_actor_name) = '' OR v_actor_name IS NULL THEN
    v_actor_name := 'Seseorang';
  END IF;

  INSERT INTO public.notifications (user_id, actor_name, type, post_id)
  VALUES (v_post_owner, v_actor_name, 'LIKE', NEW.post_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION notify_post_like();

-- TRIGGER UNTUK COMMENT
CREATE OR REPLACE FUNCTION notify_post_comment() RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF v_post_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, actor_name, type, post_id)
  VALUES (v_post_owner, NEW.author_name, 'COMMENT', NEW.post_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_comment();
