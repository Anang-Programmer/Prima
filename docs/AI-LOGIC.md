<!-- Formula dan logika AI untuk rekomendasi pakan dan probiotik -->

# AI-LOGIC - AI Recommendation Logic

## 1. Overview

Dokumen ini menjelaskan formula, logika, dan standar yang digunakan untuk menghasilkan rekomendasi AI dalam sistem budidaya udang.

**Acuan Data:**
- Kementerian Kelautan dan Perikanan (KKP)
- Best practice industri budidaya udang vaname
- Research paper aquaculture

---

## 1.5. Daftar Istilah Penting (Glossary)

Agar tidak bingung membaca rumus-rumus di bawah atau saat presentasi, berikut adalah arti istilah teknis yang wajib diketahui:

- **DOC (*Day of Culture*):** Umur udang, dihitung sejak hari pertama bibit ditebar ke kolam.
- **Biomassa:** Total berat keseluruhan udang yang masih hidup di dalam satu kolam saat ini (satuannya Kilogram).
- **ABW (*Average Body Weight*):** Rata-rata berat badan untuk **satu ekor** udang (satuannya gram).
- **SR (*Survival Rate*):** Persentase Tingkat Kehidupan, alias berapa persen udang yang diprediksi masih hidup jika dibandingkan dengan jumlah tebar benur di awal.
- **Feeding Rate (FR):** Porsi jatah makan harian. Ini adalah persentase pakan yang harus ditebar, dihitung dari total berat badan udang (Biomassa).
- **FCR (*Feed Conversion Ratio*):** Rasio efisiensi pakan (Berapa kilogram pakan yang dihabiskan untuk menghasilkan 1 kilogram udang). Makin kecil nilainya, makin hemat!

---

## 2. Feeding Rate Formula

### 2.1 Base Formula

```
Daily Feed (kg) = Biomass × Feeding Rate (%)
```

**Where:**
- `Biomass = Shrimp Count × Average Body Weight (ABW)`
- `Feeding Rate` varies by DOC (Day of Culture)

### 2.2 Feeding Rate by DOC

| Umur (Hari/DOC) | Feeding Rate (% Biomassa) | Frekuensi | Waktu Cek Anco (Jam) |
|-----------------|---------------------------|-----------|----------------------|
| 1 - 15          | 15 - 25%                  | 4x/hari   | -                    |
| 16 - 30         | 10 - 15%                  | 4x/hari   | -                    |
| 31 - 45         | 7 - 10%                   | 4x/hari   | 2,0 - 3,0 jam        |
| 46 - 60         | 5 - 7%                    | 4x/hari   | 2,0 - 2,5 jam        |
| 61 - 75         | 2 - 5%                    | 4x/hari   | 1,5 - 2,0 jam        |
| 76 - 90         | 2 - 5%                    | 4x/hari   | 1,5 - 2,0 jam        |
| 91 - 105        | 1 - 1.5%                  | 4-5x/hari | 1,0 - 1,5 jam        |
| 106 - 120       | 1 - 1.5%                  | 4-5x/hari | 1,0 - 1,5 jam        |
*(Sumber: SNI 8008:2014 & Penyesuaian Lapangan)*

### 2.3 Average Body Weight (ABW) Estimation

Jika tidak ada data sampling, gunakan estimasi standar:

```
ABW (gram) = 0.0005 × DOC^2 + 0.05 × DOC
```

**Example:**
- DOC 30: ABW ≈ 2g
- DOC 60: ABW ≈ 6g
- DOC 90: ABW ≈ 9g

### 2.4 Survival Rate (SR) Adjustment

```
Actual Biomass = Initial Shrimp Count × Survival Rate × ABW
```

**Default SR (jika tidak ada sampling):**
- DOC 1-30: 95%
- DOC 31-60: 90%
- DOC 61-90: 85%
- DOC 91+: 80%

### 2.5 Complete Formula

