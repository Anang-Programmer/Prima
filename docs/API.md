<!-- API endpoints dan contracts untuk komunikasi frontend-backend -->

# API - Endpoints & Contracts

## 1. Overview

API menggunakan **Next.js Route Handlers** dengan format response standar.

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://[domain]/api`

### Response Format

```typescript
// Success
{
  "data": T,
  "error": null,
  "message": "Success message"
}

// Error
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "message": null
}
```

### Authentication

Semua endpoint (kecuali auth) memerlukan autentikasi via Supabase session cookie.

---

## 2. Auth Endpoints

> Auth ditangani oleh Supabase Auth, bukan custom API.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register user baru |
| POST | `/auth/signin` | Login |
| POST | `/auth/signout` | Logout |
| POST | `/auth/reset-password` | Request reset password |

---

## 3. Ponds Endpoints

### 3.1 GET `/api/ponds`

Ambil semua kolam milik user.

**Response:**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "name": "Kolam A1",
      "area_m2": 500,
      "depth_m": 1.5,
      "location": "Sidoarjo",
      "created_at": "2026-08-01T00:00:00Z",
      "active_cycle": {
        "id": "uuid",
        "shrimp_count": 100000,
        "start_date": "2026-07-01",
        "doc": 38
      } | null
    }
  ],
  "error": null
}
```

---

### 3.2 GET `/api/ponds/:id`

Ambil detail kolam.

**Response:**
```typescript
{
  "data": {
    "id": "uuid",
    "name": "Kolam A1",
    "area_m2": 500,
    "depth_m": 1.5,
    "location": "Sidoarjo",
    "created_at": "2026-08-01T00:00:00Z",
    "updated_at": "2026-08-01T00:00:00Z",
    "active_cycle": { ... } | null,
    "cycles_count": 3
  },
  "error": null
}
```

---

### 3.3 POST `/api/ponds`

Tambah kolam baru.

**Request Body:**
```typescript
{
  "name": "Kolam A1",       // required, max 100 chars
  "area_m2": 500,           // required, > 0
  "depth_m": 1.5,           // required, > 0
  "location": "Sidoarjo"    // optional
}
```

**Response:**
```typescript
{
  "data": {
    "id": "uuid",
    "name": "Kolam A1",
    "area_m2": 500,
    "depth_m": 1.5,
    "location": "Sidoarjo",
    "created_at": "2026-08-01T00:00:00Z"
  },
  "error": null,
  "message": "Kolam berhasil ditambahkan"
}
```

---

### 3.4 PUT `/api/ponds/:id`

Update data kolam.

**Request Body:**
```typescript
{
  "name": "Kolam A1 Updated",  // optional
  "area_m2": 600,              // optional
  "depth_m": 1.5,              // optional
  "location": "Gresik"         // optional
}
```

**Response:**
```typescript
{
  "data": { ... updated pond },
  "error": null,
  "message": "Kolam berhasil diupdate"
}
```

---

### 3.5 DELETE `/api/ponds/:id`

Hapus kolam (cascade delete cycles dan logs).

**Response:**
```typescript
{
  "data": null,
  "error": null,
  "message": "Kolam berhasil dihapus"
}
```

---

## 4. Cycles Endpoints

### 4.1 GET `/api/ponds/:pondId/cycles`

Ambil semua siklus untuk kolam tertentu.

**Query Params:**
- `status`: `active` | `completed` | `all` (default: `all`)

**Response:**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "pond_id": "uuid",
      "shrimp_count": 100000,
      "shrimp_type": "vaname",
      "start_date": "2026-07-01",
      "end_date": null,
      "harvest_weight_kg": null,
      "status": "active",
      "doc": 38
    }
  ],
  "error": null
}
```

---

### 4.2 GET `/api/cycles/:id`

Ambil detail siklus.

**Response:**
```typescript
{
  "data": {
    "id": "uuid",
    "pond_id": "uuid",
    "pond_name": "Kolam A1",
    "shrimp_count": 100000,
    "shrimp_type": "vaname",
    "start_date": "2026-07-01",
    "end_date": null,
    "harvest_weight_kg": null,
    "status": "active",
    "doc": 38,
    "total_feed_kg": 1250.5,
    "total_probiotic_ml": 3000,
    "feed_logs_count": 114,
    "probiotic_logs_count": 38
  },
  "error": null
}
```

