<!-- Master Technical Specification & Architecture Document -->

# Master SPEC - Technical Specification & Architecture (PRIMA)

Dokumen ini adalah **Single Source of Truth (SSOT)** dan peta komprehensif bagi pengembang atau AI Agent yang akan membangun, merawat, atau memperluas ekosistem **PRIMA (Sistem Manajemen Budidaya Udang Cerdas)**. Dokumen ini merangkum seluruh arsitektur, siklus eksekusi (execution loops), skema data tingkat tinggi, dan panduan mutlak bagi AI Agent.

---

## 1. Product Vision & Scope
PRIMA adalah aplikasi *Mobile-First* berbasis AI yang bertindak sebagai **Decision Support System (Sistem Pendukung Keputusan)** bagi petambak udang. Sistem mendigitalisasi logbook (pakan, probiotik, sampling), menghubungkan petambak dalam forum komunitas, mengelola alarm/timer secara *real-time*, dan secara otomatis memberikan rekomendasi harian (serta konsultasi AI) berdasarkan standar **SNI 8008:2014** dipadukan dengan performa historis aktual di lapangan.

---

## 2. System Architecture & Tech Stack

Sistem ini adalah *web-based application* dengan arsitektur modern yang mengedepankan performa dan UX kelas atas (Terinspirasi dari presisi desain Apple, lihat `DESIGN.md`).

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS + Vanilla CSS (Variables `UI-GUIDE.md`)
*   **Database & Backend:** Supabase (PostgreSQL) + Supabase Auth
*   **Real-time & Push:** Supabase Realtime (untuk chat AI) + Firebase Cloud Messaging (FCM)
*   **Data Fetching:** Next.js Server Components, Server Actions (Mutations), dan SWR/React Query jika perlu sinkronisasi *client-side*.

---

## 3. Core Execution Loops (Denyut Nadi Sistem)

Arsitektur aplikasi berpusat pada **5 Execution Loops** utama. Pastikan aliran data di siklus ini berjalan tanpa hambatan.

### Loop 1: The Macro Lifecycle (Siklus Budidaya)
Mengatur umur hidup satu siklus tebar hingga panen.
1.  **Start:** `cycles` baru dibuat dengan status `Berjalan`. Sistem menerima populasi awal (`initial_shrimp_count`) & `start_date`.
2.  **Run:** DOC (Day of Culture) dihitung dinamis (`Current Date` - `start_date`).
3.  **End:** Status menjadi `Selesai`, input `harvest_biomass_kg`. Sistem mengevaluasi FCR final & Survival Rate (SR). Jika siklus berkualitas (Grade A/B), data ini diserap ke `ai_training_data` untuk pembelajaran AI di masa depan.

### Loop 2: The Weekly Calibration (Siklus Kalibrasi/Sampling)
Mengkalibrasi ulang asumsi dasar dari AI setiap minggu.
1.  **Action:** Petambak menjaring udang secara acak.
2.  **Input:** User mengisi `sample_count` (mis. 100 ekor) dan `total_weight_gram` (mis. 500g) ke tabel `sampling_logs`.
3.  **Calculation:** Sistem menghitung `ABW` (Average Body Weight) = 5g/ekor.
4.  **Recalibration:** Sistem menyesuaikan Biomassa Aktual berdasarkan perhitungan populasi bertahan hidup vs ABW. Angka ini mem-bypass estimasi teoretis AI untuk jadwal pakan berikutnya.

### Loop 3: The Daily Feeding, Probiotic & Anco Loop (Siklus Harian)
Denyut nadi utama yang dieksekusi 4-5x sehari.
1.  **Recommendation:** AI menyarankan takaran pakan/probiotik hari ini berdasarkan Biomassa, SNI, dan `plan` modifikasi yang tersimpan di `cycles`.
2.  **Execution:** User mencatat tebar pakan ke `feed_logs` atau probiotik ke `probiotic_logs`.
3.  **Timer & Alarm:** Sistem menyimpan jadwal pengecekan Anco/Pakan berikutnya ke tabel `active_timers`.
4.  **Feedback (Anco Result):** Alarm berbunyi, user mengecek Anco dan menginput hasilnya ("Habis", "Sisa Sedikit", dsb).
5.  **AI Adjustment:** Jika Anco bersisa, sistem menyarankan pemotongan pakan (Dynamic Adjustment).

### Loop 4: The Push Notification & Escalation Engine (Siklus Alarm)
Sistem peringatan ketat agar jadwal tidak terlewat.
1.  **Trigger:** `active_timers` jatuh tempo (`due_time`).
2.  **Push:** Sistem (via cron/background task) mengecek FCM `device_tokens` user dan menembakkan notifikasi. Tabel `active_timers` ditandai `notified = true`.
3.  **Escalation:** Jika lewat batas toleransi (misal 30 menit) belum dicek, field `escalated_at` terisi, memberi visual peringatan bahaya ("Terlambat Merespons") di UI.

### Loop 5: The Social & Knowledge Sharing (Siklus Komunitas)
Petambak tidak bekerja sendiri.
1.  **Post & Ask:** User membuat *post* di tabel `posts`.
2.  **Engage:** Interaksi masuk ke `post_likes` dan `post_comments`.
3.  **Alert:** Interaksi tersebut memicu catatan di tabel `notifications` milik pemilik *post* asli, yang bisa dibaca melalui menu lonceng.

