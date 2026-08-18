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
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
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
