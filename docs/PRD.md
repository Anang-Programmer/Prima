<!-- Product Requirements Document: visi produk, problem, solusi, dan goals -->

# PRD - Product Requirements Document (PRIMA)

> **Versi:** 2.0 (Post-MVP)  
> **Terakhir Diperbarui:** 25 Agustus 2026  
> **Status:** ✅ MVP sudah *live* dan berjalan di production  

---

## 1. Ringkasan Eksekutif

**PRIMA** adalah aplikasi web *Mobile-First* berbasis kecerdasan buatan (AI) yang berfungsi sebagai **asisten manajemen budidaya udang vaname** untuk petambak Indonesia. Aplikasi ini mendigitalisasi seluruh proses pencatatan harian (logbook pakan, probiotik, sampling), memberikan rekomendasi takaran pakan dan dosis probiotik berbasis standar nasional **SNI 8008:2014**, serta membangun ekosistem komunitas antar-petambak.

PRIMA lahir dari temuan riset bahwa **90% petambak di Indonesia tidak memiliki sistem pencatatan terstruktur**, sehingga keputusan pemberian pakan — yang merupakan **60-70% dari total biaya produksi** — hanya mengandalkan *feeling* atau tebak-tebakan. PRIMA hadir untuk mengubah *feeling* menjadi *data-driven decision*.

---

## 2. Latar Belakang & Pernyataan Masalah

### 2.1 Konteks Industri
Budidaya udang vaname adalah salah satu sektor perikanan terbesar di Indonesia. Namun, mayoritas petambak menghadapi tantangan serius:
- **Overfeeding** (pakan berlebih) → Pakan membusuk di dasar kolam, menghasilkan amonia beracun, udang mati massal.
- **Underfeeding** (pakan kurang) → Udang kerdil, lambat besar, panen tidak optimal.
- **Zero-record culture** → Tidak ada catatan terstruktur yang bisa digunakan untuk mengevaluasi kegagalan atau mereplikasi keberhasilan.

### 2.2 Data Validasi (Survei Lapangan)
Dari survei terhadap **20 petambak udang aktif**:

| Temuan | Jumlah |
|--------|--------|
| Petambak yang **rutin** mencatat data (pakan, populasi, probiotik) | **2 dari 20** (10%) |
| Petambak **tanpa** sistem pencatatan terstruktur | **18 dari 20** (90%) |
| Petambak yang mengandalkan sistem **manual tanpa evaluasi** | **20 dari 20** (100%) |

### 2.3 Pain Points Utama
1. **Amnesia Operasional** — Lupa berapa pakan yang sudah diberikan hari ini/kemarin.
2. **Keterbatasan Fokus** — Sistem manual hanya mampu menangani 1 kolam; petambak tipikal punya 2-5 kolam.
3. **Absennya Rekomendasi Ilmiah** — Keputusan berdasarkan *feeling*, bukan standar SNI atau data biomassa.
4. **Tidak Ada Evaluasi Siklus** — Tidak tahu apa yang harus diperbaiki di siklus berikutnya.
5. **Isolasi Sosial** — Petambak bekerja sendiri tanpa wadah berbagi pengalaman.

---

## 3. Solusi: Apa Itu PRIMA?

PRIMA menjawab seluruh *pain points* di atas dengan **lima pilar solusi**:

### Pilar 1: Logbook Digital Cerdas
Pencatatan harian pakan, probiotik, dan sampling dalam hitungan detik lewat UI yang dirancang untuk satu tangan (petambak sering memegang *smartphone* sambil berjalan di pematang tambak).

### Pilar 2: AI Recommendation Engine
Rekomendasi takaran pakan dan dosis probiotik yang dihitung secara otomatis berdasarkan:
- Standar nasional **SNI 8008:2014** (Feeding Rate % per DOC)
- **Biomassa aktual** kolam (dikalkulasi dari data sampling)
- **Riwayat Anco** (indikator nafsu makan udang)
- **Data historis** siklus-siklus sebelumnya yang berhasil (pembelajaran AI)

### Pilar 3: Sistem Alarm & Eskalasi
Timer otomatis untuk cek Anco dan jadwal pakan berikutnya, dilengkapi Push Notification (FCM) dan mekanisme eskalasi jika alarm diabaikan.

### Pilar 4: Evaluasi & Proyeksi Siklus
Dashboard evaluasi performa siklus: FCR, Survival Rate, proyeksi panen, dan riwayat panen lengkap yang bisa dibandingkan antar-siklus.

