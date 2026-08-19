# Penjelasan Lengkap: Alur Kerja AI di Aplikasi Prima

---

## 1. Arsitektur Besar: "Dua Otak" Prima

Prima punya **dua lapisan kecerdasan** yang bekerja bersama-sama:

| Lapisan | Nama | Tugas | Teknologi |
|---------|------|-------|-----------|
| **Otak 1** | Kalkulator Deterministik | Menghitung angka pakan & probiotik dari rumus pasti (SNI) | [feed-calculator.ts](file:///F:/Indonesia_Next/Top%2024%20IndonesiaNEXT/mvp/mvp/src/lib/feed-calculator.ts) — murni matematika, tanpa AI |
| **Otak 2** | Konsultan AI (LLM) | Berdiskusi dengan petambak **hanya jika** mereka ingin menyimpang dari rekomendasi SNI | [route.ts](file:///F:/Indonesia_Next/Top%2024%20IndonesiaNEXT/mvp/mvp/src/app/api/ai-konsultasi/route.ts) — memanggil model LLM |

> **Poin penting:** AI (LLM) TIDAK pernah menghitung angka pakan sendiri. Semua angka dasar selalu datang dari rumus SNI di `feed-calculator.ts`. AI hanya berperan sebagai **negosiator** ketika petambak ingin mengubah angka tersebut.

---

## 2. Kapan SNI Dipakai (Selalu!)

Setiap kali petambak membuka halaman kolam, sistem secara otomatis menjalankan fungsi `calculateDailyFeed()` dan `getProbioticSchedule()` dari `feed-calculator.ts`. Fungsi-fungsi ini menggunakan **rumus SNI 8008:2014** untuk menghasilkan:

### Untuk Pakan:
```
Input:  DOC, Jumlah Benur, Luas Kolam, ABW (opsional dari sampling), SR (opsional)
Output: Pakan harian (kg), Frekuensi makan (x/hari), Interval cek anco (jam)
```

### Untuk Probiotik:
```
Input:  DOC, Luas Kolam
Output: Dosis (ml), Frekuensi (x/minggu), Metode (Ke Air / Campur Pakan)
```

Angka-angka ini **langsung ditampilkan** ke petambak sebagai rekomendasi utama. Tidak ada AI (LLM) yang terlibat di tahap ini.

---

## 3. Kapan AI (LLM) Ikut Bermain

AI hanya aktif dalam **satu skenario spesifik**: ketika petambak menekan tombol "Edit" untuk mengubah rekomendasi pakan atau probiotik, DAN angka yang mereka masukkan **menyimpang dari standar SNI**.

### Alur Lengkap (Step by Step):

```
Petambak buka halaman kolam
        │
        ▼
Sistem hitung otomatis (SNI) → Tampilkan rekomendasi
        │
        ▼
Petambak tekan "Edit Pakan" atau "Edit Probiotik"
        │
        ▼
Petambak ubah angka di form (misal: kurangi pakan dari 5kg → 3kg)
        │
        ▼
Petambak tekan "Konfirmasi"
        │
        ▼
┌─ Sistem CEK: Apakah angka baru menyimpang dari SNI? ─┐
│                                                        │
│  TIDAK menyimpang → Langsung simpan ke database        │
│                                                        │
│  YA menyimpang → Tampilkan "Peringatan SNI" (Alert)    │
│       │                                                │
│       ▼                                                │
│  Petambak pilih:                                       │
│    ├─ "Simpan Saja" → Simpan tanpa diskusi AI          │
│    └─ "Konsultasi AI" → Buka chat dengan Prima AI      │
│            │                                           │
│            ▼                                           │
│      Percakapan bolak-balik dengan AI                  │
│            │                                           │
│            ▼                                           │
│      AI dan petambak sepakat (DEAL)                    │
│            │                                           │
│            ▼                                           │
│      Angka kesepakatan disimpan ke database             │
└────────────────────────────────────────────────────────┘
```

### Ambang Batas "Menyimpang" (Threshold):

Untuk **pakan**, dianggap menyimpang jika:
- Jumlah pakan berubah lebih dari **±15%** dari rekomendasi SNI
- Frekuensi makan berbeda dari standar (misal: 4x → 3x)
- Interval cek anco berubah lebih dari **±0.3 jam**

Untuk **probiotik**, dianggap menyimpang jika:
- Dosis berubah lebih dari **±50ml** dari rekomendasi SNI
- Frekuensi berubah (misal: 2x/minggu → 1x/minggu)
- Metode berubah (misal: dari "Ke Air" jadi "Campur Pakan")

---

## 4. Peran Anco dalam Sistem

Anco (nampan cek pakan) saat ini berperan di **dua tempat**:

### 4a. Di Kalkulator SNI (Deterministik)
Sistem menghitung interval waktu cek anco berdasarkan DOC:
- DOC 1-30: Setiap 2 jam
- DOC 31-45: Setiap 2.5 jam
- DOC 46-60: Setiap 2.25 jam
- DOC 61-90: Setiap 1.75 jam
- DOC 91+: Setiap 1.25 jam

### 4b. Di Dokumen AI-LOGIC (Aturan untuk AI)
Ketika petambak mencatat hasil anco, logika berikut **seharusnya** diterapkan:

| Hasil Anco | Aksi AI |
|------------|---------|
| **Habis** | Pertahankan pakan, atau naikkan perlahan sesuai kurva SNI |
| **Sisa Sedikit** | Kurangi pakan 5%-10% untuk sesi berikutnya |
| **Sisa Banyak** | Kurangi pakan 20%-30%, berikan Warning ke petambak |

> [!IMPORTANT]
> **Status Saat Ini:** Logika anco adjustment ini sudah tertulis di dokumen [AI-LOGIC.md](file:///F:/Indonesia_Next/Top%2024%20IndonesiaNEXT/mvp/mvp/docs/AI-LOGIC.md) (Bagian 7.2), tapi implementasinya di kode belum sepenuhnya otomatis. Hasil anco dicatat ke database (`feed_logs.anco_result`), namun belum ada mekanisme otomatis yang mengubah rekomendasi pakan berdasarkan hasil anco tersebut. Ini bisa menjadi salah satu area pengembangan core berikutnya.

---

## 5. Sejauh Mana AI Bisa "Mentoleransi" Penyimpangan dari SNI?

Jawabannya: **AI tidak punya batas keras (hard limit)**. 

Saat ini, AI (LLM) bertindak sebagai **konsultan yang fleksibel**. Ia akan:
1. Menanyakan alasan petambak ingin menyimpang
2. Memberikan saran jalan tengah yang masih masuk akal secara budidaya
3. Menegosiasikan angka sampai kedua pihak sepakat
4. Menghasilkan `DEAL_DATA` (angka final kesepakatan) yang kemudian disimpan ke database

AI tidak pernah memaksa petambak kembali ke angka SNI. Ia hanya memberikan konteks dan peringatan.

---

## 6. Contoh Percakapan: Apa yang Terjadi di Balik Layar

### Skenario: Petambak DOC 45, ingin mengurangi pakan dari 5.2kg → 3kg

#### LANGKAH 1: Sistem kirim ke API `/api/ai-konsultasi`

```json
{
  "type": "pakan",
  "messages": [],
  "pondContext": {
    "doc": 45,
    "population": 100000,
    "area": 500,
    "abw": 3.26,
    "biomass": 293.4
  },
  "sniValues": {
    "dailyFeedKg": 5.2,
    "mealsPerDay": 4,
    "feedingRate": 8.5,
    "ancoHours": 2.5
  },
  "userValues": {
    "dailyFeedKg": 3,
    "mealsPerDay": 4,
    "ancoHours": 2.5
  }
}
```

#### LANGKAH 2: Sistem merakit System Prompt untuk LLM

Inilah pesan yang dikirim ke model AI di balik layar (petambak TIDAK melihat ini):

```
Kamu adalah konsultan budidaya udang vaname bernama "Prima AI". Kamu sedang 
berdiskusi singkat dengan petambak yang ingin mengubah rekomendasi pakan dari 
standar SNI.

KONTEKS KOLAM PETAMBAK:
- DOC (umur pemeliharaan): 45 hari
- Populasi: 100,000 ekor
- Luas kolam: 500 m²
- ABW (berat rata-rata): 3.26 gram
- Biomassa estimasi: 293.4 kg

REKOMENDASI STANDAR:
- Pakan harian: 5.2 kg
- Frekuensi: 4× per hari
- Feeding rate: 8.5%
- Cek anco: 2.5

YANG PETAMBAK INGIN UBAH:
- Pakan harian → 3 kg
- Frekuensi → 4× per hari
- Cek anco → 2.5 jam

ATURAN:
1. Jawab dalam Bahasa Indonesia yang ramah, empatik, dan profesional ...
2. Jangan langsung menutup percakapan atau memaksa "kesepakatan final" di awal ...
3. JIKA petambak meminta saran jalan tengah, berikan saran spesifik ...
4. Diskusikan sampai petambak benar-benar setuju ...
5. HANYA JIKA petambak sudah bilang "setuju", "oke", "deal" ...
6. PENTING: Di baris paling akhir jika SUDAH DEAL, WAJIB sertakan:
   [DEAL_DATA: {"pakan": 0.45, "freq": 4, "anco": 2.0}]
7. Balasan jangan terlalu panjang, gaya bahasa chat (maks 3-4 kalimat).
8. DILARANG KERAS menggunakan format Markdown.
```

#### LANGKAH 3: AI membuka percakapan (pesan pertama otomatis dari sistem, bukan dari LLM)

```
AI: Halo Pak. Saya perhatikan Bapak ingin mengubah total pakan menjadi 3kg 
    (rekomendasi saat ini: 5.2kg). Ada pertimbangan atau keluhan khusus di 
    kolam yang mendasari keputusan ini?
```

#### LANGKAH 4: Petambak membalas

```
Petambak: Udang saya agak lesu Pak, air juga agak keruh. Takut overfeeding.
```

#### LANGKAH 5: AI merespons (ini jawaban dari LLM)

```
AI: Wah kalau udangnya lesu dan air keruh memang bijak untuk sementara 
    mengurangi pakan, Pak. Tapi dari 5.2kg langsung turun ke 3kg itu 
    cukup drastis (turun hampir 40%). Kalau saya sarankan kita coba 
    turunkan bertahap ke 4kg dulu sambil pantau kondisi air. Bagaimana 
    menurut Bapak?
```

#### LANGKAH 6: Petambak setuju

```
Petambak: Oke deal 4kg.
```

#### LANGKAH 7: AI menutup dengan DEAL_DATA

```
AI: Baik Pak, kita sepakat pakan diturunkan ke 4kg per hari ya. Tetap 
    pantau hasil anco dan kondisi air. Kalau membaik, nanti bisa kita 
    naikkan pelan-pelan lagi.

    [DEAL_DATA: {"pakan": 4, "freq": 4, "anco": 2.5}]
```

#### LANGKAH 8: Sistem mengekstrak DEAL_DATA

Kode `extractDeal()` di frontend membaca teks `[DEAL_DATA: {"pakan": 4, "freq": 4, "anco": 2.5}]` dari balasan AI terakhir, lalu men-parse JSON-nya.

#### LANGKAH 9: Simpan ke Database

Angka dari `DEAL_DATA` digunakan untuk meng-update kolom `plan` di tabel `cycles`:
```json
{
  "plan": {
    "feed": {
      "dailyFeedKg": 4,
      "mealsPerDay": 4,
      "ancoIntervalHours": 2.5,
      "brand": "Pelet"
    }
  }
}
```

---

## 7. Fallback AI Provider (Strategi Gratis $0)

Karena proyek ini harus $0, sistem menggunakan **7 provider AI gratis** secara berurutan. Jika provider pertama gagal, otomatis coba yang berikutnya:

| Urutan | Provider | Model |
|--------|----------|-------|
| 1 | Groq | GPT-OSS 120b |
| 2 | Lynx | Gemini 3.5 Flash Thinking |
| 3 | Lynx | Gemini 3.5 Flash |
| 4 | Bynara | Mistral Large |
| 5 | Lynx | Gemini 3.6 Flash |
| 6 | Bynara | Qwen Max |
| 7 | Bynara | DeepSeek V4 |

---

## 8. Ringkasan: Hirarki Keputusan Prima

```
┌──────────────────────────────────────────────────────────┐
│                    HIRARKI KEPUTUSAN                      │
│                                                          │
│  1. FONDASI (Base 1)                                     │
│     → Rumus SNI 8008:2014 (selalu dihitung)              │
│       ↓                                                  │
│  2. KOREKSI ANCO (Base 2)                                │
│     → Hasil cek anco langsung adjust porsi pakan:        │
│       Habis (<10% sisa) = 100%                           │
│       Sisa Sedikit (10-30%) = -10%                       │
│       Sisa Banyak (>30% sisa) = -25%                     │
│       ↓                                                  │
│  3. OVERRIDE PETAMBAK → Petambak boleh ubah manual       │
│       ↓                                                  │
│  4. NEGOSIASI AI → Jika menyimpang >15%, AI berdiskusi   │
│       AI punya KEDUA base (SNI + Anco) sebagai acuan     │
│       Batas toleransi: ±20% dari angka anco-adjusted     │
│       AI TIDAK BISA dibujuk melewati batas ini            │
│       ↓                                                  │
│  5. KESEPAKATAN → Angka final disimpan ke database       │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Status Implementasi

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Koreksi otomatis berdasarkan Anco | ✅ Sudah | Sisa Banyak = -25%, Sisa Sedikit = -10%, Habis = 100% |
| AI baca riwayat anco sebelumnya | ✅ Sudah | 5 sesi anco terakhir dikirim ke prompt AI |
| AI punya 2 base (SNI + Anco) | ✅ Sudah | Kedua base ditampilkan di system prompt |
| Batas toleransi AI | ✅ Sudah | ±20% pakan, ±30% probiotik. AI tidak bisa dibujuk melewati batas |
| Keterangan objektif anco | ✅ Sudah | Setiap pilihan anco ada penjelasan persentase sisa pakan |
| ABW dari sampling real | ✅ Sudah | Jika ada data sampling, ABW real menggantikan estimasi |
| SR dari sampling real | ✅ Sudah | SR dari sampling menggantikan default SNI |
| Density adjustment (+10% / -5%) | ✅ Sudah | Otomatis di calculateDailyFeed() |

