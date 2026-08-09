<!-- Database schema detail: tabel, relasi, field types, dan constraints -->

# DATA-MODEL - Database Schema

## 1. Overview

Database menggunakan **Supabase (PostgreSQL)** dengan Row Level Security (RLS) untuk isolasi data per user.

---

## 2. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │    ponds     │       │   cycles     │
│  (auth.users)│1─────N│              │1─────N│              │
└──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                              N                      N                      N
                       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
                       │  feed_logs   │       │probiotic_logs│       │recommendations│
                       └──────────────┘       └──────────────┘       └──────────────┘
```

---

## 3. Table Definitions

### 3.1 `ponds` - Kolam

Menyimpan data kolam milik user.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | FK ke auth.users |
| name | VARCHAR(100) | NO | - | Nama kolam |
| area_m2 | DECIMAL(10,2) | NO | - | Luas dalam m² |
| depth_m | DECIMAL(4,2) | NO | - | Kedalaman rata-rata (m) |
| location | TEXT | YES | NULL | Lokasi/alamat (opsional) |
| created_at | TIMESTAMPTZ | NO | NOW() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | NOW() | Waktu diupdate |

```sql
CREATE TABLE ponds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  area_m2 DECIMAL(10,2) NOT NULL CHECK (area_m2 > 0 AND area_m2 <= 100000),
  depth_m DECIMAL(4,2) NOT NULL CHECK (depth_m > 0 AND depth_m <= 10),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query by user
CREATE INDEX idx_ponds_user_id ON ponds(user_id);

-- RLS Policy
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ponds" ON ponds
  FOR ALL USING (auth.uid() = user_id);
```

---

### 3.2 `cycles` - Siklus Budidaya

Menyimpan data siklus budidaya per kolam.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| pond_id | UUID | NO | - | FK ke ponds |
| shrimp_count | INTEGER | NO | - | Jumlah tebar |
| shrimp_type | VARCHAR(50) | YES | 'vaname' | Jenis udang |
| start_date | DATE | NO | - | Tanggal mulai |
| end_date | DATE | YES | NULL | Tanggal selesai |
| harvest_weight_kg | DECIMAL(10,2) | YES | NULL | Berat panen (kg) |
| status | VARCHAR(20) | NO | 'active' | active / completed |
| notes | TEXT | YES | NULL | Catatan |
| created_at | TIMESTAMPTZ | NO | NOW() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | NOW() | Waktu diupdate |

```sql
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  shrimp_count INTEGER NOT NULL CHECK (shrimp_count > 0 AND shrimp_count <= 10000000),
  shrimp_type VARCHAR(50) DEFAULT 'vaname',
  start_date DATE NOT NULL,
  end_date DATE,
  harvest_weight_kg DECIMAL(10,2) CHECK (harvest_weight_kg > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cycles_pond_id ON cycles(pond_id);
CREATE INDEX idx_cycles_status ON cycles(status);

-- RLS Policy (via pond ownership)
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD cycles of own ponds" ON cycles
  FOR ALL USING (
    pond_id IN (SELECT id FROM ponds WHERE user_id = auth.uid())
  );
```

---

### 3.3 `feed_logs` - Log Pakan

Menyimpan catatan pemberian pakan dan hasil kontrol anco.

**Spesifikasi Input Form Log Pakan:**
1. **Tanggal & Waktu:** `logged_at` (Tipe: Datetime, Default: Current Time)
2. **Merek/Jenis Pakan:** `feed_type` (Tipe: Text / Dropdown)
3. **Ukuran Pakan:** `feed_size` (Tipe: Dropdown, Nilai: fine crumble / crumble / pelet mm)
4. **Jumlah Pakan:** `amount_kg` (Tipe: Number, Satuan: kg)
5. **Waktu Pemberian:** `feeding_time` (Tipe: Dropdown, Nilai: Pagi / Siang / Sore / Malam)
6. **Feeding Rate:** `feeding_rate_pct` (Tipe: Number, Satuan: %, Opsional, bisa derived dari biomassa)
7. **Kontrol Anco:** `anco_result` (Tipe: Dropdown, Nilai: Habis / Sisa Sedikit / Sisa Banyak)
8. **Catatan:** `notes` (Tipe: Textarea)

> **Standar Alarm / Kontrol Anco (Berdasarkan Umur Udang/DOC):**
> Alarm pengingat untuk mengecek anco otomatis tersetting setelah pemberian pakan:
> - DOC 1 - 30 hari: Tidak ada cek anco
> - DOC 31 - 45 hari: Alarm di 2,0 - 3,0 jam
> - DOC 46 - 60 hari: Alarm di 2,0 - 2,5 jam
> - DOC 61 - 90 hari: Alarm di 1,5 - 2,0 jam
> - DOC 91 - 120 hari: Alarm di 1,0 - 1,5 jam

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| cycle_id | UUID | NO | - | FK ke cycles |
| logged_at | TIMESTAMPTZ | NO | NOW() | Tanggal & waktu pencatatan |
| feed_type | VARCHAR(100)| YES | NULL | Merek/Jenis pakan |
| feed_size | VARCHAR(50) | YES | NULL | Ukuran pakan |
| amount_kg | DECIMAL(10,3) | NO | - | Jumlah pakan (kg) |
| feeding_time | VARCHAR(20) | YES | NULL | Waktu (pagi/siang/sore/malam) |
| feeding_rate_pct| DECIMAL(5,2)| YES | NULL | % Feeding rate (dari biomassa) |
| anco_result | VARCHAR(50) | YES | NULL | Respons anco (Habis/Sisa) |
| notes | TEXT | YES | NULL | Catatan tambahan |

```sql
CREATE TABLE feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feed_type VARCHAR(100),
  feed_size VARCHAR(50),
  amount_kg DECIMAL(10,3) NOT NULL CHECK (amount_kg > 0 AND amount_kg <= 10000),
  feeding_time VARCHAR(20) CHECK (feeding_time IN ('pagi', 'siang', 'sore', 'malam')),
  feeding_rate_pct DECIMAL(5,2) CHECK (feeding_rate_pct >= 0 AND feeding_rate_pct <= 100),
  anco_result VARCHAR(50),
  notes TEXT
);