### Pilar 5: Komunitas Petambak
Forum sosial dalam aplikasi untuk berbagi pengalaman, bertanya, dan saling memberi *insight* antar-sesama petambak.

---

## 4. Target Pengguna

### 4.1 Persona Utama: Petambak Udang Vaname

**Nama Representatif:** Pak Budi (35-55 tahun)

| Aspek | Detail |
|-------|--------|
| **Profil** | Pemilik 2-5 kolam udang vaname |
| **Pendidikan** | SMA hingga S1 |
| **Tech Literacy** | Familiar dengan WhatsApp & YouTube; tidak terlalu *tech-savvy* |
| **Bahasa** | Indonesia (seluruh UI wajib bahasa Indonesia) |
| **Lokasi** | Pesisir pantai Indonesia (Jawa, Sumatera, Sulawesi, Kalimantan) |
| **Kondisi Penggunaan** | Di lapangan (pematang kolam), sering satu tangan, kadang basah/kotor, sinar matahari terik |

### 4.2 Goals Pengguna
- Hemat pakan → Mengurangi overfeeding yang memboroskan 60-70% biaya produksi
- Panen maksimal → Udang besar, tingkat kehidupan tinggi
- Catatan rapi → Bisa mengevaluasi dan mereplikasi siklus sukses
- Belajar dari petambak lain → Akses ke pengalaman kolektif lewat komunitas

### 4.3 Frustrasi Pengguna
- Sulit mengingat jadwal dan takaran harian
- Tidak tahu takaran optimal untuk kondisi spesifik kolamnya
- Tidak punya waktu untuk pencatatan manual yang rumit
- Merasa sendirian menghadapi masalah budidaya

---

## 5. Fitur & Kapabilitas

### 5.1 Fitur yang Sudah Diimplementasikan (MVP Live)

#### A. Autentikasi & Profil
| Fitur | Status | Rute |
|-------|--------|------|
| Registrasi akun | ✅ Live | `/daftar` |
| Login | ✅ Live | `/masuk` |
| Profil pengguna (nama, lokasi, avatar) | ✅ Live | `/profil` |
| Kebijakan Privasi | ✅ Live | `/privasi` |

#### B. Dashboard & Manajemen Kolam
| Fitur | Status | Rute |
|-------|--------|------|
| Dashboard utama (ringkasan semua kolam + Quick Action) | ✅ Live | `/dashboard` |
| Detail kolam (info lengkap + siklus aktif) | ✅ Live | `/kolam/[id]` |
| Buat/Edit/Hapus kolam (Luas, Kedalaman, Bentuk) | ✅ Live | Sheet di `/kolam/[id]` |
| Mulai siklus baru (populasi, tanggal tebar) | ✅ Live | Sheet di `/kolam/[id]` |
| Akhiri siklus + input hasil panen | ✅ Live | Sheet di `/kolam/[id]` |

#### C. Logbook Pakan & Probiotik
| Fitur | Status | Rute |
|-------|--------|------|
| Rekomendasi pakan harian AI (otomatis) | ✅ Live | Kartu Pakan di `/kolam/[id]` |
| Catat pakan harian + jenis + merek | ✅ Live | FeedCard di `/kolam/[id]` |
| Rekomendasi probiotik (dosis, metode, frekuensi) | ✅ Live | Kartu Probiotik di `/kolam/[id]` |
| Catat probiotik + metode aplikasi | ✅ Live | ProbioticCard di `/kolam/[id]` |
| Edit rekomendasi (modifikasi manual) | ✅ Live | FeedEditForm / ProbioticEditForm |
| Konsultasi AI (chat real-time) | ✅ Live | AIChatPanel di `/kolam/[id]` |
| Riwayat log harian (tab Logbook) | ✅ Live | LogBookTab di `/kolam/[id]` |

#### D. Timer, Alarm & Notifikasi
| Fitur | Status | Rute |
|-------|--------|------|
| Timer otomatis cek Anco (countdown) | ✅ Live | Kartu Pakan (timer visual) |
| Input hasil Anco (Habis/Sisa Sedikit/Sisa Banyak) | ✅ Live | AncoModal |
| Push Notification (FCM) untuk alarm pakan/anco | ✅ Live | API `/api/notifikasi` |
| Eskalasi alarm (visual warning jika terlambat respons) | ✅ Live | Field `escalated_at` |
| Halaman notifikasi (lonceng) | ✅ Live | `/notifikasi` |

