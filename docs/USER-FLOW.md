<!-- Alur pengguna aplikasi dari awal hingga akhir -->

# USER-FLOW - Alur Pengguna

## 1. Overview

Dokumen ini menjelaskan alur pengguna (user flow) untuk setiap skenario utama dalam aplikasi.

---

## 2. Flow Diagram Legend

```
[Screen]     = Halaman/layar
(Action)     = Aksi user
{Decision}   = Kondisi/percabangan
→            = Arah flow
```

---

## 3. Authentication Flow

### 3.1 Register (Pengguna Baru)

```
[Landing Page]
    ↓
(Klik "Daftar")
    ↓
[Register Page]
    ↓
(Isi email, password, nama)
    ↓
(Klik "Daftar")
    ↓
{Email valid?}
    ├── Ya → [Verifikasi Email] → (Klik link) → [Login Page]
    └── Tidak → (Tampilkan error, coba lagi)
```

### 3.2 Login

```
[Landing Page]
    ↓
(Klik "Masuk")
    ↓
[Login Page]
    ↓
(Isi email, password)
    ↓
(Klik "Masuk")
    ↓
{Credentials valid?}
    ├── Ya → {Punya kolam?}
    │         ├── Ya → [Dashboard]
    │         └── Tidak → [Onboarding - Tambah Kolam]
    └── Tidak → (Tampilkan error, coba lagi)
```

### 3.3 Logout

```
[Any Page]
    ↓
(Klik menu profil)
    ↓
(Klik "Keluar")
    ↓
[Landing Page]
```

---

## 4. Onboarding Flow (Pengguna Baru)

```
[Login sukses - user baru]
    ↓
[Onboarding Step 1: Welcome]
    ↓
(Klik "Mulai")
    ↓
[Onboarding Step 2: Tambah Kolam Pertama]
    ↓
(Isi nama kolam, luas, kedalaman air)
    ↓
(Klik "Simpan")
    ↓
[Onboarding Step 3: Mulai Siklus]
    ↓
(Isi jumlah tebar, tanggal mulai)
    ↓
(Klik "Mulai Siklus")
    ↓
[Dashboard - Ready to use]
```

---

## 5. Daily Flow (Penggunaan Harian)

### 5.1 Melihat Rekomendasi & Mencatat Pakan

```
[Dashboard]
    ↓
(Lihat ringkasan semua kolam)
    ↓
(Klik kolam yang ingin dicek)
    ↓
[Detail Kolam]
    ↓
(Lihat rekomendasi pakan hari ini dari AI)
    ↓
(Klik "Catat Pakan")
    ↓
[Form Catat Pakan]
    ↓
(Isi jumlah pakan, ukuran pakan)
    ↓
(Klik "Simpan")
    ↓
[Sistem Set Alarm Anco - Otomatis]
    ↓
(Menunggu 1.5 - 3 Jam)
    ↓
[Notifikasi Cek Anco Muncul]
    ↓
(Klik Notifikasi / Isi Form Hasil Anco)
    ↓
(Pilih Status Anco: Habis/Sisa Sedikit/Banyak)
    ↓
[Detail Kolam - AI update rekomendasi berikutnya]
```

### 5.2 Mencatat Probiotik

```
[Detail Kolam]
    ↓
(Klik "Catat Probiotik")
    ↓
[Form Catat Probiotik]
    ↓
(Pilih Merek/Jenis Probiotik)
    ↓
(Pilih Metode: Ke Air / Campur Pakan)
    ↓
(Isi dosis & total mL)
    ↓
(Klik "Simpan")
    ↓
[Detail Kolam - Log terupdate]
```

### 5.3 Mencatat Pertumbuhan (Sampling)

```
[Detail Kolam]
    ↓
(Klik "Catat Sampling")
    ↓
[Form Catat Sampling]
    ↓
(Isi jumlah udang terjaring & total berat)
    ↓
(Isi estimasi Survival Rate - opsional)
    ↓
(Klik "Simpan")
    ↓
[Sistem Otomatis Hitung ABW & Biomassa]
    ↓
[Detail Kolam - Target Pakan AI Terkalibrasi Ulang]
```

### 5.4 Melihat Riwayat Log

```
[Detail Kolam]
    ↓
(Klik tab "Logbook")
    ↓
[Logbook View]
    ↓
(Filter by tanggal/minggu)
    ↓
(Lihat riwayat pakan & probiotik)
```

---

## 6. Pond Management Flow

### 6.1 Tambah Kolam Baru

```
[Dashboard]
    ↓
(Klik "+ Tambah Kolam")
    ↓
[Form Tambah Kolam]
    ↓
(Isi nama kolam)
    ↓
(Isi luas kolam & kedalaman rata-rata)
    ↓
(Klik "Simpan")
    ↓
[Dashboard - Kolam baru muncul]
```

### 6.2 Edit Kolam

