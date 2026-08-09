<!-- Product Requirements Document: visi produk, problem, solusi, dan goals -->

# PRD - Product Requirements Document

## 1. Product Overview

**Nama Produk:** (TBD - belum ditentukan)

**Tagline:** Sistem manajemen budidaya udang berbasis AI untuk petambak Indonesia

**Version:** MVP 1.0

---

## 2. Problem Statement

### Latar Belakang
Titik kritis dalam budidaya udang terletak pada efisiensi manajemen pakan dan pemberian probiotik. Kesalahan dalam dua hal ini dapat menyebabkan:
- Kerugian finansial akibat pemborosan pakan
- Kegagalan panen karena kualitas air menurun
- Produktivitas rendah

### Data Survei
Dari survei terhadap 20 petambak udang:
- **Hanya 2 dari 20** petambak yang rutin mencatat data (takaran pakan, populasi udang, probiotik)
- **90% petambak** tidak memiliki sistem pencatatan yang terstruktur
- **100% petambak** menggunakan sistem manual tanpa evaluasi

### Pain Points
1. **Tidak ada pencatatan** — petambak lupa berapa pakan yang sudah diberikan
2. **Fokus kolam tunggal** — sistem manual hanya mampu handle 1 kolam
3. **Tidak ada rekomendasi** — keputusan berdasarkan feeling, bukan data
4. **Tidak ada evaluasi** — tidak tahu apa yang perlu diperbaiki untuk siklus berikutnya

---

## 3. Solution

Sistem digital berbasis AI yang membantu petambak udang:

1. **Mengelola multiple kolam** dalam satu dashboard
2. **Mencatat log harian** pakan dan probiotik dengan mudah
3. **Mendapatkan rekomendasi AI** untuk takaran pakan dan probiotik yang optimal
4. **Penjadwalan otomatis** dengan reminder
5. **Evaluasi per siklus** untuk continuous improvement

### Keunggulan Kompetitif
- **AI Prediktif dan Adaptif** — rekomendasi menyesuaikan dengan kondisi aktual
- **Data-driven** — keputusan berdasarkan data, bukan feeling
- **Logbook digital** — riwayat lengkap yang bisa dianalisis

---

## 4. Target User

### Primary Persona: Petambak Udang

**Nama:** Pak Budi (35-55 tahun)

**Karakteristik:**
- Memiliki 2-5 kolam udang
- Pendidikan: SMA - S1
- Familiar dengan smartphone (WhatsApp, YouTube)
- Tidak terlalu tech-savvy, butuh UI yang simple
- Bahasa: Indonesia
- Lokasi: Pesisir pantai Indonesia (Jawa, Sumatera, Sulawesi, dll)

**Goals:**
- Meningkatkan produktivitas panen
- Mengurangi kerugian akibat pemborosan pakan
- Punya catatan yang rapi untuk evaluasi

**Frustrations:**
- Sulit mengingat berapa pakan yang sudah diberikan
- Tidak tahu takaran optimal untuk kondisi kolamnya
- Tidak punya waktu untuk pencatatan manual yang rumit

---

## 5. Product Goals

### MVP Goals (3 bulan pertama)
1. User bisa register dan login
2. User bisa mengelola multiple kolam
3. User bisa mencatat log pakan dan probiotik
4. User mendapat rekomendasi AI dasar
5. User bisa melihat ringkasan siklus

### Success Metrics
| Metric | Target |
|--------|--------|
| User Registration | 50 petambak |
| Active Users (WAU) | 30% dari registrasi |
| Log Entry per User | Minimal 3x/minggu |
| User Satisfaction | NPS > 30 |

---

## 6. Scope

### In Scope (MVP)
- Autentikasi (register, login, logout)
- CRUD kolam (dengan kedalaman air)
- CRUD siklus budidaya
- Pencatatan Sampling (Penimbangan rutin untuk ABW & Biomassa)
- Log Pakan dengan fitur Cek Anco
- Log Probiotik dengan detail dosis & metode aplikasi
- Rekomendasi AI Adaptif (berdasarkan SNI 8008:2014, Biomassa, dan Hasil Anco)
- Penjadwalan & Alarm Cek Anco (Countdown otomatis sesuai DOC)
- Evaluasi per siklus (FCR, SR, Total Pakan)

### Out of Scope (Future)
- Multi-user / role admin
- Monitoring kualitas air (pH, DO, suhu, salinitas)
- Integrasi IoT / sensor
- Marketplace pakan/probiotik
- Fitur komunitas/forum
- Prediksi harga udang
- Integrasi WhatsApp notification

---

## 7. Acuan Data

Logika kalkulasi dan rekomendasi AI akan menggunakan:

1. **Standar Kementerian Kelautan dan Perikanan (KKP)**
   - Pedoman budidaya udang vaname
   - Standar feeding rate

2. **Best Practice Industri**
   - FCR (Feed Conversion Ratio) benchmark
   - Survival rate standar
   - Feeding frequency

---

## 8. Assumptions & Dependencies

### Assumptions
- User memiliki smartphone dengan akses internet
- User familiar dengan penggunaan aplikasi web/mobile dasar
- User budidaya udang vaname (jenis paling umum di Indonesia)

### Dependencies
- Supabase untuk database dan auth
- AI provider (TBD) untuk rekomendasi
- Data formula pakan dari Kementerian/riset

---

## 9. Timeline (Estimasi)

| Phase | Durasi | Deliverable |
|-------|--------|-------------|
| Phase 1: Foundation | 2 minggu | Auth, DB setup, basic UI |
| Phase 2: Core Features | 3 minggu | CRUD kolam, siklus, log |
| Phase 3: AI Integration | 2 minggu | Rekomendasi AI |
| Phase 4: Polish | 1 minggu | Testing, bug fixing |
| **Total** | **8 minggu** | MVP ready |

---

## 10. Open Questions

- [ ] Nama produk apa?
- [ ] AI provider mana? (OpenAI, Anthropic, Gemini, local?)
- [ ] Apakah perlu verifikasi email saat register?
- [ ] Notifikasi selain browser push? (WhatsApp, SMS?)
- [ ] Support jenis udang selain vaname?
