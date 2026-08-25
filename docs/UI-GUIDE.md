<!-- Panduan Design System: warna, tipografi, komponen UI, dan pola desain -->

# UI-GUIDE — Design System & Visual Language (PRIMA)

> **Status:** Dokumen ini mencerminkan implementasi aktual di production.  
> **Terakhir Diperbarui:** 25 Agustus 2026  
> **Filosofi:** Mobile-First, Touch-Friendly, Premium Aquaculture Aesthetic.

---

## 1. Prinsip Desain Utama

PRIMA dirancang untuk petambak yang menggenggam *smartphone* sambil berjalan di pematang tambak — sering satu tangan, kadang basah, di bawah terik matahari. Prinsip inti:

1. **Touch-First** — Semua elemen interaktif minimal 44×44px.
2. **Thumb-Friendly** — Aksi primer (catat pakan, catat probiotik) berada di zona jangkauan jempol (bawah 60% layar).
3. **Glanceable** — Informasi penting (DOC, rekomendasi pakan, status alarm) terlihat tanpa scroll.
4. **One-Handed Operation** — Navigasi dan aksi utama bisa diakses dengan satu jempol.
5. **Visual Clarity** — Kontras tinggi, font besar, dan warna bermakna agar terbaca di bawah sinar matahari.

---

## 2. Palet Warna

### 2.1 Brand Colors (Identitas PRIMA)

| Token | Hex | Preview | Penggunaan |
|-------|-----|---------|------------|
| **Primary / Tosca** | `#2ABFC8` | 🟦 | Tombol utama, header profil, spinner, aksen interaktif, FAB, link aktif |
| **Primary Hover** | `#3A7C86` | 🟩 | Hover state tombol utama (desktop) |
| **Primary Dark** | `#20606D` | 🟫 | Dot indicator aktif (onboarding), gradient login desktop |
| **Header Kolam** | `#74B6BE` | 🟦 | Background header halaman detail kolam |
| **Teal Deep** | `#0A4D58` | ⬛ | Teks heading gelap, aksen premium |
| **Navy Dark** | `#002530` | ⬛ | Teks paling gelap, kontras maksimum |

### 2.2 Surface Colors (Latar Belakang)

| Token | Hex | Penggunaan |
|-------|-----|------------|
| **Page Background** | `#F4F6F7` / `#F2F5F7` | Canvas utama seluruh halaman |
| **Card White** | `#FFFFFF` | Kartu konten, sheet, modal |
| **Input Background** | `#EAEAEA` | Background field input (form) |
| **Chat Input BG** | `#EEF1F3` | Background textarea komentar/chat |
| **Light Teal Surface** | `#E3F1F2` | Badge pembesaran, kartu premium |

### 2.3 Status & Semantic Colors

| Token | Hex | Penggunaan |
|-------|-----|------------|
| **Success Green** | `#22C55E` | Status berhasil, SR tinggi |
| **Warning Amber** | `#F59E0B` | Peringatan anco, fase remaja |
| **Warning Orange** | `#F2811B` | Badge fase benur |
| **Danger Red** | `#F26B4E` | Akhiri siklus, hapus, error |
| **Danger Dark** | `#EF4444` | Alert kritis, teks error |
| **Info Blue** | `#3B82F6` | Badge informasi umum |
| **Emerald** | `emerald-100/700` | Badge sumber data historis |

### 2.4 Neutral / Gray Scale (Tailwind `slate-*`)

| Token | Penggunaan |
|-------|------------|
| `slate-50` | Background body fallback |
| `slate-100` | Divider, separator |
| `slate-200` | Border kartu ringan |
| `slate-300` | Toggle off state |
| `slate-400` | Teks tersier (sangat muted) |
| `slate-500` | Label kecil, caption |
| `slate-600` | Teks sekunder |
| `slate-700` | Teks body utama |
| `slate-800` | Teks input, heading sekunder |
| `slate-900` | Teks heading primer |

---

## 3. Tipografi

### 3.1 Font Family
- **Primary:** `Inter` (Google Fonts, variable weight)
- **Fallback:** `system-ui, sans-serif`
- **Load Strategy:** `next/font/google` (self-hosted, zero FOUT)

### 3.2 Skala Ukuran (Mobile-First)