---

## 4. AI Engine & Data Hierarchy (The Brain)

Logika AI bukanlah *black box* murni, melainkan gabungan dari sistem pakar dan evaluasi historis:
1.  **Baseline (SNI 8008:2014):** Mencari FR (Feeding Rate) % dasar berdasarkan rentang umur (DOC) atau berat badan (ABW).
2.  **Historical Confidence (v_ai_ready_dataset):** AI melihat `ai_training_data` dari siklus sukses sebelumnya di tambak tersebut untuk menyesuaikan rasio FCR.
3.  **Custom Modifiers (AI Consultation):** Jika petambak tidak setuju dengan rekomendasi AI, mereka bisa melakukan *chat konsultasi*. Hasil kompromi disimpan dalam bentuk JSON di kolom `plan` pada tabel `cycles`.
4.  **Probiotic Rules:** Nursery (< DOC 30) = Campur ke pakan. Pembesaran = Tebar ke air (kalkulasi kubikasi/luas * kedalaman).

---

## 5. Master Database Map (Relasi Data)

Seluruh logika bertumpu pada struktur Supabase PostgreSQL yang dilindungi oleh *Row Level Security* (RLS).
*(Lihat file migrasi di `supabase/migrations/` untuk detail kolom)*

**Core Entities:**
*   `profiles` (1) ---> (M) `ponds` (Data teknis: luas, kedalaman, bentuk)
*   `ponds` (1) ---> (M) `cycles` (Status Berjalan/Selesai/Jeda, Modifikasi `plan` AI)
*   `cycles` (1) ---> (M) `feed_logs` / `probiotic_logs` / `sampling_logs`
*   `cycles` (1) ---> (M) `active_timers` (Alarm cek anco, pakan selanjutnya, dsb)
*   `cycles` (1) ---> (1) `ai_training_data` (Data hasil panen matang untuk AI)

**Social & Notification Entities:**
*   `profiles` (1) ---> (M) `posts` / `post_likes` / `post_comments`
*   `profiles` (1) ---> (M) `notifications` (Catatan *in-app* notifikasi komunitas)
*   `profiles` (1) ---> (M) `device_tokens` / `fcm_tokens` (Target pengiriman Push Notification)

---

## 6. AI Agent Directives (Instruksi Mutlak Pengembangan)

Jika Anda adalah AI Agent yang membaca dokumen ini, Anda **DIWAJIBKAN** mematuhi instruksi berikut tanpa pengecualian:

1.  **Pahami dan Hormati Arsitektur Next.js 16 (App Router):**
    *   **Server Components (`page.tsx`, `layout.tsx`):** Gunakan sebagai *default* untuk data fetching langsung dari Supabase via SSR. Jangan buat ini menjadi Client Component hanya karena Anda butuh state kecil; pisahkan komponen kecil interaktifnya.
    *   **Client Components (`"use client"`):** **HANYA** untuk interaktivitas murni (form inputs, state UI, *timers*, *chat hooks*, animasi grafik).
    *   **Server Actions (`"use server"`):** Seluruh proses *Insert/Update/Delete* harus menggunakan pola *Server Actions*, bukan rute `/api` kuno. 

2.  **Mobile-First is NOT Optional (Lihat `DESIGN.md`):**
    *   Sistem ini dirancang untuk petambak dengan *smartphone* di tangan.
    *   Setiap UI baru harus dirancang dengan paradigma responsif ekstrem: utamakan *touch targets* minimal 44x44px. 
    *   Estetika sangat krusial: Gunakan estetika *vibrant*, komponen UI *border-radius* yang seragam (Pill/SM/LG), dan hindari warna *generic* membosankan. Tampilkan UX yang menawan, setara dengan standar desain *luxury/premium apps*.

3.  **No "Mock Data" or Hardcoding in Core Flows:**
    *   Gunakan struktur tabel Supabase aktual. Jika struktur kurang, baca dulu migrasi SQL untuk memverifikasi.
    *   Validasi setiap *input* form secara ketat. Petambak mungkin basah tangannya saat menginput data; rancang *fallback* dan konfirmasi yang jelas.

4.  **Terapkan Prinsip "Clean Code" Secara Agresif:**
    *   Komponen tidak boleh lebih dari 300 baris. Jika file `page.tsx` mulai panjang, ekstraksi menjadi sub-komponen terisolasi di folder `_components/`.
    *   Jaga ketat standar TypeScript (jangan pakai `any`).

5.  **Bekerja Secara Terukur dan Bertahap (Batching):**
    *   Jangan merombak seluruh modul sekaligus tanpa konfirmasi. Jika tugas melibatkan penyesuaian fungsi kompleks (seperti `historis.ts` atau evaluasi pakan), pastikan Anda membongkar dampaknya satu per satu.
    *   Baca log/konteks `walkthrough.md` atau pesan terakhir untuk mengetahui progres sebelumnya.

---

> **WARNING UNTUK AI AGENT:** 
> Setiap kali diminta memperbaiki/menambah fitur, pastikan Anda merujuk ke dokumen ini. Jika tindakan Anda melenceng dari visi Mobile-First, merusak Server Actions, atau merusak relasi Database, maka *Anda telah gagal menjalankan peran Anda*. Bertindaklah secara cerdas, teliti, dan efisien.
