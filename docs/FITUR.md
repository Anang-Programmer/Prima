<!-- Penjelasan fitur-fitur aplikasi untuk presentasi tim -->

# FITUR - Daftar Fitur Aplikasi

## 1. Overview Aplikasi

**Nama:** Prima - Sistem Budidaya Udang Berbasis AI

**Tujuan:** Membantu petambak udang mengelola kolam dengan rekomendasi AI untuk meningkatkan produktivitas hingga 30%

**Platform:** Web (mobile-first) + Mobile App (WebView)

---

## 2. Fitur Utama MVP

### 2.1 Dashboard
**Untuk:** Monitoring cepat semua kolam

**Fitur:**
- Ringkasan status semua kolam (aktif/siap tanam)
- Total siklus yang berjalan
- Statistik produktivitas (FCR, yield)
- Quick action: tambah kolam, catat pakan

**Tampilan Mobile:**
- Card-based layout
- Glanceable info (lihat sekilas tanpa scroll)
- Bottom navigation untuk akses cepat

---

### 2.2 Manajemen Kolam
**Untuk:** CRUD kolam tambak

**Fitur:**
- **Tambah kolam baru**: Input nama, luas (m²), lokasi
- **Edit data kolam**: Update info jika ada perubahan
- **Hapus kolam**: Dengan warning jika ada siklus aktif
- **Lihat daftar kolam**: List semua kolam dengan status

**Validasi:**
- Luas kolam: 1 - 100,000 m²
- Nama: maksimal 100 karakter

---

### 2.3 Siklus Budidaya
**Untuk:** Tracking per periode tebar sampai panen

**Fitur:**
- **Mulai siklus baru**: Input jumlah benur, tanggal tebar
- **Monitor siklus aktif**: Lihat DOC (Day of Culture), progress
- **Akhiri siklus**: Input data panen, otomatis generate evaluasi
- **Riwayat siklus**: Lihat performa siklus-siklus sebelumnya

**Info yang ditampilkan:**
- DOC (hari ke berapa)
- Estimasi biomass
- Total pakan yang sudah dipakai
- Progress bar menuju target panen (90-120 hari)

---

### 2.4 Rekomendasi AI
**Untuk:** Keputusan feeding berbasis data, bukan feeling

**Fitur:**
- **Kalkulasi pakan harian**: Berdasarkan jumlah udang, luas kolam, DOC
- **Takaran probiotik**: Dosis optimal per m³ air
- **Feeding rate dinamis**: Berubah sesuai umur udang (3-10%)
- **Penjelasan reasoning**: AI jelaskan kenapa rekomendasi segitu

**Formula yang dipakai:**
- Feeding rate: 3-10% tergantung DOC
- Survival rate: 80-95% (estimasi)
- Average Body Weight: Formula kuadratik berdasarkan DOC
- Adjustment: Density, musim, histori

**Contoh output:**
```
Rekomendasi Pakan: 42.5 kg/hari
Probiotik: 600 ml (2x seminggu)

Penjelasan:
Berdasarkan DOC 38 dengan populasi 100.000 ekor
dan luas kolam 500m², estimasi biomass 180 kg.
Feeding rate 4.5%. Kepadatan normal (200 ekor/m²).
```

---

### 2.5 Logbook Digital
**Untuk:** Pencatatan harian yang rapi dan terstruktur

**Fitur:**
- **Catat pakan**: Jumlah (kg), waktu (pagi/siang/sore/malam), jenis pakan
- **Catat probiotik**: Jumlah (ml), jenis probiotik
- **Filter riwayat**: Per hari, minggu, atau range tanggal
- **Edit/hapus log**: Jika ada kesalahan input

**Validasi:**
- Pakan: 0.1 - 10,000 kg
- Probiotik: 10 - 100,000 ml
- Waktu: otomatis dari sistem (bisa manual adjust)

**Tampilan:**
- Mobile: Card list dengan swipe to delete
- Desktop: Table dengan sort dan filter

---

### 2.6 Penjadwalan & Reminder
**Untuk:** Tidak lupa waktu pemberian pakan

**Fitur:**
- **Setup jadwal**: Pilih jam pemberian (3-6x per hari)
- **Browser notification**: Reminder muncul di device
- **Snooze**: Tunda 15 menit jika belum siap
- **Skip tracking**: Catat jika sengaja skip feeding