```python
def calculate_daily_feed(shrimp_count, doc, pond_area_m2):
    # Estimate ABW
    abw_gram = 0.0005 * (doc ** 2) + 0.05 * doc
    
    # Estimate Survival Rate
    if doc <= 30:
        sr = 0.95
    elif doc <= 60:
        sr = 0.90
    elif doc <= 90:
        sr = 0.85
    else:
        sr = 0.80
    
    # Calculate Biomass (kg)
    biomass_kg = (shrimp_count * sr * abw_gram) / 1000
    
    # Determine Feeding Rate (Based on SNI 8008:2014)
    if doc <= 15:
        feeding_rate = 0.20  # 20% (avg of 15-25%)
    elif doc <= 30:
        feeding_rate = 0.125 # 12.5% (avg of 10-15%)
    elif doc <= 45:
        feeding_rate = 0.085 # 8.5% (avg of 7-10%)
    elif doc <= 60:
        feeding_rate = 0.06  # 6% (avg of 5-7%)
    elif doc <= 90:
        feeding_rate = 0.035 # 3.5% (avg of 2-5%)
    else:
        feeding_rate = 0.0125 # 1.25% (avg of 1-1.5%)
    
    # Calculate daily feed
    daily_feed_kg = biomass_kg * feeding_rate
    
    # Density adjustment (optional)
    density_per_m2 = (shrimp_count * sr) / pond_area_m2
    if density_per_m2 > 100:  # High density
        daily_feed_kg *= 1.1  # +10%
    elif density_per_m2 < 50:  # Low density
        daily_feed_kg *= 0.95  # -5%
    
    return round(daily_feed_kg, 2)
```

---

## 3. Probiotic Dosage Formula

### 3.1 Base Formula

```
Probiotic Volume (ml) = Pond Volume (m³) × Dosage Rate (ml/m³)
```

### 3.2 Pond Volume Calculation

```
Pond Volume (m³) = Pond Area (m²) × Average Depth (m)
```

**Default depth:** 1.5m (standard tambak udang vaname)

### 3.3 Standar Acuan Dosis (SNI / Literatur)

| Fase | Acuan Dosis | Frekuensi | Metode Aplikasi |
|------|-------------|-----------|-----------------|
| **Nursery (Pendederan)** | 2–4 mL/kg pakan | Mengikuti jadwal pakan | Melalui pakan (dicampur) |
| **Pembesaran (Reguler)** | 1–5 mg/L air | 1x / minggu | Ditebar ke air |
| **Pembesaran (Intensif)**| 20–40 L/petak | Setiap 3 hari | Ditebar ke air |
| **Pra-Panen** | Mengikuti produk | Sesuai kondisi | Ke air / pakan |

*Catatan: Angka di atas adalah acuan awal dari literatur (baseline AI). Untuk produk komersial, dosis final direkomendasikan mengikuti instruksi pada kemasan produk.*

### 3.4 Logika Rekomendasi AI untuk Probiotik

- Jika DOC < 30 (Fase Nursery): AI merekomendasikan pencampuran probiotik via pakan.
- Jika DOC > 30 (Pembesaran): AI merekomendasikan aplikasi probiotik ke air secara rutin (tiap minggu/3 hari).

### 3.5 Complete Formula

```python
def calculate_probiotic_dosage(pond_area_m2, doc):
    # Default depth
    average_depth_m = 1.5
    
    # Calculate volume
    pond_volume_m3 = pond_area_m2 * average_depth_m
    
    # Determine dosage rate based on DOC
    if doc <= 30:
        dosage_rate = 2.5  # ml/m³ (growth promotion)
        probiotic_type = "Bacillus spp."
        frequency = "2x per minggu"
    elif doc <= 60:
        dosage_rate = 2.0  # ml/m³
        probiotic_type = "Lactobacillus"
        frequency = "2x per minggu"
    else:
        dosage_rate = 1.5  # ml/m³ (maintenance)
        probiotic_type = "Mix Bacillus + Lactobacillus"
        frequency = "1x per minggu"
    
    # Calculate total dosage
    probiotic_ml = pond_volume_m3 * dosage_rate
    
    return {
        "amount_ml": round(probiotic_ml, 2),
        "type": probiotic_type,
        "frequency": frequency
    }
```

---

## 4. Feed Conversion Ratio (FCR)

### 4.1 Formula

```
FCR = Total Feed Used (kg) / Harvest Weight (kg)
```

**Ideal FCR for vaname:** 1.0 - 1.3
- FCR < 1.0: Sangat baik (jarang tercapai)
- FCR 1.0-1.3: Baik
- FCR 1.3-1.5: Cukup
- FCR > 1.5: Perlu evaluasi

### 4.2 Factors Affecting FCR

- Kualitas pakan
- Feeding management
- Water quality
- Stocking density
- Shrimp health

---

## 5. Survival Rate (SR)

### 5.1 Formula

```
SR (%) = (Harvest Count / Initial Stocking Count) × 100
```

**Target SR untuk vaname:** 75-85%

---

## 6. Production Yield

### 6.1 Formula

```
Yield (kg/m²) = Harvest Weight (kg) / Pond Area (m²)
```

**Target yield vaname:** 2-4 kg/m²/cycle

### 6.2 Annual Production

```
Annual Production = Yield × Number of Cycles per Year
```