#### E. Monitoring & Evaluasi
| Fitur | Status | Rute |
|-------|--------|------|
| Sampling (input ABW + SR → kalkulasi biomassa) | ✅ Live | EditAbwSheet / MonitoringTab |
| Grafik pertumbuhan & tren pakan | ✅ Live | MonitoringTab di `/kolam/[id]` |
| Evaluasi FCR real-time | ✅ Live | MonitoringTab |
| Proyeksi panen (estimasi berdasarkan data sampling) | ✅ Live | `/proyeksi` + ProjectionTab |
| Riwayat panen semua siklus | ✅ Live | `/riwayat-panen` |

#### F. Komunitas
| Fitur | Status | Rute |
|-------|--------|------|
| Feed postingan (timeline) | ✅ Live | `/komunitas` |
| Buat postingan (teks + gambar) | ✅ Live | `/komunitas` |
| Like & Komentar | ✅ Live | `/komunitas/[id]` |
| Notifikasi interaksi (like/komentar) | ✅ Live | `/notifikasi` |

#### G. Quick Action (Dashboard)
| Fitur | Status | Rute |
|-------|--------|------|
| Kasih Pakan cepat (konfirmasi 1 tap) | ✅ Live | `/dashboard` |
| Kasih Probiotik cepat | ✅ Live | `/dashboard` |

---

### 5.2 Fitur di Luar Scope (Roadmap Masa Depan)

| Fitur | Prioritas | Catatan |
|-------|-----------|---------|
| Multi-user / role admin | 🟡 Medium | Untuk pemilik tambak yang punya karyawan |
| Monitoring kualitas air (pH, DO, suhu, salinitas) | 🟡 Medium | Membutuhkan integrasi sensor/IoT |
| Integrasi IoT / sensor otomatis | 🔴 Low | Biaya hardware tinggi |
| Marketplace pakan/probiotik | 🔴 Low | Butuh kemitraan bisnis |
| Prediksi harga udang | 🔴 Low | Butuh data pasar real-time |
| Integrasi WhatsApp notification | 🟢 High | Alternatif Push Notification |
| PWA (offline support, install prompt) | 🟢 High | Koneksi internet di tambak sering buruk |
| Camera integration (photo log) | 🟡 Medium | Dokumentasi visual kondisi kolam |
| GPS tagging (lokasi kolam) | 🔴 Low | Nice-to-have |
| Voice input (hands-free logging) | 🟡 Medium | Sangat berguna saat tangan basah |
| Biometric auth (fingerprint/face) | 🔴 Low | Platform-dependent |
| Support jenis udang selain vaname | 🟡 Medium | Windu, galah, dll. |

---

## 6. Arsitektur Tingkat Tinggi

### 6.1 Tech Stack
| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS + Vanilla CSS Variables |
| **Database** | Supabase (PostgreSQL) + Row Level Security |
| **Auth** | Supabase Auth |
| **Push Notification** | Firebase Cloud Messaging (FCM) |
| **AI Consultation** | Google Gemini API (via Server Action) |
| **Hosting** | Vercel |

### 6.2 Pola Arsitektur Kunci
- **Server Components** untuk data fetching (SSR, SEO, kecepatan)
- **Server Actions** untuk semua mutasi database (insert/update/delete)
- **Client Components** hanya untuk interaktivitas murni (form, state, timer, chat)
- **RLS (Row Level Security)** aktif di semua tabel → user hanya bisa akses data miliknya sendiri

---

## 7. Alur Pengguna Utama (User Journeys)

### Journey 1: Siklus Hidup Budidaya
```
Daftar Akun → Buat Kolam (luas, kedalaman, bentuk)
→ Mulai Siklus Baru (jumlah tebar, tanggal)
→ [Harian: Kasih Pakan → Timer Anco → Cek Anco → Catat Hasil]
→ [Mingguan: Sampling → Update ABW & Biomassa]
→ [Periodik: Kasih Probiotik]
→ Akhiri Siklus (input hasil panen)
→ Evaluasi FCR, SR, Yield
→ Mulai Siklus Baru (data historis memperkaya AI)
```

### Journey 2: Hari Biasa di Tambak
```
06:00 — Buka Dashboard → Lihat rekomendasi pakan hari ini
06:15 — Tebar pakan → Tap "Sudah Kasih Pakan" (Quick Action)
06:16 — Timer Anco otomatis menyala (2.5 jam countdown)
08:45 — Push Notification: "Waktunya angkat Anco!"
08:50 — Cek Anco → Input "Habis" → AI pertahankan rekomendasi
12:00 — Jadwal makan siang → Ulangi proses
16:00 — Jadwal makan sore → Ulangi proses
19:00 — Buka Komunitas → Baca tips dari petambak lain
```