| Konteks | Ukuran | Weight | Tailwind |
|---------|--------|--------|----------|
| Heading Utama (H1) | 20-28px | `font-extrabold` (800) | `text-xl` / `text-2xl` |
| Heading Sekunder (H2) | 18-20px | `font-bold` (700) | `text-lg` / `text-xl` |
| Heading Kartu (H3) | 16-18px | `font-bold` (700) | `text-base` / `text-lg` |
| Angka Besar (Statistik) | 18-24px | `font-extrabold` (800) | `text-lg` / `text-2xl` |
| Body Text | 14-16px | `font-medium` (500) | `text-sm` / `text-base` |
| Label & Caption | 11-12px | `font-medium` (500) | `text-[11px]` / `text-xs` |
| Micro Label | 10px | `font-semibold` (600) | `text-[10px]` |
| Button Text | 13-14px | `font-semibold` (600) | `text-sm` |

### 3.3 Aturan Tipografi
- Body text **minimal 14px** pada mobile (jangan pernah lebih kecil kecuali untuk micro-label).
- Gunakan `font-extrabold` untuk angka statistik besar (DOC, pakan kg, biomassa).
- Gunakan `leading-relaxed` untuk paragraf panjang (onboarding, deskripsi).
- Label di atas value menggunakan `text-[11px] text-slate-500`.

---

## 4. Spacing & Layout

### 4.1 Sistem Spacing
Berbasis kelipatan **4px** (Tailwind default):

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `gap-1` / `p-1` | 4px | Spacing antar ikon sangat rapat |
| `gap-1.5` | 6px | Dot indicator, spacing minimal |
| `gap-2` / `p-2` | 8px | Padding menu item, spacing ikon-teks |
| `gap-3` / `p-3` | 12px | Padding input, gap antar elemen kartu |
| `p-4` | 16px | Padding kartu mobile |
| `p-5` | 20px | Padding header, section utama |
| `px-6` / `px-7` | 24-28px | Padding horizontal halaman |
| `py-8` / `py-9` | 32-36px | Padding vertikal besar (header/footer) |

### 4.2 Container
- **Mobile:** Full-width, padding `px-4` atau `px-6`.
- **Desktop:** `max-w-md` (448px) untuk konten tunggal, `max-w-6xl` (1152px) untuk grid.
- **Card margin:** `mx-4` pada mobile → `mx-0` pada desktop.

### 4.3 Bottom Navigation Bar
- Tinggi: `h-16` (64px)
- Posisi: `fixed bottom-0` 
- Background: `bg-white` dengan `border-t` dan `shadow-lg`
- FAB (Floating Action Button): lingkaran `h-14 w-14`, warna `bg-[#2ABFC8]`, `ring-4 ring-white/70`, posisi `-top-6` dari navbar

---

## 5. Border Radius

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `rounded-lg` | 8px | Badge kecil, chip, area alert |
| `rounded-[10px]` | 10px | Input fields, tombol dalam form |
| `rounded-xl` | 12px | Tombol CTA utama |
| `rounded-2xl` | 16px | Kartu konten utama, section |
| `rounded-[20px]` | 20px | Kartu onboarding |
| `rounded-3xl` | 24px | Header kolam (desktop) |
| `rounded-full` | 9999px | Avatar, pill button, dot, FAB, ikon bulat |

**Aturan:** Konsisten! Kartu selalu `rounded-2xl`, input selalu `rounded-[10px]`, tombol utama `rounded-xl` atau `rounded-[10px]`.

---

## 6. Elevasi & Bayangan

| Level | Class | Penggunaan |
|-------|-------|------------|
| **Flat** | Tanpa shadow | Konten inline, background |
| **Subtle** | `shadow-sm` | Kartu konten standar |
| **Card** | `shadow-[0_14px_35px_rgba(18,63,76,0.08)]` | Kartu onboarding (custom shadow lembut) |
| **Dropdown** | `shadow-lg ring-1 ring-black/5` | Menu dropdown, popup |
| **FAB** | `shadow-lg ring-4 ring-white/70` | Floating Action Button |

**Filosofi:** Bayangan digunakan sangat hemat dan halus. Tidak ada drop-shadow tebal/berat. Kedalaman ditunjukkan lewat perbedaan warna surface (gray background ↔ white card).

---

## 7. Komponen UI

### 7.1 Tombol (Buttons)

