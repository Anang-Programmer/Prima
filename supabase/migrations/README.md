# Database Migrations - Prima

Folder ini berisi file-file SQL yang harus di-*run* di **Supabase SQL Editor** secara berurutan.

## Cara Menjalankan

1. Buka project Supabase Bapak di https://supabase.com/dashboard
2. Klik menu **SQL Editor** di sidebar kiri (ikon terminal `>_`)
3. Copy-paste isi setiap file `.sql` di bawah ini **satu per satu, sesuai urutan nomor**
4. Klik tombol **Run** (atau tekan `Ctrl+Enter`)
5. Pastikan setiap file berhasil (muncul "Success") sebelum lanjut ke file berikutnya

## Urutan File

| No | File | Isi |
|----|------|-----|
| 1 | `001_create_profiles.sql` | Tabel profil user + kolom **is_premium** + auto-create saat user daftar |
| 2 | `002_create_ponds.sql` | Tabel kolam tambak |
| 3 | `003_create_cycles.sql` | Tabel siklus budidaya (tebar - panen) + kolom data panen |
| 4 | `004_create_feed_logs.sql` | Tabel log pemberian pakan + hasil anco |
| 5 | `005_create_probiotic_logs.sql` | Tabel log pemberian probiotik |
| 6 | `006_create_sampling_logs.sql` | Tabel log sampling/timbang udang mingguan |
| 7 | `007_create_active_timers.sql` | Tabel timer/alarm aktif (pakan, anco, probiotik) |
| 8 | `008_create_views.sql` | Views ringkasan untuk dashboard, logbook, dan riwayat panen |
| 9 | `009_create_ai_training_data.sql` | Dataset pelatihan AI + fungsi skor kualitas + filter data jelek |

## Diagram Relasi Antar Tabel

```
auth.users (Supabase Auth)
    │
    ▼
profiles (is_premium, full_name, farm_name, ...)
    │
    ▼
ponds (name, area_m2, depth_m, location, ...)
    │
    ▼
cycles (start_date, end_date, initial_shrimp_count, harvest_data, ...)
    │
    ├──▶ feed_logs (feed_amount_kg, anco_result, ...)
    ├──▶ probiotic_logs (amount_ml, method, ...)
    ├──▶ sampling_logs (total_weight_gram, abw_gram, ...)
    └──▶ ai_training_data (quality_score, quality_grade, is_approved, ...)
              │
              └──▶ v_ai_ready_dataset (VIEW: hanya grade A & B)

ponds ──▶ active_timers (type, due_time, ...)
```

## Keamanan (RLS)

Semua tabel sudah dilengkapi **Row Level Security (RLS)**:
- Setiap user hanya bisa melihat dan mengelola data miliknya sendiri
- API Key yang bocor sekalipun tidak bisa mengakses data user lain
- Policy diterapkan secara *cascading*: `profiles → ponds → cycles → logs`

## Fitur Premium vs Gratis

Logika pembatasan akses berdasarkan kolom `profiles.is_premium`:

| Fitur | Gratis (`is_premium = false`) | Premium (`is_premium = true`) |
|-------|-------------------------------|-------------------------------|
| Jumlah Kolam | Maksimal 1 kolam | Unlimited |
| Log Pakan & Probiotik | ✅ | ✅ |
| Sampling | ✅ | ✅ |
| AI Rekomendasi Pakan | ❌ | ✅ |
| AI Konsultasi | ❌ | ✅ |
| Riwayat Panen & Evaluasi | ❌ | ✅ |

> **Catatan:** Pembatasan ini akan diimplementasikan di level aplikasi (Next.js / Flutter), bukan di level database. Database hanya menyimpan status `is_premium`.