---

## 8. Metrik Keberhasilan

### 8.1 Metrik Produk

| Metrik | Target MVP | Status |
|--------|-----------|--------|
| User Registration | 50 petambak | 🟡 In Progress |
| Weekly Active Users (WAU) | 30% dari registrasi | 🟡 In Progress |
| Log Entry per User | Minimal 3x/minggu | 🟡 In Progress |
| User Satisfaction (NPS) | > 30 | 🟡 Belum diukur |

### 8.2 Metrik Teknis

| Metrik | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5 detik (3G) |
| Time to Interactive (TTI) | < 3 detik (3G) |
| Lighthouse Score (Mobile) | > 80 |
| Uptime | > 99.5% |

---

## 9. Asumsi & Dependensi

### 9.1 Asumsi
- User memiliki smartphone Android/iOS dengan akses internet (minimal 3G)
- User familiar dengan penggunaan aplikasi web/mobile dasar (WhatsApp level)
- Budidaya udang vaname (jenis paling umum dan menguntungkan di Indonesia)
- Petambak bersedia meluangkan 2-5 menit/hari untuk input data
- Push Notification cukup untuk mengingatkan jadwal (tanpa butuh SMS/WhatsApp untuk MVP)

### 9.2 Dependensi Eksternal
| Dependensi | Fungsi | Risiko |
|------------|--------|--------|
| Supabase | Database, Auth, Realtime | Rendah (managed service, ada backup) |
| Vercel | Hosting & Deployment | Rendah (high availability) |
| Google Gemini | AI Consultation Chat | Medium (API downtime/quota) |
| Firebase FCM | Push Notification | Rendah (Google infrastructure) |

---

## 10. Acuan Data & Standar Ilmiah

Seluruh logika kalkulasi dan rekomendasi AI bertumpu pada:

1. **SNI 8008:2014** — Standar Nasional Indonesia untuk Budidaya Udang Vaname
   - Feeding Rate (%) per rentang DOC
   - Survival Rate estimasi per fase pertumbuhan
   - Frekuensi pemberian pakan per DOC
   - Waktu cek Anco sesuai umur udang

2. **Kementerian Kelautan dan Perikanan (KKP)**
   - Pedoman budidaya udang vaname
   - Standar produktivitas (yield) per m²

3. **Best Practice Industri**
   - FCR benchmark (ideal 1.0-1.3)
   - CP Prima Feed Management Guide
   - Japfa Comfeed Aquaculture Manual
   - FAO Technical Guidelines for Shrimp Farming

4. **Data Historis Lapangan (Self-Learning)**
   - Tabel `ai_training_data` menyimpan ringkasan siklus berkualitas
   - View `v_ai_ready_dataset` menyediakan dataset bersih untuk referensi AI

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|---------|
| Internet tidak stabil di tambak | User tidak bisa input data | PWA + offline mode (roadmap) |
| Petambak malas input data | Data tidak akurat → rekomendasi salah | Quick Action 1-tap, reminder push |
| Overreliance pada AI | Petambak berhenti berpikir kritis | Tampilkan reasoning + izinkan override manual |
| Kompetitor muncul | Kehilangan user | First-mover advantage + komunitas yang kuat |
| Skalabilitas database | Lambat saat user banyak | Supabase auto-scaling + index optimization |

---

## 12. Glosarium Singkat

| Istilah | Arti |
|---------|------|
| **DOC** | Day of Culture — umur udang sejak tebar benih |
| **ABW** | Average Body Weight — berat rata-rata per ekor (gram) |
| **SR** | Survival Rate — % udang yang masih hidup |
| **FCR** | Feed Conversion Ratio — kg pakan per kg udang (makin kecil makin baik) |
| **FR** | Feeding Rate — % pakan harian terhadap biomassa |
| **Biomassa** | Total berat seluruh udang hidup di kolam (kg) |
| **Anco** | Jaring indikator nafsu makan udang |
| **Benur** | Benih udang yang ditebar di awal siklus |

---

> **Catatan Penutup:**  
> Dokumen PRD ini adalah *living document* yang harus diperbarui seiring evolusi produk. Setiap fitur baru yang ditambahkan harus dirujuk kembali ke *pain points* dan *goals* yang tertera di sini. Jika sebuah fitur tidak menjawab masalah petambak yang nyata, maka fitur itu **tidak perlu dibangun**.
