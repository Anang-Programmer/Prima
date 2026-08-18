# Panduan Lengkap Istilah & Rumus Budidaya Udang (PRIMA)

Dokumen ini berisi daftar lengkap singkatan, istilah teknis, beserta rumus perhitungan yang sering digunakan dalam sistem budidaya udang vaname dan yang menjadi dasar kecerdasan buatan (AI) di aplikasi **Prima**.

---

## 1. Kamus Istilah & Singkatan

* **DOC *(Day of Culture)*:** Umur udang yang dihitung sejak hari pertama benih (benur) ditebar ke dalam kolam.
* **ABW *(Average Body Weight)*:** Berat rata-rata per ekor udang (dalam satuan gram). Ini didapat dari hasil sampling jala secara berkala.
* **MBW *(Mean Body Weight)*:** Istilah lain yang maknanya sama persis dengan ABW.
* **SR *(Survival Rate)*:** Tingkat kelulusan hidup (persentase udang yang masih hidup dibanding jumlah tebar awal).
* **FCR *(Feed Conversion Ratio)*:** Rasio konversi pakan. Angka yang menunjukkan berapa kilogram pakan yang dihabiskan untuk menghasilkan 1 kilogram daging udang. (Semakin rendah angkanya, semakin bagus/efisien).
* **ADG *(Average Daily Growth)*:** Pertumbuhan berat rata-rata udang per hari (dalam gram).
* **Biomassa:** Total keseluruhan berat tubuh udang yang ada di dalam satu kolam pada saat tertentu (dalam satuan kilogram atau ton).
* **Anco:** Jaring berbentuk kotak/bundar kecil yang diletakkan di dasar kolam. Diberi sedikit pakan dan diangkat pada jam tertentu untuk mengontrol apakah pakan dihabiskan udang atau bersisa.
* **Benur:** Benih udang vaname yang ditabur di awal siklus budidaya.
* **FR *(Feeding Rate)*:** Persentase pakan yang diberikan per hari dibandingkan dengan berat total tubuh udang (biomassa) di dalam kolam.

---

## 2. Rumus-Rumus Dasar (Matematika Petambak)

### A. Survival Rate (SR)
Digunakan ketika panen atau saat sampling untuk mengetahui secara pasti persentase udang yang berhasil hidup.
> **SR (%) = (Jumlah Udang yang Hidup / Jumlah Tebar Awal) × 100%**

*Penerapan di Aplikasi Prima:* Karena udang tidak bisa dihitung satu per satu di dalam air, Prima **mengestimasi** populasi udang yang hidup berdasarkan standar SNI (misal DOC 45 diestimasi masih hidup 90%).

### B. Biomassa (Total Berat Udang di Kolam)
Merupakan kunci untuk menentukan seberapa banyak pakan yang harus diberikan esok hari.
> **Biomassa (Gram) = Populasi Tebar Awal × Estimasi SR (%) × ABW (gram)**
> *(Bagi dengan 1.000 untuk mengubahnya menjadi Kilogram)*

### C. Total Kebutuhan Pakan Harian
Jumlah pakan dalam sehari yang dibutuhkan udang, didapatkan dari perhitungan FR.
> **Total Pakan Harian (kg) = Biomassa Aktual (kg) × Feeding Rate (%)**

### D. Feed Conversion Ratio (FCR)
Indikator utama untuk menilai apakah petambak untung atau rugi dalam memberikan pakan. Standar FCR yang baik untuk udang vaname adalah 1.2 hingga 1.5.
> **FCR = Total Pakan yang Telah Ditebar (kg) / Total Biomassa Udang (kg)**

*Contoh:* Jika hingga DOC 45 bapak sudah menghabiskan 810 kg pakan, dan prediksi biomassa di kolam adalah 540 kg, maka perhitungan aplikasinya: `810 / 540 = 1.5 (FCR = 1.5)`.

---

## 3. Logika Estimasi AI Berdasarkan SNI 8008:2014

Aplikasi Prima menggunakan rujukan **SNI 8008:2014 (Budidaya Udang Vaname)** untuk menentukan nilai prediksi (baseline) jika data nyata belum dimasukkan oleh petambak.

* **Standar Kelulusan Hidup (SR) SNI:**
  * DOC 1 - 30 hari = **95%**
  * DOC 31 - 60 hari = **90%**
  * DOC 61 - 90 hari = **85%**
  * DOC > 90 hari = **80%**

* **Standar Panen / Produktivitas (Yield):**
  * Target produktivitas yang sehat menurut SNI adalah menghasilkan **2 - 4 kg / m²** (Kilogram udang per meter persegi luas kolam).
  * Jika yield di bawah 2, Prima akan memberikan peringatan bahwa kolam kurang padat (rugi ruang).
  * Jika yield di atas 4, Prima akan memberi *warning* bahwa kolam terlalu padat dan butuh manajemen kincir/oksigen ekstra.

---

## 4. Cara AI Menentukan Pakan Berdasarkan Cek Anco

Standar SNI di atas hanya berlaku jika kolam dalam kondisi sempurna. Pada kenyataannya, nafsu makan udang fluktuatif. Oleh karena itu, Prima menggunakan **hasil input cek Anco** sebagai faktor pengali (*multiplier*).

1. **Anco Selalu Habis Cepat:** Berarti nafsu makan tinggi. Daripada berpatokan pada SNI yang kaku, AI merekomendasikan kenaikan pakan harian secara bertahap (+5% hingga +10%) untuk memaksimalkan pertumbuhan dan mencegah kanibalisme.
2. **Anco Banyak Sisa:** Berarti nafsu makan turun. AI merekomendasikan pemotongan pakan sesegera mungkin (cut pakan -10% hingga -30%) sesuai dengan takaran sisa di anco. Ini krusial agar sisa pakan tidak membusuk menjadi Amonia beracun di dasar kolam.
