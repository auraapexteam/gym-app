# Progress Logbook API

- **Purpose**: Documents the REST endpoints for the customer-facing Progress Logbook module.
- **Scope**: Weight, water, protein, and photo log endpoints. Calendar month aggregation.
- **Related Documents**: [Database Architecture](./database.md), [API Design](./api.md)
- **Last Updated**: 2026-07-14

---

## Overview

The Progress Logbook lets customers log and track daily fitness metrics:

| Metric | Unit | Table |
|---|---|---|
| Body weight | kg (NUMERIC 5,2) | `progress_logs` |
| Water intake | ml (INTEGER) | `water_logs` |
| Protein intake | g (INTEGER) | `protein_logs` |
| Step count | steps (INTEGER) | `steps_logs` |
| Daily note | text (TEXT) | `notes_logs` |
| Sleep tracking | duration_minutes (INT), quality (VARCHAR) | `sleep_logs` |
| Progress photo | URL (TEXT) | `progress_images` |

All logs are **per-day and per-profile**. Submitting the same metric on the same date **upserts** (overwrites) the existing row.

All endpoints require an authenticated JWT (`Authorization: Bearer <token>`).

Base path: `/api/v1/progress`

---

## Endpoints

### GET /progress/month

Fetch all log types for a given calendar month.

**Query Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `year` | integer (4-digit) | ✅ | e.g. `2026` |
| `month` | integer (1–12) | ✅ | e.g. `9` for September |

**Response 200**

```json
{
  "success": true,
  "message": "Month summary fetched successfully",
  "data": {
    "weightLogs": [
      { "id": "uuid", "weight": "72.50", "log_date": "2026-09-01" }
    ],
    "waterLogs": [
      { "id": "uuid", "amount_ml": 2500, "log_date": "2026-09-01" }
    ],
    "proteinLogs": [
      { "id": "uuid", "amount_g": 150, "log_date": "2026-09-01" }
    ],
    "stepsLogs": [
      { "id": "uuid", "steps": 8500, "log_date": "2026-09-01" }
    ],
    "notesLogs": [
      { "id": "uuid", "note": "Felt energetic today!", "log_date": "2026-09-01" }
    ],
    "sleepLogs": [
      { "id": "uuid", "duration_minutes": 465, "quality": "Good", "log_date": "2026-09-01" }
    ],
    "imageLogs": [
      { "id": "uuid", "image_url": "https://...", "log_date": "2026-09-01" }
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
  "logDate": "2026-09-15"
}
```

**Validation**

- `amountG`: non-negative integer (max 1 000 g)
- `logDate`: format `YYYY-MM-DD`

---

### POST /progress/note

Log or update a daily note / workout reflection.

**Request Body**

```json
{
  "note": "Felt energetic today during chest workout. Stretched for 15 mins.",
  "logDate": "2026-09-15"
}
```

**Validation**

- `note`: string, non-empty, max length 1 000 characters
- `logDate`: format `YYYY-MM-DD`

**Response 200**

```json
{
  "success": true,
  "message": "Daily note saved successfully",
  "data": {
    "id": "uuid",
    "profile_id": "user-uuid",
    "note": "Felt energetic today during chest workout. Stretched for 15 mins.",
    "log_date": "2026-09-15",
    "created_at": "2026-09-15T10:00:00.000Z"
  }
}
```

---

### POST /progress/sleep

Log or update daily sleep metrics.

**Request Body**

```json
{
  "durationMinutes": 465,
  "quality": "Good",
  "logDate": "2026-09-15"
}
```

**Validation**

- `durationMinutes`: integer, 0 to 1 440 minutes (24 hours)
- `quality`: string enum (`"Excellent" | "Good" | "Fair" | "Poor"`), default `"Good"`
- `logDate`: format `YYYY-MM-DD`

**Response 200**

```json
{
  "success": true,
  "message": "Sleep log saved successfully",
  "data": {
    "id": "uuid",
    "profile_id": "user-uuid",
    "duration_minutes": 465,
    "quality": "Good",
    "log_date": "2026-09-15",
    "created_at": "2026-09-15T10:00:00.000Z"
  }
}
```

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
  "logDate": "2026-09-15"
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

## Workout Routine Breakdown Endpoints

Base path: `/api/v1/workouts`

### GET /workouts/history

Fetch chronological workout history with exercise breakdowns for the authenticated customer.

**Query Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | ❌ | Default `50` |
| `offset` | integer | ❌ | Default `0` |

**Response 200**

```json
{
  "success": true,
  "message": "Workout history retrieved successfully",
  "data": [
    {
      "id": "w-101",
      "workoutName": "Chest + Triceps",
      "category": "Push Day",
      "durationMin": 55,
      "caloriesBurned": 420,
      "exercisesCount": 8,
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": 10, "weightKg": 80 }
      ],
      "logDate": "2026-07-30"
    }
  ]
}
```

### POST /workouts

Log a detailed exercise routine.

**Request Body**

```json
{
  "workoutName": "Chest + Triceps",
  "category": "Push Day",
  "durationMin": 55,
  "caloriesBurned": 420,
  "exercisesCount": 8,
  "exercises": [
    { "name": "Bench Press", "sets": 4, "reps": 10, "weightKg": 80, "notes": "Felt strong" }
  ],
  "logDate": "2026-07-30"
}
```

---

## Error Codes

| Code | Meaning |
|---|---|
| `WEIGHT_LOG_FAILED` | Supabase upsert error on weight log |
| `WATER_LOG_FAILED` | Supabase upsert error on water log |
| `PROTEIN_LOG_FAILED` | Supabase upsert error on protein log |
| `IMAGE_LOG_FAILED` | Supabase upsert error on image log |
| `NOTE_LOG_FAILED` | Supabase upsert error on daily note log |
| `SLEEP_LOG_FAILED` | Supabase upsert error on sleep log |
| `FETCH_LOGS_FAILED` | Error fetching month summary from one or more tables |
| `WORKOUT_LOG_FAILED` | Error creating or fetching workout logs |