---

### 4.3 POST `/api/ponds/:pondId/cycles`

Mulai siklus baru.

**Request Body:**
```typescript
{
  "shrimp_count": 100000,         // required, > 0
  "shrimp_type": "vaname",        // optional, default "vaname"
  "start_date": "2026-07-01",     // required
  "notes": "Siklus ke-4"          // optional
}
```

**Response:**
```typescript
{
  "data": { ... created cycle },
  "error": null,
  "message": "Siklus berhasil dimulai"
}
```

---

### 4.4 PUT `/api/cycles/:id`

Update siklus (termasuk akhiri siklus).

**Request Body (akhiri siklus):**
```typescript
{
  "status": "completed",
  "end_date": "2026-10-15",
  "harvest_weight_kg": 3500,
  "notes": "Panen sukses"
}
```

**Response:**
```typescript
{
  "data": { ... updated cycle },
  "error": null,
  "message": "Siklus berhasil diupdate"
}
```

---

### 4.5 GET `/api/cycles/:id/summary`

Ambil ringkasan/evaluasi siklus.

**Response:**
```typescript
{
  "data": {
    "cycle_id": "uuid",
    "duration_days": 106,
    "shrimp_count": 100000,
    "harvest_weight_kg": 3500,
    "survival_rate": null,  // jika tidak ada data sampling
    "total_feed_kg": 4200,
    "total_probiotic_ml": 12000,
    "fcr": 1.2,  // Feed Conversion Ratio
    "avg_daily_feed_kg": 39.6,
    "feed_logs_count": 318,
    "probiotic_logs_count": 106,
    "comparison_with_previous": {
      "fcr_diff": -0.1,  // lebih baik dari sebelumnya
      "harvest_diff_kg": 200
    } | null
  },
  "error": null
}
```

---

## 4a. Samplings Endpoints

### 4a.1 GET `/api/cycles/:cycleId/samplings`

Ambil data sampling untuk siklus.

**Response:**
```typescript
{
  "data": [
    {
      "id": "uuid",
      "sampled_at": "2026-08-01T00:00:00Z",
      "sample_count": 100,
      "total_weight_g": 500,
      "abw_g": 5,
      "survival_rate_pct": 90,
      "estimated_biomass_kg": 450
    }
  ],
  "error": null
}
```

---

### 4a.2 POST `/api/cycles/:cycleId/samplings`

Catat data sampling baru.

**Request Body:**
```typescript
{
  "sampled_at": "2026-08-01T00:00:00Z", // optional, default NOW()
  "sample_count": 100,                  // required, > 0
  "total_weight_g": 500,                // required, > 0
  "survival_rate_pct": 90               // optional
}
```

---

## 5. Logs Endpoints

### 5.1 GET `/api/cycles/:cycleId/logs`

Ambil semua log (pakan + probiotik) untuk siklus.

**Query Params:**
- `type`: `feed` | `probiotic` | `all` (default: `all`)
- `date`: `YYYY-MM-DD` (filter tanggal spesifik)
- `from`: `YYYY-MM-DD` (filter dari tanggal)
- `to`: `YYYY-MM-DD` (filter sampai tanggal)
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**
```typescript
{
  "data": {
    "feed_logs": [
      {
        "id": "uuid",
        "feed_type": "Prima Feed",
        "amount_kg": 35.5,
        "feeding_time": "pagi",
        "logged_at": "2026-08-08T06:00:00Z",
        "notes": null
      }
    ],
    "probiotic_logs": [
      {
        "id": "uuid",
        "probiotic_type": "EM4",
        "amount_ml": 500,
        "logged_at": "2026-08-08T06:30:00Z",
        "notes": null
      }
    ],
    "pagination": {
      "total": 200,
      "limit": 50,
      "offset": 0
    }
  },
  "error": null
}
```

---

### 5.2 POST `/api/cycles/:cycleId/feed-logs`

Catat pemberian pakan.

**Request Body:**
```typescript
{
  "feed_type": "Prima Feed",        // optional
  "feed_size": "pelet 1.5mm",       // optional
  "amount_kg": 35.5,                // required, > 0
  "feeding_time": "pagi",           // optional
  "feeding_rate_pct": 3.5,          // optional
  "anco_result": "Habis",           // optional
  "logged_at": "2026-08-08T06:00:00Z",
  "notes": "Udang agresif"
}
```

