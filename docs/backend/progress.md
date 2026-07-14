# Progress Logbook API

- **Purpose**: Documents the REST endpoints for the customer-facing Progress Logbook module.
- **Scope**: Weight, water, protein, and photo log endpoints. Calendar month aggregation.
- **Related Documents**: [Database Architecture](./database.md), [API Design](./api.md)
- **Last Updated**: 2026-07-14

---

## Overview

The Progress Logbook lets customers log and track four daily fitness metrics:

| Metric | Unit | Table |
|---|---|---|
| Body weight | kg (NUMERIC 5,2) | `progress_logs` |
| Water intake | ml (INTEGER) | `water_logs` |
| Protein intake | g (INTEGER) | `protein_logs` |
| Progress photo | URL (TEXT) | `progress_images` |

All logs are **per-day and per-profile**. Submitting the same metric on the same date **upserts** (overwrites) the existing row.

All endpoints require an authenticated JWT (`Authorization: Bearer <token>`).

Base path: `/api/v1/progress`

---

## Endpoints

### GET /progress/month

Fetch all four log types for a given calendar month.

**Query Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `year` | integer (4-digit) | ✅ | e.g. `2026` |
| `month` | integer (1–12) | ✅ | e.g. `7` for July |

**Response 200**

```json
{
  "success": true,
  "message": "Month summary fetched successfully",
  "data": {
    "weightLogs": [
      { "id": "uuid", "weight": "72.50", "log_date": "2026-07-01" }
    ],
    "waterLogs": [
      { "id": "uuid", "amount_ml": 2500, "log_date": "2026-07-01" }
    ],
    "proteinLogs": [
      { "id": "uuid", "amount_g": 150, "log_date": "2026-07-01" }
    ],
    "imageLogs": [
      { "id": "uuid", "image_url": "https://...", "log_date": "2026-07-01" }
    ]
  }
}
```

---

### POST /progress/weight

Log or update today's (or any past date's) body weight.

**Request Body**

```json
{
  "weight": 72.5,
  "logDate": "2026-07-14"
}
```

**Validation**

- `weight`: positive number
- `logDate`: format `YYYY-MM-DD`

**Response 200** — Returns the upserted row.

---

### POST /progress/water

Log or update daily water intake.

**Request Body**

```json
{
  "amountMl": 2500,
  "logDate": "2026-07-14"
}
```

**Validation**

- `amountMl`: non-negative integer
- `logDate`: format `YYYY-MM-DD`

---

### POST /progress/protein

Log or update daily protein intake.

**Request Body**

```json
{
  "amountG": 150,
  "logDate": "2026-07-14"
}
```

**Validation**

- `amountG`: non-negative integer
- `logDate`: format `YYYY-MM-DD`

---

### POST /progress/image

Save the public URL of a progress photo for a given date.

> **Note:** Binary upload goes directly to Supabase Storage via a pre-signed URL.  
> Use `POST /gallery/upload-url` to obtain the upload URL first, then `PUT` the binary,  
> then call this endpoint with the resulting `publicUrl`.

**Request Body**

```json
{
  "imageUrl": "https://your-bucket.supabase.co/storage/v1/object/public/progress/...",
  "logDate": "2026-07-14"
}
```

**Validation**

- `imageUrl`: valid URL string
- `logDate`: format `YYYY-MM-DD`

---

## Photo Upload Flow

```
1. POST /gallery/upload-url
   body: { fileName, contentType, folder: "progress" }
   → returns { uploadUrl, publicUrl }

2. PUT uploadUrl
   headers: { Content-Type: <image mime type> }
   body: <binary file>

3. POST /progress/image
   body: { imageUrl: publicUrl, logDate }
```

---

## Error Codes

| Code | Meaning |
|---|---|
| `WEIGHT_LOG_FAILED` | Supabase upsert error on weight log |
| `WATER_LOG_FAILED` | Supabase upsert error on water log |
| `PROTEIN_LOG_FAILED` | Supabase upsert error on protein log |
| `IMAGE_LOG_FAILED` | Supabase upsert error on image log |
| `FETCH_LOGS_FAILED` | Error fetching month summary from one or more tables |