Typical: 2.5-3 cycles/year

---

## 7. AI Reasoning Logic

### 7.1 Recommendation Generation

Saat generate rekomendasi, AI harus:

1. **Calculate current DOC**
   ```
   DOC = CURRENT_DATE - cycle.start_date
   ```

2. **Fetch historical data**
   - Total feed used to date
   - Feeding patterns
   - Any manual adjustments by user

3. **Apply formula**
   - Use base formula dengan DOC
   - Apply adjustments (density, season, etc.)

4. **Generate reasoning text**
   ```
   "Berdasarkan DOC {doc} dengan populasi {shrimp_count} ekor 
   dan luas kolam {area} m², rekomendasi pakan adalah {amount} kg/hari 
   dengan feeding rate {rate}%. Estimasi biomass saat ini: {biomass} kg."
   ```

### 7.2 Dynamic Adjustments (Berdasarkan Anco)

Jika petambak mencatat hasil Anco dari pemberian pakan sebelumnya, AI akan melakukan koreksi untuk rekomendasi pakan berikutnya:
- **Jika Anco = "Habis":** Pertahankan pakan (atau naikkan perlahan sesuai target).
- **Jika Anco = "Sisa Sedikit":** Kurangi pakan sebesar 5% - 10% untuk sesi berikutnya.
- **Jika Anco = "Sisa Banyak":** Kurangi pakan sebesar 20% - 30% atau puasapan sesaat, dan berikan `Warning`.

### 7.3 Warnings & Alerts

**High Density Warning (> 100 shrimp/m²):**
```
"Kepadatan tebar tinggi ({density}/m²). 
Tingkatkan frekuensi feeding dan monitoring kualitas air."
```

**Low Growth Warning (FCR > 1.5):**
```
"FCR tinggi ({fcr}). Evaluasi kualitas pakan dan 
kondisi lingkungan tambak."
```

**Pre-Harvest Recommendation (DOC > 90):**
```
"Mendekati panen (DOC {doc}). Pertimbangkan 
untuk mulai mengurangi pakan secara bertahap."
```

---

## 8. Validation Rules

### 8.1 Input Validation

- `shrimp_count`: 1 - 10,000,000
- `pond_area_m2`: 1 - 100,000
- `doc`: 0 - 180 (max 6 months)

### 8.2 Output Validation

- `daily_feed_kg`: 0.1 - 10,000
- `probiotic_ml`: 10 - 100,000

### 8.3 Anomaly Detection

Jika rekomendasi jauh berbeda dari normal:
```python
def validate_recommendation(feed_kg, historical_avg):
    if feed_kg > historical_avg * 2:
        return "WARNING: Rekomendasi jauh lebih tinggi dari biasanya"
    elif feed_kg < historical_avg * 0.5:
        return "WARNING: Rekomendasi jauh lebih rendah dari biasanya"
    return "OK"
```

---

## 9. Future Enhancements (Post-MVP)

- [ ] Machine learning model trained on actual farm data
- [ ] Water quality parameter integration (pH, DO, temperature)
- [ ] Weather-based adjustments
- [ ] Disease prediction model
- [ ] Price optimization (feed cost vs growth rate)
- [ ] Regional variation support

---

## 10. References

**Research Papers:**
- FAO Technical Guidelines for Shrimp Farming
- KKP Standard Operating Procedures for Vaname Culture
- Journal of Aquaculture Research (feeding optimization studies)

**Industry Standards:**
- CP Prima Feed Management Guide
- Japfa Comfeed Aquaculture Manual

---

## 11. Implementation Notes

**API Endpoint:**
```
POST /api/cycles/:cycleId/recommendation/generate
```

**Response Format:**
```json
{
  "doc": 38,
  "recommended_feed_kg": 42.5,
  "recommended_probiotic_ml": 600,
  "reasoning": "Berdasarkan DOC 38 dengan populasi 100.000 ekor...",
  "warnings": [],
  "feeding_frequency": "4x per hari",
  "probiotic_frequency": "2x per minggu"
}
```

**Caching Strategy:**
- Generate once per day
- Invalidate if user updates shrimp_count
- Store in `recommendations` table

---

## 12. Testing

### 12.1 Unit Tests

```python
def test_feeding_calculation():
    assert calculate_daily_feed(100000, 30, 500) == 10.5
    assert calculate_daily_feed(50000, 60, 1000) == 13.5
```

### 12.2 Edge Cases

- DOC = 0 (first day)
- Very high density (>150/m²)
- Very low density (<20/m²)
- Large pond (>5000m²)
- Small pond (<100m²)
