<!-- Master Technical Specification & Architecture Document -->

# Master SPEC - Technical Specification & Architecture

Dokumen ini adalah **Single Source of Truth** bagi pengembang atau AI Agent yang akan melanjutkan pembangunan sistem ini. Dokumen ini mendefinisikan arsitektur, siklus eksekusi (execution loops), alur data, dan pedoman pengembangan.

---

## 1. Product Vision & Scope
Sistem manajemen budidaya udang berbasis AI yang berfungsi sebagai *Decision Support System* untuk petambak. Sistem mendigitalisasi logbook (pakan, probiotik, sampling) dan secara otomatis mengkalkulasi rekomendasi harian berdasarkan standar SNI 8008:2014 dan hasil evaluasi riil di lapangan (Anco).

---

## 2. System Architecture & Tech Stack

Sistem ini adalah web-based application (Mobile-First approach) dengan spesifikasi:

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS + UI/UX Custom Variables (Lihat `UI-GUIDE.md`)
*   **Database & Backend:** Supabase (PostgreSQL) + Supabase Auth
*   **Data Fetching:** Next.js Server Components & Server Actions

---

## 3. Core Execution Loops (Siklus Eksekusi)

Arsitektur aplikasi ini berpusat pada **3 Execution Loops** utama. Agent/Developer harus memastikan aliran data di siklus ini berjalan sempurna.

### Loop 1: The Lifecycle (Siklus Makro)
Mengatur umur hidup satu siklus budidaya di sebuah kolam.
1.  **Start:** `cycles` baru dibuat dengan status `active`. Input awal: `shrimp_count` (Populasi awal) & `start_date`.
2.  **Run:** DOC (Day of Culture) dihitung secara dinamis dari `start_date` vs `Current Date`.
3.  **End:** Status `completed`, input `harvest_weight_kg`. Sistem melakukan evaluasi (Kalkulasi FCR final & Survival Rate final).

### Loop 2: The Weekly Calibration (Siklus Mingguan / Sampling)
Mengkalibrasi ulang asumsi dasar dari AI.
1.  **Action:** Petambak menjaring udang secara acak.
2.  **Input:** User mengisi `sample_count` (misal 100 ekor) dan `total_weight_g` (misal 500g).
3.  **Calculation:** Sistem menghitung `ABW` (Average Body Weight) = 5g/ekor.
4.  **Recalibration:** Sistem mengalikan `ABW` * (`Populasi Awal` * `SR`) = **Biomassa Aktual**.
5.  **Output:** Biomassa aktual ini mem-bypass estimasi teoretis dan menjadi basis hitungan pakan harian AI yang baru.

### Loop 3: The Daily Feeding & Anco Loop (Siklus Harian)
Denyut nadi utama sistem yang dieksekusi 4-5x sehari.
1.  **Recommendation:** AI menyarankan takaran pakan hari ini (Berdasarkan Biomassa * Feeding Rate % dari SNI).
2.  **Execution (Log):** User memberi makan udang, lalu menginput aktual pakan yang ditebar ke `feed_logs`.
3.  **Anco Trigger:** Begitu form di-submit, sistem menyalakan Countdown Alarm (1 - 3 jam, tergantung DOC).
4.  **Feedback (Anco Result):** Alarm berbunyi, user mengecek Anco dan menginput hasilnya ke sistem ("Habis", "Sisa Sedikit", "Sisa Banyak").
5.  **AI Adjustment:** Jika sisa banyak, AI langsung memotong rekomendasi target pakan di jadwal makan selanjutnya (Dynamic Adjustment).

---

## 4. AI Recommendation Engine (The Brain)

Logika AI (Selengkapnya lihat `AI-LOGIC.md`) berjalan dengan hirarki berikut:
1.  **Baseline (SNI 8008:2014):** Mencari Feeding Rate (FR) % berdasarkan rentang DOC.
2.  **Volume/Biomass Multiplier:** Mengalikan FR dengan Estimasi Biomassa.
3.  **Environmental Modifier:** Menerapkan penalti/bonus berdasarkan input Anco terakhir atau kepadatan tebar abnormal.
4.  **Probiotic Rules:** Nursery (< DOC 30) = Campur ke pakan. Pembesaran = Tebar ke air (berdasarkan kubikasi/luas * kedalaman).

---

## 5. Database Schema Map

Relasi tabel (Selengkapnya lihat `DATA-MODEL.md`):
*   `users` (1) ---> (M) `ponds` (Menyimpan `area_m2`, `depth_m`)
*   `ponds` (1) ---> (M) `cycles` (Mencatat status budidaya, DOC)
*   `cycles` (1) ---> (M) `samplings` (Menghitung ABW & Biomassa)
*   `cycles` (1) ---> (M) `feed_logs` (Mencatat input pakan harian + status Anco)
*   `cycles` (1) ---> (M) `probiotic_logs` (Mencatat aplikasi probiotik & metode)

---

## 6. AI Agent Directives (Instruksi Pengembangan)

Jika Anda adalah AI Agent yang membaca ini untuk melakukan coding, **patuhi instruksi mutlak berikut:**

1.  **Next.js 16 App Router Paradigm:**
    *   Gunakan Server Components (`layout.tsx`, `page.tsx`) secara *default* untuk data fetching dari Supabase demi kecepatan dan SEO (jika ada).
    *   Gunakan Client Components (`"use client"`) **HANYA** di bagian daun interaktif (seperti tombol submit, forms, state untuk alarm anco, dan grafik Chart.js).
2.  **Mutations:** Gunakan **Server Actions** untuk insert data ke `feed_logs`, `samplings`, dsb. Jangan gunakan `api/` route tradisional kecuali dibutuhkan oleh integrasi eksternal.
3.  **Mobile-First CSS:** Implementasikan UI dengan asumsi layar HP. Layout Desktop adalah bonus/enhancement. Gunakan Tailwind CSS (selalu referensi warna di `UI-GUIDE.md`: Biru Muda `#56C1CD`, Tosca `#0A4D58`, Gelap `#002530`).
4.  **Atomic Components:** Pecah komponen. Jangan ada komponen UI yang mencapai lebih dari 250 baris. Pisahkan form logic ke custom hooks jika diperlukan.
5.  **No Mock Data in Production:** Langsung sambungkan ke Supabase schema yang sudah ada. Validasi skema input form menggunakan Zod.
6.  **RLS (Row Level Security):** Semua query database harus asumsikan bahwa RLS aktif. Jangan pernah bypass `user_id` context.

---

## 7. Development Roadmap

- [ ] Fase 1: Setup Supabase Database Schema & RLS.
- [ ] Fase 2: Auth Flow & Dashboard Kolam (CRUD Kolam & Siklus).
- [ ] Fase 3: Logbook UI (Form Input Pakan, Probiotik, Sampling).
- [ ] Fase 4: Implementasi AI Calculation Module (Backend Logic).
- [ ] Fase 5: Sistem Alarm Anco & Push Notifications.
- [ ] Fase 6: Halaman Evaluasi & Grafik Pertumbuhan.