```
[Detail Kolam]
    ↓
(Klik icon "Edit")
    ↓
[Form Edit Kolam]
    ↓
(Ubah nama/luas/kedalaman)
    ↓
(Klik "Simpan")
    ↓
[Detail Kolam - Data terupdate]
```

### 6.3 Hapus Kolam

```
[Detail Kolam]
    ↓
(Klik icon "Hapus")
    ↓
[Konfirmasi Dialog]
    ↓
{Konfirmasi?}
    ├── Ya → [Dashboard - Kolam terhapus]
    └── Tidak → [Detail Kolam]
```

---

## 7. Cycle Management Flow

### 7.1 Mulai Siklus Baru

```
[Detail Kolam - Tidak ada siklus aktif]
    ↓
(Klik "Mulai Siklus Baru")
    ↓
[Form Mulai Siklus]
    ↓
(Isi jumlah tebar udang)
    ↓
(Pilih tanggal mulai)
    ↓
(Klik "Mulai")
    ↓
[Detail Kolam - Siklus aktif dimulai]
    ↓
(AI generate rekomendasi awal)
```

### 7.2 Akhiri Siklus (Panen)

```
[Detail Kolam - Siklus aktif]
    ↓
(Klik "Akhiri Siklus")
    ↓
[Form Akhiri Siklus]
    ↓
(Isi tanggal panen)
    ↓
(Isi berat panen total - kg)
    ↓
(Opsional: catatan)
    ↓
(Klik "Selesai")
    ↓
[Evaluasi Siklus]
    ↓
(Lihat ringkasan performa)
    ↓
(Lihat perbandingan dengan siklus sebelumnya)
    ↓
{Mulai siklus baru?}
    ├── Ya → [Form Mulai Siklus]
    └── Tidak → [Detail Kolam]
```

### 7.3 Lihat Riwayat Siklus

```
[Detail Kolam]
    ↓
(Klik tab "Riwayat Siklus")
    ↓
[Daftar Siklus Sebelumnya]
    ↓
(Klik siklus tertentu)
    ↓
[Detail Siklus Lama]
    ↓
(Lihat log, evaluasi, rekomendasi saat itu)
```

---

## 8. AI Recommendation Flow

### 8.1 Lihat Rekomendasi Harian

```
[Detail Kolam - Siklus Aktif]
    ↓
(Sistem otomatis tampilkan rekomendasi)
    ↓
[Recommendation Card]
    ├── Rekomendasi pakan: X kg
    ├── Rekomendasi probiotik: Y ml
    ├── DOC (Day of Culture): Z hari
    └── Penjelasan AI
```

### 8.2 Refresh Rekomendasi

```
[Detail Kolam]
    ↓
(Klik "Refresh Rekomendasi")
    ↓
(AI re-calculate berdasarkan data terbaru)
    ↓
[Recommendation Card - Updated]
```

---

## 9. Report & Evaluation Flow

### 9.1 Lihat Laporan Siklus

```
[Detail Kolam]
    ↓
(Klik "Laporan")
    ↓
[Report Page]
    ↓
(Pilih siklus)
    ↓
[Laporan Siklus]
    ├── Total pakan yang digunakan
    ├── Total probiotik yang digunakan
    ├── FCR (Feed Conversion Ratio)
    ├── Survival Rate (jika data tersedia)
    └── Grafik pemberian pakan harian
```

### 9.2 Export Laporan (Nice to Have)

```
[Laporan Siklus]
    ↓
(Klik "Export")
    ↓
(Pilih format: PDF/Excel)
    ↓
(Download file)
```

---

## 10. Notification Flow

### 10.1 Reminder Pakan

```
(Waktu jadwal pakan tiba)
    ↓
[Browser Notification]
    ↓
(User klik notifikasi)
    ↓
[Detail Kolam - Form Catat Pakan]
```

---

## 11. Screen List Summary

| No | Screen | Deskripsi |
|----|--------|-----------|
| 1 | Landing Page | Halaman depan, CTA login/register |
| 2 | Login Page | Form login |
| 3 | Register Page | Form register |
| 4 | Dashboard | Overview semua kolam |
| 5 | Onboarding | Setup awal untuk user baru |
| 6 | Detail Kolam | Info kolam, siklus aktif, rekomendasi |
| 7 | Form Tambah/Edit Kolam | Input data kolam |
| 8 | Form Mulai Siklus | Input data siklus baru |
| 9 | Form Akhiri Siklus | Input data panen |
| 10 | Form Catat Pakan | Input log pakan |
| 11 | Form Catat Probiotik | Input log probiotik |
| 12 | Logbook | Riwayat log harian |
| 13 | Evaluasi Siklus | Ringkasan performa |
| 14 | Laporan | Detail report + grafik |
| 15 | Settings | Pengaturan akun |


---

## 12. Error & Edge Case Flows

### 12.1 Password Reset
```n[Login Page] -> (Klik Lupa Password) -> [Reset Page] -> (Isi email) -> [Success]
```

