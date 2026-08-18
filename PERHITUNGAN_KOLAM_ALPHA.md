# Panduan Presentasi: Perhitungan AI Kolam Alpha

Dokumen ini adalah *"cheat sheet"* atau pegangan Bapak saat menjelaskan kepada juri tentang dari mana angka-angka rekomendasi AI di aplikasi Prima berasal. 

*(Pastikan layar aplikasi menunjukkan DOC 45).*

---

## 1. Profil Kolam Alpha (Data Input)
* **Luas Kolam:** 1.000 m²
* **Kedalaman:** 1,5 meter
* **DOC (Umur Udang):** 45 Hari
* **Tebar Awal (Populasi):** 100.000 ekor
* **ABW (Berat Rata-rata/ekor):** 6 gram

---

## 2. Bagaimana AI Menghitung Biomassa?
AI tidak menggunakan populasi awal mentah-mentah, melainkan menghitung tingkat kehidupan *(Survival Rate)* berdasarkan standar SNI budidaya vaname.

- **Rumus:** `Populasi Awal × Survival Rate × ABW`
- **Tingkat Kehidupan (SR) DOC 45:** Diestimasi **90%** (Standar SNI untuk rentang umur 31-60 hari).
- **Populasi Hidup:** `100.000 ekor × 90% = 90.000 ekor`
- **Biomassa Aktual:** `90.000 ekor × 6 gram = 540.000 gram` atau **540 kg**

*Penjelasan ke Juri:* "Jadi total berat udang di dalam kolam saat ini secara matematis diprediksi sebesar 540 kg."

---

## 3. Bagaimana AI Menentukan 45,9 kg Pakan Harian?
Setelah biomassa diketahui, AI menggunakan pedoman **SNI 8008:2014** untuk menentukan *Feeding Rate* (FR) atau persentase pakan.

**Tabel Acuan SNI (Terprogram di AI):**
| Umur (DOC) | Feeding Rate (SNI) | Nilai Tengah yang Dipakai AI |
|------------|--------------------|------------------------------|
| 16 - 30 hari | 10 - 15% | 12,5% |
| **31 - 45 hari** | **7 - 10%** | **8,5%** |
| 46 - 60 hari | 5 - 7% | 6,0% |

- **Kalkulasi:** Udang umur 45 hari masuk di rentang SNI **7 - 10%**. AI mengambil nilai tengah yang paling ideal dan aman untuk kualitas air, yaitu **8,5%**.
- **Total Pakan Harian:** `540 kg (Biomassa) × 8,5% = 45,9 kg`
- **Porsi per Tebar:** Dibagi 4 jadwal (Pagi, Siang, Sore, Malam), sehingga sekali tebar petambak harus memberi `11,4 kg`.

*Penjelasan ke Juri:* "Berdasarkan standar SNI, kebutuhan pakan untuk umur 31-45 hari ada di rentang 7 sampai 10%. Daripada petambak menebak-nebak, AI kita otomatis mengambil titik tengah yang paling optimal yaitu 8,5%. Dari biomassa 540 kg dikali 8,5%, didapatlah rekomendasi presisi 45,9 kg pakan hari ini."

---

## 4. Bagaimana AI Menentukan 600 ml Probiotik?
Untuk dosis probiotik, AI menghitung **Volume Air** kolam, bukan biomassa udang.

- **Rumus Volume Air:** `Luas × Kedalaman`
- **Kalkulasi Volume:** `1.000 m² × 1,5 m = 1.500 m³` (Setara 1,5 Juta Liter air)
- **Fase Pembesaran:** AI merekomendasikan metode **Tebar ke air** (karena DOC > 30).
- **Kalkulasi Dosis:** Jika anjuran produk probiotik (misal Bacillus) adalah `0,4 ml per m³ air`, maka:
  `1.500 m³ × 0,4 ml = 600 ml`

*Penjelasan ke Juri:* "Petambak sering salah menakar probiotik hanya dari luas kolam. AI kita menghitung kubikasi air secara 3D (panjang × lebar × kedalaman), sehingga dosis 600 ml yang direkomendasikan sangat akurat untuk menetralisir kualitas air 1.500 meter kubik."
