<!-- Narasi perjalanan pengguna dalam menggunakan aplikasi PRIMA -->

# USER STORY — Perjalanan Pak Budi (PRIMA)

> **Status:** Mencerminkan fitur MVP Aktual (Live).  
> **Terakhir Diperbarui:** 25 Agustus 2026  

---

## 1. Tujuan Utama Pengguna (The "Why")

Sebelum ada aplikasi PRIMA, **Pak Budi** (seorang petambak udang vaname) sering tebak-tebakan saat menakar pakan udangnya, hanya mengandalkan *feeling*. Akibatnya:
*   Kadang pakan **kurang** = udang jadi kerdil, lambat besar.
*   Kadang pakan **kebanyakan** (overfeeding) = sisa pakan membusuk di dasar kolam menjadi amonia beracun, udang mati massal, dan Pak Budi rugi besar karena biaya pakan menyedot 60-70% total modalnya.

Dengan menggunakan PRIMA, tujuan Pak Budi sangat jelas: **Hemat pakan, menjaga kualitas air, mencetak udang besar, dan memanen hasil maksimal.**

---

## 2. Alur Penggunaan (User Journey)

### Langkah 1: Awal Musim (Set Up Kolam & Siklus)
Hari pertama musim tanam dimulai. Pak Budi baru saja membeli jutaan benih udang (benur).
*   **Aksi:** Pak Budi membuka PRIMA, masuk ke halaman Profil, lalu mendaftarkan kolam barunya (misal: "Kolam A1", luas 1.000 m², kedalaman 1.5m).
*   **Aksi:** Ia lalu menekan tombol **"Mulai Siklus"** dan memasukkan jumlah tebar: 100.000 ekor.
*   **Di balik layar (Sistem):** Mulai hari ini, PRIMA otomatis menghitung **DOC (Day of Culture / Umur Udang)**. Hari ini adalah DOC 1, besok DOC 2, dan seterusnya.

### Langkah 2: Rutinitas Harian (Memberi Pakan via Quick Action)
Hari ini jadwal kasih makan pagi. Pak Budi sedang berada di pematang tambak dengan satu tangan memegang ember pakan.
*   **Aksi:** Pak Budi cukup membuka **Dashboard** PRIMA. Di sana sudah terpampang Rekomendasi Pintar AI: *"Pakan Pagi: 3.5 Kg"*.
*   **Aksi:** Pak Budi menebar pakan, lalu cukup menekan tombol **"Sudah Kasih Pakan" (Quick Action)** tanpa perlu repot mengetik angka lagi.
*   **Di balik layar (Sistem):** PRIMA mencatat pakan masuk logbook, dan **secara otomatis menyalakan Timer Anco** untuk 2.5 jam ke depan.

### Langkah 3: Evaluasi Anco & Eskalasi Alarm
Pakan sudah disebar. Di dasar kolam terdapat "Anco" (jaring datar untuk mengecek sisa pakan).
*   **Aksi:** 2.5 jam kemudian, *smartphone* Pak Budi berbunyi. Ada **Push Notification**: *"Waktunya angkat Anco Kolam A1!"*
*   **Aksi:** Pak Budi sibuk dan mengabaikan notifikasi tersebut. Setengah jam kemudian, muncul notifikasi **Eskalasi** berwarna merah karena Anco dibiarkan terlalu lama.
*   **Aksi:** Pak Budi bergegas mengangkat Anco, lalu menginput hasilnya di aplikasi: **"Sisa Banyak"**.
*   **Di balik layar (AI):** Karena hasilnya "Sisa Banyak" (nafsu makan udang turun), AI PRIMA otomatis **memotong dosis pakan siang** sebesar 25% agar sisa pakan tidak menjadi racun di air.

### Langkah 4: Sampling Mingguan & Proyeksi
Udang berumur 35 hari. Pak Budi mendapat peringatan dari aplikasi untuk melakukan *sampling*.
*   **Aksi:** Pak Budi menjala beberapa udang secara acak, menimbangnya, dan memasukkan data: "100 ekor = 500 gram".
*   **Di balik layar (Sistem):** Aplikasi mengalkulasi bahwa 1 ekor = 5 gram (ABW). PRIMA memperbarui **Biomassa** kolam secara *real-time* dan menggambar grafik pertumbuhan.
*   **Aksi:** Pak Budi membuka tab **Proyeksi**. Ia bisa melihat estimasi bahwa jika tren ini berlanjut, pada hari ke-120 ia akan panen sebesar 1.5 Ton!

### Langkah 5: Kebingungan & Komunitas (Social Forum)
Sore harinya, air kolam Pak Budi tiba-tiba berbusa. Ia panik.
*   **Aksi:** Pak Budi membuka fitur **Konsultasi AI** di dalam detail kolam dan bertanya, *"Kenapa air tambak berbusa?"* AI langsung merespons dengan kemungkinan penyebab (plankton mati/overfeeding).
*   **Aksi:** Merasa butuh opini manusia, Pak Budi mempostingnya di menu **Komunitas**.
*   **Aksi:** Lima menit kemudian, petambak senior dari daerah lain berkomentar membagikan pengalamannya mengatasi masalah tersebut.

### Langkah 6: Panen & Pembelajaran AI (Historis)
Hari ke-110, Pak Budi panen raya.
*   **Aksi:** Ia menekan tombol merah **"Akhiri Siklus"** dan memasukkan total berat panen: 1.800 Kg.
*   **Di balik layar (AI):** Sistem menghitung bahwa **FCR (Feed Conversion Ratio)** Pak Budi sangat bagus (1.2). PRIMA menyimpan siklus ini ke dalam *AI Training Data*.
*   **Siklus Berikutnya:** Tiga minggu kemudian, saat Pak Budi menebar benih lagi di Kolam A1 dengan kepadatan yang sama, AI PRIMA tidak lagi menggunakan standar buku (SNI), melainkan **menjiplak total** jadwal dan dosis pakan dari siklus sukses bulan lalu. Ini adalah puncak kecerdasan PRIMA (Single Source of Truth).

---

## 3. Kesimpulan Narasi

Dengan alur di atas, PRIMA membebaskan Pak Budi dari kerumitan:
1. Tidak perlu mengingat rumus matematika Biomassa.
2. Tidak perlu men-set alarm manual untuk angkat Anco.
3. Tidak perlu menebak-nebak apakah pakannya overfeeding atau tidak (karena AI otomatis memotong jika Anco sisa banyak).
4. Tidak merasa sendirian karena ada AI dan Komunitas petambak lain.

Pak Budi hanya perlu rajin: **Tebar Pakan -> Input Anco -> Sampling Mingguan -> Panen**. Semua urusan hitung-hitungan *njelimet* diserahkan ke PRIMA.