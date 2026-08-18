-- ============================================================
-- PRIMA - Migration 013
-- Deskripsi: Fitur Komunitas (postingan, like, komentar)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',      -- denormalized (RLS profiles privat)
  avatar_url TEXT DEFAULT '',
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);

-- RLS: feed publik untuk semua user login; tulis/hapus hanya milik sendiri
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view posts"  ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own posts"   ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"   ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"   ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like"               ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike"             ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view comments"    ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments"      ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"      ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- View feed + jumlah like/komentar
CREATE OR REPLACE VIEW public.v_posts WITH (security_invoker = true) AS
SELECT p.*,
  (SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id)::int AS likes_count,
  (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id)::int AS comments_count
FROM public.posts p;

-- Seed demo (persis screenshot) kalau feed masih kosong
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.posts LIMIT 1) THEN
    INSERT INTO public.posts (user_id, author_name, content, created_at) VALUES
    ('00000000-0000-0000-0000-000000000001','Mahmud','Panen kemarin 4.2 ton dari 600m2. ABW 18gr, FCR 1.35. Pakai probiotik Bacillus sp sejak hari ke-7, cleaning 2x seminggu rutin.','2026-08-15 16:05:00+07'),
    ('00000000-0000-0000-0000-000000000001','Mahmud','Panen kemarin 4.2 ton dari 600m2. ABW 18gr, FCR 1.35. Pakai probiotik Bacillus sp sejak hari ke-7, cleaning 2x seminggu rutin.','2026-08-15 16:05:00+07'),
    ('00000000-0000-0000-0000-000000000001','Mahmud','Panen kemarin 4.2 ton dari 600m2. ABW 18gr, FCR 1.35. Pakai probiotik Bacillus sp sejak hari ke-7, cleaning 2x seminggu rutin.','2026-08-15 16:05:00+07');
  END IF;
END $$;