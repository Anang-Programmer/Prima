<!-- Logika Kalkulasi AI, SNI, Estimasi Pakan, dan Historis -->

# AI-LOGIC — Single Source of Truth (PRIMA)

> **Status:** Dokumen ini mencerminkan logika kalkulasi AKTUAL yang berjalan di *production* (`derive.ts`, `historis.ts`, `feed-calculator.ts`).  
> **Terakhir Diperbarui:** 25 Agustus 2026

---

## 1. Filosofi Logika PRIMA

PRIMA tidak menggunakan model Machine Learning *black-box* yang rumit. Kecerdasan PRIMA dibangun di atas fondasi **Sistem Pakar Berbasis Aturan (Rule-Based Expert System)** yang menggabungkan tiga pilar:

1.  **Standar SNI 8008:2014:** Sebagai *baseline* atau titik awal jika tidak ada data lapangan (0 *knowledge*).
2.  **Evaluasi Aktual (Anco):** Sebagai *multiplier* harian yang merepresentasikan nafsu makan udang *real-time*.
3.  **Data Historis (SSOT - Single Source of Truth):** Sebagai target utama (kalibrasi AI). Jika sebuah siklus masa lalu terbukti sukses di kolam/padat tebar yang sama, PRIMA akan **membuang** standar SNI dan sepenuhnya menyalin takaran pakan dari siklus sukses tersebut.

---

## 2. Fondasi SNI 8008:2014 & Rumus Dasar

Semua fungsi ini berada di `src/lib/feed-calculator.ts`.

### 2.1 Estimasi Pertumbuhan (ABW - Average Body Weight)
Jika petambak belum/malas melakukan sampling jala, PRIMA mengestimasi berat udang (gram) berdasarkan rumus polinomial empiris:

```typescript
ABW (gram) = 0.0005 * DOC^2 + 0.05 * DOC
// DOC 30 = 1.95 gram
// DOC 60 = 4.80 gram
// DOC 90 = 8.55 gram
```

### 2.2 Estimasi Kelulusan Hidup (SR - Survival Rate)
Dianggap linear turun seiring usia jika tidak ada data sampling kematian:

- `DOC 1 - 30` = 95%
- `DOC 31 - 60` = 90%
- `DOC 61 - 90` = 85%
- `DOC > 90` = 80%

### 2.3 Kalkulasi Biomassa & Kebutuhan Pakan (Baseline)
```typescript
Populasi_Hidup = Jumlah_Tebar * (SR_Pct / 100)
Biomassa_Kg = (Populasi_Hidup * ABW_Gram) / 1000

// Faktor Kepadatan (Density Adjustment)
Density = Populasi / Luas_m2
- Jika > 100 ekor/m2 -> Kebutuhan Pakan dikali 1.1 (+10%)
- Jika < 50 ekor/m2  -> Kebutuhan Pakan dikali 0.95 (-5%)
```

### 2.4 Tabel Lengkap Feeding Rate, Frekuensi, & Anco per DOC
Berdasarkan SNI 8008:2014 dan penyesuaian industri yang ada di kode.

| Umur (Hari/DOC) | Feeding Rate (% Biomassa) | Frekuensi | Waktu Cek Anco (Jam) | Jenis Pelet |
|-----------------|---------------------------|-----------|----------------------|-------------|
| 1 - 15          | 20.0%                     | 4x/hari   | 2,0 jam              | Pellet 0.5mm|
| 16 - 30         | 12.5%                     | 4x/hari   | 2,0 jam              | Pellet 0.5mm|
| 31 - 45         | 8.5%                      | 4x/hari   | 2,5 jam              | Pellet 1.0mm|
| 46 - 60         | 6.0%                      | 4x/hari   | 2,25 jam             | Pellet 1.0mm|
| 61 - 90         | 3.5%                      | 4x/hari   | 1,75 jam             | Pellet 1.5mm|
| 91 - 105        | 3.5%                      | 5x/hari   | 1,25 jam             | Pellet 1.5mm|
| 106 - 120       | 2.5%                      | 5x/hari   | 1,25 jam             | Pellet 1.5mm|

---

## 3. Evaluasi Harian (Multiplier Anco)

Anco adalah instrumen validasi utama untuk mengoreksi *Feeding Rate* SNI yang kaku. Logika Anco diproses di `derive.ts`.

### 3.1 Multiplier Nafsu Makan
Saat petambak input hasil cek Anco:
- **"Sisa Banyak"**: Multiplier = `0.75` (Potong dosis pakan per sesi sebesar 25%)
- **"Sisa Sedikit"**: Multiplier = `0.9` (Potong dosis pakan per sesi sebesar 10%)
- **"Habis"**: Multiplier = `1.0` (Dosis tetap)

