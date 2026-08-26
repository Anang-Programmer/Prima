# PRIMA - Asisten Manajemen Budidaya Udang Vaname Berbasis AI

[PRIMA] <!-- Update with your actual logo path if needed -->

**PRIMA** (*Precision Resource Intelligence & Management for Aquaculture*) adalah aplikasi web *Mobile-First* berbasis kecerdasan buatan (AI) yang berfungsi sebagai **asisten manajemen budidaya udang vaname** untuk petambak Indonesia. Aplikasi ini mendigitalisasi seluruh proses pencatatan harian (logbook pakan, probiotik, sampling), memberikan rekomendasi takaran pakan dan dosis probiotik berbasis standar nasional **SNI 8008:2014**, serta membangun ekosistem komunitas antar-petambak.

PRIMA hadir untuk mengubah pola pikir petambak dari sekadar mengandalkan *feeling* menjadi *data-driven decision* guna mencegah *overfeeding*, *underfeeding*, dan kerugian operasional lainnya.

---

## Pilar Solusi Utama

1. **Logbook Digital Cerdas**  
   Pencatatan harian pakan, probiotik, dan sampling dalam hitungan detik dengan antarmuka yang dirancang khusus untuk kemudahan penggunaan satu tangan di lapangan.
2. **AI Recommendation Engine**  
   Rekomendasi takaran pakan dan dosis probiotik otomatis berdasarkan standar **SNI 8008:2014**, biomassa aktual kolam, riwayat Anco, dan data historis siklus sukses sebelumnya.
3. **Sistem Alarm & Eskalasi**  
   Timer otomatis untuk cek Anco dan jadwal pakan dilengkapi Push Notification, memastikan petambak selalu tepat waktu.
4. **Evaluasi & Proyeksi Siklus**  
   Dashboard cerdas untuk memantau nilai FCR, Survival Rate, proyeksi panen, serta membandingkan riwayat siklus panen.
5. **Komunitas Petambak**  
   Forum sosial terintegrasi untuk berbagi *insight*, bertanya, dan memecahkan masalah budidaya bersama.

---

## Fitur Aplikasi (MVP)

- **Manajemen Kolam & Siklus:** Buat kolam, atur luas/kedalaman, dan catat siklus tebar hingga panen.
- **Rekomendasi Pakan & Probiotik AI:** Kalkulasi otomatis kebutuhan harian berdasarkan umur (DOC), populasi, dan sampling (ABW).
- **Konsultasi AI Real-time:** Diskusi interaktif dengan "Prima AI" untuk memodifikasi rekomendasi standar berdasarkan kondisi lapangan yang spesifik.
- **Timer & Notifikasi Cek Anco:** Fitur hitung mundur waktu cek pakan dan pencatatan hasil anco.
- **Monitoring Pertumbuhan:** Grafik dan evaluasi FCR *real-time*, proyeksi panen, dan riwayat komprehensif.
- **Forum Sosial:** Interaksi antar-petambak untuk berbagi tips dan pengalaman budidaya udang vaname.

---

## Tech Stack

Proyek ini dikembangkan menggunakan teknologi web modern:
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Realtime)
- **AI Integration:** Groq / Gemini (via API Route khusus AI)
- **Icons & UI:** Lucide React, Radix UI

---

## Memulai Development

Ikuti langkah-langkah berikut untuk menjalankan PRIMA di komputer lokal Anda:

### 1. Persiapan Environment
Pastikan Anda sudah menginstal Node.js dan package manager (npm, yarn, atau pnpm).
Buat file `.env.local` di root direktori dengan menyalin dari `.env.example` (jika ada) dan isi kredensial Supabase serta API Keys untuk AI:
```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
GROQ_API_KEY="your-groq-api-key"
LYNX_API_KEY="your-lynx-api-key"
```

### 2. Install Dependensi
```bash
pnpm install
```

### 3. Jalankan Server Dev
```bash
pnpm run dev
# atau gunakan Turbopack untuk performa lebih cepat:
pnpm run dev --turbopack
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## Dokumentasi Lengkap
Untuk pemahaman lebih mendalam tentang arsitektur, basis data, dan aturan logika AI dari PRIMA, Anda dapat membaca berbagai dokumen teknis di dalam folder `/docs`:
- `PRD.md` - Product Requirements Document
- `API.md` - Struktur API & Integrasi
- `UI-GUIDE.md` - Panduan Desain & UI
- `DATA-MODEL.md` - Skema Database Supabase
- `AI-LOGIC.md` - Aturan kalkulasi & prompt sistem AI

---

> Dibuat untuk membawa inovasi teknologi ke tambak udang seluruh Nusantara. 🦐🇮🇩