-- Index
CREATE INDEX idx_feed_logs_cycle_id ON feed_logs(cycle_id);
CREATE INDEX idx_feed_logs_logged_at ON feed_logs(logged_at);

-- RLS Policy (via cycle -> pond ownership)
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD feed_logs of own cycles" ON feed_logs
  FOR ALL USING (
    cycle_id IN (
      SELECT c.id FROM cycles c
      JOIN ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

---

### 3.3a `samplings` - Data Sampling Pertumbuhan

Menyimpan data sampling udang yang digunakan untuk menghitung ABW, Survival Rate, dan Estimasi Biomassa.

**Spesifikasi Input Form Sampling:**
1. **Tanggal Sampling:** `sampled_at` (Tipe: Date/Datetime)
2. **Jumlah Udang Sampel:** `sample_count` (Tipe: Number, Satuan: ekor)
3. **Berat Total Sampel:** `total_weight_g` (Tipe: Number, Satuan: gram)
4. **Survival Rate (SR):** `survival_rate_pct` (Tipe: Number, Satuan: %, Opsional/Estimasi User)
*(ABW, Estimasi Populasi, dan Biomassa akan dihitung otomatis oleh sistem)*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| cycle_id | UUID | NO | - | FK ke cycles |
| sampled_at | TIMESTAMPTZ | NO | NOW() | Waktu sampling |
| sample_count | INTEGER | NO | - | Jumlah sampel udang |
| total_weight_g | DECIMAL(10,2) | NO | - | Total berat sampel (gram) |
| abw_g | DECIMAL(10,2) | YES | NULL | Average Body Weight (gram) - Auto |
| survival_rate_pct | DECIMAL(5,2)| YES | NULL | Survival Rate (%) saat ini |
| estimated_biomass_kg | DECIMAL(10,2) | YES | NULL | Estimasi Biomassa (kg) - Auto |

```sql
CREATE TABLE samplings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sample_count INTEGER NOT NULL CHECK (sample_count > 0),
  total_weight_g DECIMAL(10,2) NOT NULL CHECK (total_weight_g > 0),
  abw_g DECIMAL(10,2) GENERATED ALWAYS AS (total_weight_g / sample_count) STORED,
  survival_rate_pct DECIMAL(5,2) CHECK (survival_rate_pct >= 0 AND survival_rate_pct <= 100),
  estimated_biomass_kg DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_samplings_cycle_id ON samplings(cycle_id);

-- RLS Policy
ALTER TABLE samplings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD samplings of own cycles" ON samplings
  FOR ALL USING (
    cycle_id IN (
      SELECT c.id FROM cycles c
      JOIN ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

---

### 3.4 `probiotic_logs` - Log Probiotik

Menyimpan catatan pemberian probiotik ke air atau pakan.

**Spesifikasi Input Form Log Probiotik:**
1. **Tanggal & Waktu:** `logged_at` (Tipe: Datetime, Default: Current Time)
2. **Jenis/Merek Probiotik:** `probiotic_type` (Tipe: Text / Dropdown)
3. **Metode Aplikasi:** `application_method` (Tipe: Dropdown, Nilai: Ke Air / Melalui Pakan)
4. **Dosis:** `dosage` (Tipe: Number)
5. **Satuan Dosis:** `dosage_unit` (Tipe: Dropdown, Nilai: mL/L air, mL/kg pakan, L/petak, dll)
6. **Jumlah Probiotik:** `amount_ml` (Tipe: Number, Satuan: mL) -> *Bisa dihitung otomatis dari dosis x (volume air atau jumlah pakan)*
7. **Frekuensi Pemberian:** `frequency` (Tipe: Text/Dropdown, Nilai: 1x/minggu, setiap 3 hari, dll)
8. **Waktu Pemberian:** `feeding_time` (Tipe: Dropdown, Nilai: Pagi / Siang / Sore / Malam)
9. **Catatan:** `notes` (Tipe: Textarea)

> **Standar Acuan Dosis (Basis Database Awal):**
> - **Nursery (Pendederan):** 2–4 mL/kg pakan (Metode: Pakan, Frekuensi: Mengikuti pakan)
> - **Pembesaran (Air):** 1–5 mg/L/minggu ATAU 20–40 L/petak (Metode: Air, Frekuensi: 1x/minggu atau tiap 3 hari)
> - **Pembesaran - Panen:** Mengikuti protokol produk.
> *(Catatan: Nilai ini hanya acuan, dosis pasti mengikuti anjuran produk spesifik).*

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| cycle_id | UUID | NO | - | FK ke cycles |
| logged_at | TIMESTAMPTZ | NO | NOW() | Waktu pencatatan |
| probiotic_type | VARCHAR(100)| YES | NULL | Jenis/Merek probiotik |
| application_method| VARCHAR(50) | YES | NULL | Metode (air/pakan) |
| dosage | DECIMAL(10,2) | YES | NULL | Nilai dosis |
| dosage_unit | VARCHAR(20) | YES | NULL | ml/L, ml/kg, L/petak |
| amount_ml | DECIMAL(10,2) | NO | - | Total kuantitas (ml) |
| frequency | VARCHAR(50) | YES | NULL | Frekuensi aplikasi |
| feeding_time | VARCHAR(20) | YES | NULL | Waktu (pagi/siang/dll) |
| notes | TEXT | YES | NULL | Catatan tambahan |

```sql
CREATE TABLE probiotic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  probiotic_type VARCHAR(100),
  application_method VARCHAR(50) CHECK (application_method IN ('ke air', 'melalui pakan')),
  dosage DECIMAL(10,2),
  dosage_unit VARCHAR(20),
  amount_ml DECIMAL(10,2) NOT NULL CHECK (amount_ml > 0),
  frequency VARCHAR(50),
  feeding_time VARCHAR(20) CHECK (feeding_time IN ('pagi', 'siang', 'sore', 'malam')),
  notes TEXT
);

-- Index
CREATE INDEX idx_probiotic_logs_cycle_id ON probiotic_logs(cycle_id);
CREATE INDEX idx_probiotic_logs_logged_at ON probiotic_logs(logged_at);

-- RLS Policy
ALTER TABLE probiotic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD probiotic_logs of own cycles" ON probiotic_logs
  FOR ALL USING (
    cycle_id IN (
      SELECT c.id FROM cycles c
      JOIN ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

---

### 3.5 `recommendations` - Rekomendasi AI

Menyimpan rekomendasi yang di-generate AI.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| cycle_id | UUID | NO | - | FK ke cycles |
| doc | INTEGER | NO | - | Day of Culture |
| recommended_feed_kg | DECIMAL(10,3) | YES | NULL | Rekomendasi pakan |
| recommended_probiotic_ml | DECIMAL(10,2) | YES | NULL | Rekomendasi probiotik |
| reasoning | TEXT | YES | NULL | Penjelasan AI |
| created_at | TIMESTAMPTZ | NO | NOW() | Waktu generate |

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  doc INTEGER NOT NULL CHECK (doc >= 0),
  recommended_feed_kg DECIMAL(10,3) CHECK (recommended_feed_kg >= 0),
  recommended_probiotic_ml DECIMAL(10,2) CHECK (recommended_probiotic_ml >= 0),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_recommendations_cycle_id ON recommendations(cycle_id);
CREATE INDEX idx_recommendations_doc ON recommendations(doc);

-- RLS Policy
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read recommendations of own cycles" ON recommendations
  FOR SELECT USING (
    cycle_id IN (
      SELECT c.id FROM cycles c
      JOIN ponds p ON c.pond_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Only system/service role can insert recommendations
CREATE POLICY "Service role can insert recommendations" ON recommendations
  FOR INSERT WITH CHECK (true);
```

---

## 4. Database Functions

### 4.1 Calculate DOC (Day of Culture)

```sql
CREATE OR REPLACE FUNCTION get_doc(cycle_id UUID)
RETURNS INTEGER AS $$
DECLARE
  start_date DATE;
BEGIN
  SELECT c.start_date INTO start_date
  FROM cycles c
  WHERE c.id = cycle_id;
  
  RETURN CURRENT_DATE - start_date;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER ponds_updated_at
  BEFORE UPDATE ON ponds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. Views

### 5.1 Active Cycles with DOC

```sql
CREATE VIEW active_cycles_view AS
SELECT 
  c.*,
  p.name as pond_name,
  p.area_m2,
  p.user_id,
  CURRENT_DATE - c.start_date as doc
FROM cycles c
JOIN ponds p ON c.pond_id = p.id
WHERE c.status = 'active';
```

### 5.2 Cycle Summary

```sql
CREATE VIEW cycle_summary_view AS
SELECT 
  c.id as cycle_id,
  c.pond_id,
  c.shrimp_count,
  c.start_date,
  c.end_date,
  c.harvest_weight_kg,
  COALESCE(SUM(fl.amount_kg), 0) as total_feed_kg,
  COALESCE(SUM(pl.amount_ml), 0) as total_probiotic_ml,
  COUNT(DISTINCT fl.id) as feed_log_count,
  COUNT(DISTINCT pl.id) as probiotic_log_count
FROM cycles c
LEFT JOIN feed_logs fl ON c.id = fl.cycle_id
LEFT JOIN probiotic_logs pl ON c.id = pl.cycle_id
GROUP BY c.id;
```

---

## 6. Seed Data (Development)

```sql
-- Sample pond
INSERT INTO ponds (user_id, name, area_m2, depth_m) VALUES
  ('USER_UUID_HERE', 'Kolam A1', 500, 1.5),
  ('USER_UUID_HERE', 'Kolam A2', 750, 1.2);

-- Sample cycle
INSERT INTO cycles (pond_id, shrimp_count, start_date, status) VALUES
  ('POND_UUID_HERE', 100000, '2026-07-01', 'active');
```


<!-- Arsitektur sistem, database schema, dan API design -->

# Arsitektur & Data Model

## 1. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes / Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | (TBD - OpenAI / Anthropic / local model) |
| Hosting | Vercel |
| Mobile | WebView wrapper |

---

## 2. Database Schema

### 2.1 Tabel `users`
> Dikelola oleh Supabase Auth (auth.users)

### 2.2 Tabel `ponds` (Kolam)
```sql
CREATE TABLE ponds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  area_m2 DECIMAL(10,2) NOT NULL, -- luas dalam meter persegi
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Tabel `cycles` (Siklus Budidaya)
```sql
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID REFERENCES ponds(id) ON DELETE CASCADE,
  shrimp_count INTEGER NOT NULL, -- jumlah tebar
  start_date DATE NOT NULL,
  end_date DATE, -- null jika masih aktif
  harvest_weight_kg DECIMAL(10,2), -- berat panen (diisi saat tutup siklus)
  status VARCHAR(20) DEFAULT 'active', -- active | completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Tabel `feed_logs` (Log Pakan)
```sql
CREATE TABLE feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  feed_type VARCHAR(100), -- jenis pakan
  feed_size VARCHAR(50), -- ukuran pakan (crumble, pelet)
  amount_kg DECIMAL(10,3) NOT NULL,
  feeding_time VARCHAR(20),
  feeding_rate_pct DECIMAL(5,2),
  anco_result VARCHAR(50),
  notes TEXT
);
```

### 2.4a Tabel `samplings` (Data Sampling)
```sql
CREATE TABLE samplings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  sampled_at TIMESTAMPTZ DEFAULT NOW(),
  sample_count INTEGER NOT NULL,
  total_weight_g DECIMAL(10,2) NOT NULL,
  abw_g DECIMAL(10,2) GENERATED ALWAYS AS (total_weight_g / sample_count) STORED,
  survival_rate_pct DECIMAL(5,2),
  estimated_biomass_kg DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Tabel `probiotic_logs` (Log Probiotik)
```sql
CREATE TABLE probiotic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  probiotic_type VARCHAR(100),
  application_method VARCHAR(50),
  dosage DECIMAL(10,2),
  dosage_unit VARCHAR(20),
  amount_ml DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(50),
  feeding_time VARCHAR(20),
  notes TEXT
);
```

### 2.6 Tabel `recommendations` (Rekomendasi AI)
```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  doc INTEGER NOT NULL, -- Day of Culture
  recommended_feed_kg DECIMAL(10,3),
  recommended_probiotic_ml DECIMAL(10,2),
  reasoning TEXT, -- penjelasan AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Entity Relationship

```
users (1) ──── (N) ponds
ponds (1) ──── (N) cycles
cycles (1) ──── (N) feed_logs
cycles (1) ──── (N) probiotic_logs
cycles (1) ──── (N) recommendations
```

---

## 4. API Endpoints

### Auth (Supabase built-in)
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/signout`

### Ponds
- `GET /api/ponds` — list kolam user
- `POST /api/ponds` — tambah kolam
- `PUT /api/ponds/:id` — update kolam
- `DELETE /api/ponds/:id` — hapus kolam

### Cycles
- `GET /api/ponds/:pondId/cycles` — list siklus
- `POST /api/ponds/:pondId/cycles` — mulai siklus baru
- `PUT /api/cycles/:id` — update/tutup siklus
- `GET /api/cycles/:id/summary` — ringkasan siklus

### Logs
- `GET /api/cycles/:cycleId/logs` — ambil semua log
- `POST /api/cycles/:cycleId/feed-logs` — catat pakan
- `POST /api/cycles/:cycleId/probiotic-logs` — catat probiotik

### AI Recommendations
- `GET /api/cycles/:cycleId/recommendation` — ambil rekomendasi hari ini
- `POST /api/cycles/:cycleId/recommendation/generate` — generate rekomendasi baru

---

## 5. Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard home)
│   │   ├── ponds/
│   │   │   ├── page.tsx (list kolam)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx (detail kolam)
│   │   │   │   └── cycles/
│   │   ├── logbook/
│   │   └── reports/
│   ├── api/
│   │   ├── ponds/
│   │   ├── cycles/
│   │   └── ai/
│   ├── layout.tsx
│   └── page.tsx (landing)
├── components/
│   ├── ui/ (shadcn components)
│   ├── forms/
│   └── charts/
├── lib/
│   ├── supabase/
│   ├── ai/
│   └── utils/
├── hooks/
└── types/
```

---

## 6. Open Questions

- [ ] AI provider mana yang dipakai? (OpenAI, Anthropic, Gemini, atau self-hosted?)
- [ ] Apakah perlu offline support (PWA)?
- [ ] Notifikasi pakai apa? (Browser push, email, atau WhatsApp?)