**Flow:**
```
Jadwal tiba → Notification muncul
→ User klik → Form catat pakan (pre-filled dengan rekomendasi)
```

---

### 2.7 Evaluasi & Laporan
**Untuk:** Belajar dari siklus sebelumnya

**Fitur:**
- **Ringkasan per siklus**: FCR, survival rate, yield
- **Perbandingan siklus**: Lihat improvement atau penurunan
- **Grafik feeding**: Visualisasi pakan harian sepanjang siklus
- **Export laporan**: PDF/Excel (nice to have)

**Metrik yang ditampilkan:**
- **FCR** (Feed Conversion Ratio): Target 1.0-1.3
- **Survival Rate**: Target 75-85%
- **Yield**: kg/m² (target 2-4 kg/m²)
- **Total cost**: Estimasi dari total pakan

**Contoh evaluasi:**
```
Siklus #3 (01 Mar - 29 Mei 2026)
- Durasi: 89 hari
- Panen: 3,500 kg
- FCR: 1.2 (target tercapai)
- Survival Rate: 85% 
- Yield: 7 kg/m²

Perbandingan dengan siklus #2:
- FCR lebih baik 0.1 poin
- Yield naik 10%
```

---

## 3. Fitur Pendukung

### 3.1 Autentikasi
- Register dengan email/password
- Login
- Logout
- Password reset (via email)

### 3.2 Profil User
- Edit nama, email
- Ganti password
- Pengaturan notifikasi (on/off)
- Bahasa: Indonesia (default)

### 3.3 UI/UX
**Mobile-First:**
- Bottom navigation (thumb-friendly)
- Touch targets minimum 48×48px
- Typography 16px minimum (no zoom iOS)
- Glanceable cards

**Desktop Enhancement:**
- Sidebar navigation (hidden di web version untuk fokus mobile)
- Multi-column layouts
- Hover states
- Keyboard shortcuts