### 3.2 Jangkar Rahasia AI (Anti-Markup Loop)
PRIMA menyimpan `trueRecommendedFeedKg` (Jangkar Rahasia). 
Ini mencegah *infinite loop* penambahan pakan. Jika petambak secara manual mengedit pakan harian menjadi 50kg (padahal rekomendasi SNI 30kg), lalu Anco *Habis* (Multiplier 1.0), AI tidak akan menambah 50kg itu lagi. AI selalu mengkalkulasi multiplier berdasarkan **Baseline Murni (SNI/Historis) × Anco**.

---

## 4. Logika Historis (SSOT)

Diimplementasikan di `historis.ts`. Inilah letak "Kecerdasan" utama PRIMA.

### 4.1 Syarat Mutlak Pengambilan Data Historis
AI hanya akan menjadikan siklus lama sebagai panutan (menggantikan SNI) JIKA 4 syarat berikut **mutlak terpenuhi**:

1. **Selesai & Lengkap**: Siklus lama berstatus "Selesai", memiliki data Biomassa Panen > 0, dan FCR > 0.
2. **Kepadatan Identik**: Padat tebar (`ekor/m2`) siklus lama **sama persis** dengan siklus saat ini (dibulatkan 1 desimal).
3. **FCR Sehat**: FCR siklus lama harus berada di rentang **0 < FCR < 1.5** *(Catatan: Saat ini 3.0 untuk uji coba/MVP, idealnya 1.5).*
4. **Best FCR Wins**: Jika ada >1 siklus lama yang lolos syarat, AI akan memilih siklus dengan FCR TERENDAH (paling efisien/sukses).

*Jika SATU saja syarat di atas gagal, sistem **fallback total ke SNI**.*

### 4.2 Ekstraksi Pakan Historis (Windowing Mechanism)
Jika siklus panutan ditemukan, AI **tidak** memberikan rata-rata kasar pakan seluruh siklus, melainkan:

- Menggunakan **Window DOC ±3 Hari** dari DOC saat ini.
- *Contoh:* Udang sekarang DOC 40. AI akan mencari riwayat pakan di siklus sukses pada rentang **DOC 37 hingga DOC 43**.
- AI menghitung rata-rata harian pakan di rentang tersebut. Jika kosong, baru menggunakan *fallback* rata-rata seluruh siklus tersebut.

---

## 5. Algoritma Interpolasi ABW (Grafik & Sampling)

Grafik pertumbuhan udang di `derive.ts` menggunakan interpolasi linear agar grafik tetap menyambung meski sampling hanya dilakukan seminggu sekali.

1. **Anchor Points:** Titik `(0,0)` dan titik-titik data sampling nyata dari `samps`.
2. **Anomali Filter:** Udang tidak bisa mengecil. Jika petambak salah input (misal: DOC 40 = 5g, DOC 50 = 3g), titik 3g akan **diabaikan** dari grafik (garis mendatar atau melanjutkan standar).
3. **Masa Depan:** Hari-hari setelah titik sampling terakhir yang diketahui akan bernilai `null` pada *Actual Data*, dan hanya menampilkan garis *Standard (SNI)*.

---

## 6. Proyeksi Pakan & Panen

### 6.1 Hibrida Proyeksi Mingguan
Di Tab "Proyeksi", grafik mingguan menggabungkan Data Historis (Past) dan SNI (Future).
- **Minggu Selesai:** Total Kg pakan yang benar-benar ditebar.
- **Minggu Berjalan:** Total Kg nyata (hari 1 s/d hari ini) **ditambah** (Sisa hari minggu ini × Estimasi SNI hari besok).
- **Minggu Depan:** Murni menggunakan akumulasi SNI untuk 7 hari ke depan.

### 6.2 Estimasi Panen
```typescript
Target_DOC = 120 (default)
Estimasi_Total_Panen_Kg = (Populasi * SR_DOC120 * ABW_DOC120) / 1000
Yield_M2 = Estimasi_Total_Panen_Kg / Luas_Kolam_m2
```

---

## 7. Tabel Lengkap Dosis & Jadwal Probiotik

Berdasarkan fase DOC (`getProbioticSchedule` di `feed-calculator.ts`):

| Umur (DOC) | Fase | Frekuensi | Dosis (per m³ air) | Jenis Default | Metode Aplikasi |
|---|---|---|---|---|---|
| ≤ 30 | Nursery (Pendederan) | 2x / minggu | 2.5 ml | Bacillus spp. | Campur Pakan |
| 31 - 60 | Pembesaran Awal| 2x / minggu | 2.0 ml | Lactobacillus | Ke Air |
| > 60 | Pembesaran | 1x / minggu | 1.5 ml | Mix Bacillus + Lactobacillus | Ke Air |

*(Catatan: Asumsi kedalaman rata-rata kolam untuk perhitungan volume m³ adalah `1.5 meter`)*
