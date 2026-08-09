

# USER STORY - Pakan

### Tujuan Utama Pak Budi Menggunakan Aplikasi Ini
Sebelum ada aplikasi, Pak Budi sering tebak-tebakan saat kasih makan udang (cuma pakai *feeling*). Akibatnya: 
*   Kadang pakan kurang = udang kerdil (lambat besar).
*   Kadang pakan kebanyakan (overfeeding) = pakan sisa membusuk di dasar kolam, air jadi beracun, udang mati massal, dan Pak Budi rugi besar (karena pakan adalah 60-70% dari total biaya modal).

Dengan aplikasi ini, tujuan Pak Budi adalah **hemat pakan, air tetap sehat, udang cepat besar, dan panen maksimal.**

---

### Alur Penggunaan (User Journey)

#### Langkah 1: Awal Musim (Set Up Kolam)
Hari pertama siklus budidaya dimulai. Pak Budi baru saja beli benih udang (benur).
*   **Yang Pak Budi lakukan:** Buka aplikasi dan buat "Siklus Baru".
*   **Yang di-input:**
    *   Kolam mana yang dipakai (misal: Kolam A1, Luas 1.000 m²).
    *   Kedalaman Rata-rata Air
    *   Tanggal tebar benih.
    *   Jumlah benih yang disebar (misal: 100.000 ekor).
*   *Di balik layar:* Mulai hari ini, sistem otomatis menghitung **DOC (Day of Culture/Umur Udang)**. Hari ini DOC 1, besok DOC 2, dst.

#### Langkah 2: Pengecekan Pertumbuhan (Sampling Mingguan)
Udang sudah berumur 30 hari. Pak Budi ingin tahu seberapa besar udangnya sekarang.
*   **Yang Pak Budi lakukan:** Pergi ke tambak bawa timbangan kecil, ambil jaring (jala), lalu jaring beberapa udang secara acak.
*   **Yang di-input ke aplikasi (Form Sampling):**
    *   Berapa ekor udang yang terjaring (misal: 100 ekor).
    *   Berapa total berat 100 ekor udang itu (misal: 500 gram).
    *   Estimasi udang yang masih hidup di kolam (Survival Rate, misal: masih 90%).
*   *Di balik layar (Keajaiban Aplikasi):* Aplikasi otomatis menghitung, "Oh, 1 ekor udang berat rata-ratanya 5 gram (ABW). Berarti total berat seluruh udang di kolam saat ini adalah **450 kg (Biomassa)**."

#### Langkah 3: Rutinitas Harian (Memberi Makan)
Hari ini jadwal kasih makan pagi.
*   **Yang Pak Budi lakukan:** Buka aplikasi sebelum lempar pakan.
*   **Manfaat Sistem:** Aplikasi langsung memberi **Rekomendasi Pintar** (berdasarkan standar SNI & Biomassa tadi): *"Pak Budi, hari ini udang umur 31 hari. Kasih pakan ukuran 'Crumble' ya. Untuk pagi ini, tebar sebanyak 3 Kg."*
*   **Yang di-input (Log Pakan):** Setelah Pak Budi melempar pakan, dia catat:
    *   Berapa kg pakan yang *benar-benar* ditebar (karena kadang Pak Budi mau ngasih lebih atau kurang dari rekomendasi).
    *   Waktu (Pagi/Siang/Sore).
    *   Merek & Ukuran pakan.

#### Langkah 4: Evaluasi Pakan (Kontrol Anco) - *Fitur Paling Keren*
Pakan sudah disebar. Di dalam tambak itu ada "Anco" (semacam jaring datar berisi pakan yang ditaruh di dasar kolam sebagai indikator nafsu makan udang).
*   **Manfaat Sistem:** Karena umur udang sekarang 31 hari, sistem otomatis memasang **Alarm** untuk 2.5 jam ke depan (Sesuai standar SNI).
*   *(2.5 jam kemudian, HP Pak Budi berbunyi/muncul notifikasi)*: *"Waktunya angkat Anco!"*
*   **Yang Pak Budi lakukan:** Pergi ke kolam, tarik tali anco, dan lihat sisa pakan di jaring itu.
*   **Yang di-input (Hasil Anco):**
    *   Pilih di aplikasi: **"Habis Total"** atau **"Sisa Sedikit"** atau **"Sisa Banyak"**.
*   *Di balik layar (AI Belajar):* Jika Pak Budi input "Sisa Banyak", aplikasi akan mencatat, *"Nafsu makan udang sedang turun, besok siang pakan harus dipotong/dikurangi agar tidak merusak air."*

---

#### Langkah 5: Perawatan Air & Udang (Aplikasi Probiotik)
Selain pakan, Pak Budi juga harus rutin menjaga kualitas air dan pencernaan udang dengan probiotik agar udang tidak gampang sakit.
*   **Manfaat Sistem:** Aplikasi punya 'contekan' dosis standar (misal: 1-5 mg/L air untuk pembesaran, atau 2-4 mL/kg jika dicampur langsung ke pakan).
*   **Yang Pak Budi lakukan:** Membuka fitur "Log Probiotik" saat menebar cairan probiotik ke kolam atau saat sedang mengaduknya bersama pakan.
*   **Yang di-input (Log Probiotik):**
    *   Merek/Jenis Probiotik.
    *   Metode Aplikasi: Pilih "Ke Air" atau "Melalui Pakan".
    *   Dosis dan Satuan (misal: 2 mL/kg).
    *   Total Jumlah yang dihabiskan (mL).
    *   Frekuensi pemberian (misal: 1x seminggu).
*   *Di balik layar:* Pencatatan ini sangat krusial. Nanti di akhir bulan saat panen atau evaluasi, jika udang tiba-tiba lambat besar, Pak Budi bisa mengecek riwayat ini: *"Oh pantesan, 2 minggu lalu saya sempat bolong tidak kasih probiotik air!"*

---

### Kesimpulan
Dengan alur ini, Pak Budi tidak perlu lagi menghapal standar pakan SNI yang rumit. Dia cukup rajin **Tebar Benih -> Sampling Rutin -> Ikuti Rekomendasi Pakan -> Cek Anco pas alarm bunyi**. 

Sistemlah yang akan menghitung kerumitan matematika biomassa, memikirkan feeding rate, dan menjaga agar pakan tidak terbuang sia-sia. 

Bagaimana? Apakah alur cerita ini membuat sistemnya menjadi lebih terbayang di pikiran Anda?