**Design Language:**
- Apple-inspired (clean, minimal)
- Warna biru akuakultur (#3b82f6)
- Full-bleed tiles
- Pill-shaped CTAs

---

## 4. Teknologi yang Digunakan

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui** (komponen)

### Backend
- **Next.js API Routes** / Server Actions
- **Supabase** (PostgreSQL + Auth)

### AI
- Formula berbasis research + best practice
- Future: Machine learning model

### Mobile
- WebView wrapper (React Native / Capacitor)
- PWA support (offline mode - future)

---

## 5. Fitur yang TIDAK Ada di MVP

**Out of Scope:**
- Multi-user / role admin
- Monitoring kualitas air (pH, DO, suhu)
- Integrasi IoT / sensor
- Marketplace pakan/probiotik
- Fitur komunitas/forum
- WhatsApp notification (hanya browser push)
- Foto dokumentasi (future)
- Voice input (future)

---

## 6. User Flow Singkat

### Flow Harian (Most Common)
```
Login → Dashboard → Pilih Kolam 
→ Lihat Rekomendasi AI 
→ Catat Pakan yang Diberikan 
→ Selesai
```

### Flow Setup Awal
```
Register → Login 
→ Tambah Kolam Pertama 
→ Mulai Siklus (input jumlah tebar) 
→ Dashboard (ready to use)
```

### Flow Akhir Siklus
```
Pilih Kolam → Akhiri Siklus 
→ Input Berat Panen 
→ Lihat Evaluasi FCR/Yield 
→ [Optional] Mulai Siklus Baru
```

---

## 7. Target User

**Primary:** Petambak udang (Pak Budi, 35-55 tahun)
- Memiliki 2-5 kolam
- Familiar smartphone (WhatsApp, YouTube)
- Bahasa Indonesia
- Butuh sistem simple dan praktis

**Pain Points yang Diselesaikan:**
- Lupa berapa pakan yang sudah dikasih
- Tidak tahu takaran optimal
- Tidak ada evaluasi performa
- Sulit manage multiple kolam

---

## 8. Keunggulan Kompetitif

### vs Kompetitor
- **AI Prediktif**: Rekomendasi menyesuaikan kondisi real-time
- **Mobile-First**: Petambak pakai di lapangan, bukan laptop
- **Logbook Otomatis**: Riwayat lengkap untuk evaluasi
- **Multi-Kolam**: Manage semua kolam dalam 1 dashboard

### vs Manual (Excel/Paper)
- **Tidak perlu hitung manual**: AI otomatis kalkulasi
- **Reminder**: Tidak lupa waktu feeding
- **Insight**: Tahu FCR, yield, comparison antar siklus
- **Accessible**: Buka dari mana saja (mobile/web)

---

## 9. Success Metrics

**Target MVP (3 bulan):**
- 50 petambak register
- 30% active weekly users
- 3+ log entry per user per minggu
- NPS > 30

**Long-term Goals:**
- Tingkatkan produktivitas petambak 20-30%
- Turunkan FCR rata-rata 0.2-0.3 poin
- Reduce waste pakan 15-20%

---

## 10. Roadmap (Post-MVP)

### Phase 2 (Bulan 4-6)
- PWA (offline support)
- Push notification native
- Camera integration (foto dokumentasi)
- Water quality monitoring

### Phase 3 (Bulan 7-12)
- Machine learning model (trained on real data)
- IoT sensor integration
- WhatsApp notification
- Multi-user & role management

### Phase 4 (Tahun 2+)
- Marketplace integration
- Community features
- Price optimization
- Regional expansion

---

## 11. Demo Scenario

**Untuk presentasi:**

1. **Login** sebagai Pak Budi
2. **Dashboard** menampilkan 3 kolam
3. **Pilih Kolam A1** (siklus aktif DOC 38)
4. **Lihat rekomendasi AI**: 42.5 kg pakan, 600 ml probiotik
5. **Catat pakan** yang baru diberikan (40 kg pagi ini)
6. **Lihat logbook**: Riwayat 38 hari pemberian pakan
7. **Lihat evaluasi** dari siklus sebelumnya: FCR 1.2, yield 7 kg/m²
8. **Setup reminder** untuk feeding jam 6 pagi & 6 sore

---

## 12. FAQ Tim

**Q: Berapa lama development MVP?**
A: 8 minggu (2 minggu foundation + 3 minggu core + 2 minggu AI + 1 minggu polish)

**Q: Apakah perlu data dari peternak?**
A: Ya, minimal 3-5 siklus historis untuk validasi formula AI

**Q: Bagaimana jika tidak ada internet?**
A: Phase 1 butuh internet. Phase 2 akan ada PWA offline support.

**Q: Biaya hosting berapa?**
A: Supabase free tier cukup untuk 50-100 user. Vercel free untuk hosting.

**Q: Mobile app native atau WebView?**
A: WebView (fase 1) untuk hemat development time. Native jika ada budget.

---

## 13. Data yang Dibutuhkan dari Peternak

### Data Historis (Untuk Validasi AI)
**Format Excel:**

| Nama Kolam | Luas (m²) | Jumlah Tebar | Tanggal Tebar | Tanggal Panen | Berat Panen (kg) | Total Pakan (kg) | Total Probiotik (ml) | FCR | Survival Rate (%) |
|------------|-----------|--------------|---------------|---------------|------------------|------------------|----------------------|-----|-------------------|
| Kolam A1 | 500 | 100000 | 01/03/2026 | 29/05/2026 | 3500 | 4200 | 12000 | 1.2 | 85 |
| Kolam B1 | 750 | 150000 | 15/03/2026 | 12/06/2026 | 5250 | 6825 | 18000 | 1.3 | 80 |

**Minimal 3-5 siklus** untuk validasi formula.

### Data Operasional (Input ke Sistem)
**Master data (sekali):**
- Nama kolam, luas (m²), lokasi

**Per siklus (saat tebar):**
- Jumlah benur, tanggal tebar

**Harian:**
- Jumlah pakan (kg), waktu pemberian
- Jumlah probiotik (ml) - 2-3x per minggu

**Saat panen:**
- Berat panen total (kg), tanggal panen

---

## 14. Validasi dengan Peternak

**Pertanyaan untuk verifikasi:**
1. Feeding rate 3-10% sesuai praktek? 
2. Frekuensi feeding 3-6x per hari? 
3. Target FCR 1.0-1.3 realistis? 
4. Target survival rate 75-85%? 
5. Jenis probiotik yang dipakai? (Bacillus, EM4, dll)
6. Dosis probiotik per m³? (2-3 ml/m³)
7. Durasi siklus normal? (90-120 hari)
8. Yield target per m²? (2-4 kg/m²)

---

Dokumen ini untuk presentasi internal tim dan pitching ke stakeholder.