#### Primary Button (CTA Utama)
```
bg-[#2ABFC8] text-white font-semibold rounded-xl/rounded-[10px]
py-3 / py-3.5 px-4 w-full
active:scale-[0.98] disabled:opacity-60
```
Digunakan untuk: Daftar, Masuk, Simpan, Catat Pakan, Submit.

#### Secondary / Outline Button
```
border-[1.5px] border-[#2ABFC8] text-[#2ABFC8] bg-white
rounded-xl py-3 font-semibold
active:scale-[0.98]
```
Digunakan untuk: Masuk (landing), Modifikasi rekomendasi.

#### Pill Button (Aksi Kecil)
```
rounded-full border-[1.5px] border-[#2ABFC8]
px-4 py-1.5 text-xs font-semibold text-[#2ABFC8]
```
Digunakan untuk: "Modifikasi", "Edit" di dalam kartu.

#### Danger Button
```
text-[#F26B4E] / text-red-600
hover:bg-red-50
```
Digunakan untuk: Akhiri Siklus, Hapus Kolam.

#### Icon Button (Bulat)
```
rounded-full p-1.5 / h-8 w-8
bg-white/10 text-white hover:bg-white/20
```
Digunakan untuk: Back arrow, menu titik tiga.

#### Micro-Interaction
**Semua tombol** menggunakan `active:scale-[0.98]` atau `active:scale-95` sebagai feedback sentuhan. Tidak ada hover-only interaction — semua harus bekerja tanpa hover (mobile).

### 7.2 Kartu (Cards)

#### Card Standar
```
rounded-2xl bg-white p-4 shadow-sm
```
Digunakan untuk: FeedCard, ProbioticCard, DocCard, statistik.

#### Card Onboarding
```
rounded-[20px] bg-white px-6 pb-8 pt-8
shadow-[0_14px_35px_rgba(18,63,76,0.08)]
```

### 7.3 Input Fields

```
w-full rounded-[10px] bg-[#EAEAEA] px-4 py-3 / py-3.5
text-sm text-slate-800 outline-none
placeholder:text-slate-500
focus:ring-2 focus:ring-[#2ABFC8]/50
```
- Font size **wajib 16px** (mencegah auto-zoom di iOS).
- Gunakan `inputmode="numeric"` untuk field angka.
- Tidak ada autofocus di mobile (mencegah keyboard muncul tiba-tiba).

### 7.4 Toggle (Chip Selection)

```
rounded-[10px] border-[1.5px] border-[#2ABFC8] py-2.5 text-xs font-semibold
— Aktif: bg-[#2ABFC8] text-white
— Tidak aktif: bg-white text-[#2ABFC8]
```
Digunakan untuk: Pilihan bentuk kolam, pilihan hasil anco.

### 7.5 Badge & Pill

| Varian | Class |
|--------|-------|
| **Benur** (DOC ≤ 30) | `bg-[#FDEBDD] text-[#F2811B]` |
| **Remaja** (DOC 31-70) | `bg-sky-100 text-sky-600` |
| **Pembesaran** (DOC > 70) | `bg-[#E3F1F2] text-[#2F6E7B]` |
| **Historis** | `bg-emerald-100 text-emerald-700 border-emerald-200` |
| **SNI** | `bg-slate-100 text-slate-500 border-slate-200` |
| **Anco Warning** | `bg-amber-50 text-amber-700 border-amber-200/60` |

### 7.6 Sheet / Bottom Sheet

Panel *slide-up* dari bawah layar untuk form dan aksi:
```
fixed inset-0 z-50
— Overlay: bg-black/40
— Panel: bg-white rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto
```

### 7.7 Dropdown Menu

```
absolute right-0 top-full mt-2
w-40 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 z-50
— Item: rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50
```

### 7.8 Spinner / Loading

```
h-8 w-8 animate-spin rounded-full
border-4 border-[#2ABFC8] border-t-transparent
```

### 7.9 Header Halaman

#### Header Kolam Detail
```
bg-[#74B6BE] px-4 pb-5 pt-5
— Judul: text-base font-extrabold text-white
— Subtitle: text-[11px] text-white/80
```

#### Header Profil
```
bg-[#2ABFC8] px-5 pb-6 pt-12
```

---

## 8. Iconography