**Response:**
```typescript
{
  "data": { ... created feed_log },
  "error": null,
  "message": "Log pakan berhasil disimpan"
}
```

---

### 5.3 POST `/api/cycles/:cycleId/probiotic-logs`

Catat pemberian probiotik.

**Request Body:**
```typescript
{
  "probiotic_type": "EM4",            // optional
  "application_method": "ke air",     // optional
  "dosage": 5,                        // optional
  "dosage_unit": "mg/L",              // optional
  "amount_ml": 500,                   // required, > 0
  "frequency": "1x/minggu",           // optional
  "feeding_time": "pagi",             // optional
  "logged_at": "2026-08-08T06:30:00Z",
  "notes": null
}
```

**Response:**
```typescript
{
  "data": { ... created probiotic_log },
  "error": null,
  "message": "Log probiotik berhasil disimpan"
}
```

---

### 5.4 DELETE `/api/feed-logs/:id`

Hapus log pakan.

### 5.5 DELETE `/api/probiotic-logs/:id`

Hapus log probiotik.

---

## 6. AI Recommendation Endpoints

### 6.1 GET `/api/cycles/:cycleId/recommendation`

Ambil rekomendasi terbaru untuk siklus.

**Response:**
```typescript
{
  "data": {
    "id": "uuid",
    "cycle_id": "uuid",
    "doc": 38,
    "recommended_feed_kg": 42.5,
    "recommended_probiotic_ml": 600,
    "reasoning": "Berdasarkan DOC 38 dengan populasi 100.000 ekor dan luas kolam 500m², rekomendasi pakan adalah 42.5 kg/hari dengan feeding rate 4.25% dari biomass.",
    "created_at": "2026-08-08T00:00:00Z"
  },
  "error": null
}
```

---

### 6.2 POST `/api/cycles/:cycleId/recommendation/generate`

Generate rekomendasi baru dari AI.

**Request Body:**
```typescript
{
  "force_refresh": false  // optional, kalau true akan generate ulang meski sudah ada hari ini
}
```

**Response:**
```typescript
{
  "data": { ... new recommendation },
  "error": null,
  "message": "Rekomendasi berhasil di-generate"
}
```

---

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User tidak login |
| `FORBIDDEN` | 403 | Tidak punya akses ke resource |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `VALIDATION_ERROR` | 400 | Input tidak valid |
| `CONFLICT` | 409 | Konflik (misal: sudah ada siklus aktif) |
| `INTERNAL_ERROR` | 500 | Server error |
| `AI_ERROR` | 503 | AI service tidak available |

---

## 8. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/cycles/:id/recommendation/generate` | 10 req/hour per user |
| Other endpoints | 100 req/minute per user |

---

## 9. Validation Rules

### Pond
- `name`: required, string, max 100 chars
- `area_m2`: required, number, > 0, ≤ 100000
- `depth_m`: required, number, > 0, ≤ 10
- `location`: optional, string

### Cycle
- `shrimp_count`: required, integer, > 0, ≤ 10000000
- `shrimp_type`: optional, string, default 'vaname'
- `start_date`: required, date, tidak boleh di masa depan
- `harvest_weight_kg`: optional, number, > 0
- `status`: enum ('active', 'completed')

### Sampling
- `sample_count`: required, integer, > 0
- `total_weight_g`: required, number, > 0
- `survival_rate_pct`: optional, number, 0-100

### Feed Log
- `amount_kg`: required, number, > 0, ≤ 10000
- `feeding_time`: optional, enum ('pagi', 'siang', 'sore', 'malam')
- `anco_result`: optional, enum ('Habis', 'Sisa Sedikit', 'Sisa Banyak')
- `feed_type`, `feed_size`: optional, string, max 100 chars

### Probiotic Log
- `amount_ml`: required, number, > 0, ≤ 100000
- `application_method`: optional, enum ('ke air', 'melalui pakan')
- `probiotic_type`: optional, string, max 100 chars

### Business Rules
- Pond tidak bisa dihapus jika memiliki siklus aktif (return `CONFLICT`)
- Hanya boleh 1 siklus aktif per pond
- Log hanya bisa ditambah untuk siklus yang aktif
- Rekomendasi AI dibatasi 10 generate per jam per user