- **Library:** Lucide Icons (`lucide-react`)
- **Ukuran standar:** 16-20px untuk inline, 24-32px untuk section icon
- **Warna:** Mengikuti konteks (white di header gelap, `slate-*` di kartu putih, `#2ABFC8` untuk aksen)
- **Custom Icons:** Beberapa ikon menggunakan aset WebP custom di `/public/images/icon/` (contoh: `pakan.webp`)

---

## 9. Responsive Breakpoints

PRIMA dibangun dengan paradigma **Mobile-First**. Styles dasar = mobile, lalu ditingkatkan via `md:` prefix.

| Breakpoint | Lebar | Perubahan |
|------------|-------|-----------|
| **Base (Mobile)** | < 768px | Single column, bottom nav, full-width cards, stacked layout |
| **`md:` (Tablet/Desktop)** | ≥ 768px | Grid multi-kolom, sidebar potensial, card hover effects, max-width container |

### Pola Kolaps
- **Navigation:** Bottom bar (mobile) → Bottom bar tetap (tablet/desktop)
- **Kartu:** Stack vertikal → Grid 2-3 kolom
- **Onboarding:** Carousel horizontal → Grid 3 kolom
- **Form:** Full-width stacked → Constrained width centered
- **Header kolam:** Full-width → `rounded-b-3xl`

---

## 10. Pola Animasi & Transisi

| Elemen | Animasi |
|--------|---------|
| **Button Press** | `active:scale-[0.98]` atau `active:scale-95` |
| **Card Hover (Desktop)** | `md:hover:-translate-y-2 md:transition-transform md:duration-300` |
| **Dot Indicator** | `transition-all duration-300` (width berubah saat aktif) |
| **Sheet Overlay** | Fade in `bg-black/40` |
| **Spinner** | `animate-spin` (Tailwind built-in) |
| **General** | `transition` pada semua elemen interaktif |

**Aturan:** Animasi harus subtil dan fungsional. Tidak ada animasi dekoratif berat yang menghambat performa di perangkat low-end.

---

## 11. Aksesibilitas

### Touch Targets
- **Minimum:** 44×44px (standar iOS HIG / Android Material)
- **Spacing antar target:** minimum 8px
- **FAB:** 56×56px (lebih besar dari minimum)

### Kontras
- Teks body: minimum rasio **4.5:1** (AA)
- Teks besar (≥ 18px): minimum **3:1**
- Diuji untuk visibilitas di bawah sinar matahari terik

### Screen Reader
- Semua tombol interaktif harus memiliki `aria-label` jika hanya berisi ikon
- Gambar memiliki `alt` text
- Form memiliki label terhubung

---

## 12. File Aset Penting

| Aset | Lokasi |
|------|--------|
| Logo PRIMA | `/public/logo.png` |
| Ikon Pakan (WebP) | `/public/images/icon/pakan.webp` |
| Ilustrasi Onboarding | `/public/images/onboarding-*.png` |
| Font Inter | Auto-loaded via `next/font/google` |
| Ikon UI | `lucide-react` (bundled) |

---

## 13. Do's and Don'ts

### ✅ Do
- Gunakan `#2ABFC8` untuk **semua** elemen interaktif utama (tombol, link, FAB, spinner).
- Gunakan `rounded-[10px]` untuk input dan `rounded-2xl` untuk kartu — konsisten.
- Gunakan `active:scale-[0.98]` pada setiap tombol sebagai feedback sentuhan.
- Gunakan `bg-[#EAEAEA]` untuk background input, bukan border-based input.
- Selalu sediakan `disabled:opacity-60` pada tombol yang bisa di-disable.
- Tampilkan data dalam format Indonesia (`id-ID` locale, separator ribuan titik).

### ❌ Don't
- Jangan gunakan warna aksen kedua selain `#2ABFC8` untuk aksi interaktif.
- Jangan buat tombol yang hanya merespons hover (harus bekerja tanpa hover di mobile).
- Jangan gunakan font di bawah 10px untuk konten apapun.
- Jangan taruh aksi primer (CTA) di zona atas layar yang sulit dijangkau jempol.
- Jangan gunakan shadow tebal/berat pada kartu — bayangan harus halus dan minimal.
- Jangan gunakan gradient sebagai dekorasi kartu — kedalaman datang dari perbedaan surface color.
- Jangan gunakan placeholder image; selalu gunakan aset nyata atau ikon WebP.
