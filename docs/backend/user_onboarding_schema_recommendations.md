# Aura Apex — User Onboarding & Database Schema Recommendations

> **Target Audience:** Backend & Database Engineering Team  
> **Status:** Recommended Proposal  
> **Domain:** Auth & User Profiles (`profiles` domain)

---

## 1. Overview & Context

The mobile and web client applications feature two distinct onboarding experiences:

1. **App Intro / Walkthrough Slides (`OnboardingScreen`)**:
   * **Scope**: Purely local UI intro screens for unauthenticated guest users.
   * **Storage**: Managed on the client via `AsyncStorage` (`has_seen_onboarding: true`).
   * **Backend Requirement**: None.

2. **User Profile Onboarding (`ProfileSetupScreen`)**:
   * **Scope**: User fitness preferences, physical metrics (height/weight), health conditions, and onboarding completion status collected after user registration/login.
   * **Storage**: Persistent database storage in Supabase / PostgreSQL (`profiles` table).
   * **Backend Requirement**: Schema extension and profile update API endpoint support.

---

## 2. Proposed Database Schema Changes

To allow persistent tracking of user onboarding completion across device switches and app reinstalls, we recommend extending the `public.profiles` table.

### Option A: Structured Schema Columns (Recommended)

Adds explicit, typed columns for fitness metrics and onboarding status.

```sql
-- ============================================================================
-- Migration: Add User Onboarding & Fitness Profile Columns to profiles
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS fitness_level TEXT,            -- e.g. 'beginner', 'intermediate', 'advanced'
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,             -- e.g. 'weight_loss', 'muscle_gain', 'endurance', 'overall_fitness'
  ADD COLUMN IF NOT EXISTS training_frequency TEXT,       -- e.g. '2-3_days', '4-5_days', 'daily'
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS gym_preference TEXT,
  ADD COLUMN IF NOT EXISTS has_health_condition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS health_conditions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dietary_preference TEXT;

-- Index for quick lookups on onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles (onboarding_completed) WHERE onboarding_completed = FALSE;
```

---

### Option B: Flexible JSONB Column (Lightweight Alternative)

If the backend team prefers avoiding multiple new columns, a single `fitness_profile` `JSONB` document column can be added alongside the boolean flag:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fitness_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
```

---

## 3. Backend API Specifications

### 3.1. Fetch Current User Profile
* **Method:** `GET`
* **Path:** `/api/v1/auth/me`
* **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "fullName": "Aman Mahadik",
    "phone": "+919876543210",
    "avatarUrl": null,
    "role": "customer",
    "status": "active",
    "onboardingCompleted": true,
    "dateOfBirth": "1998-05-15",
    "gender": "male",
    "weightKg": 75.0,
    "heightCm": 178.0,
    "fitnessLevel": "intermediate",
    "fitnessGoal": "muscle_gain",
    "trainingFrequency": "4-5_days",
    "locationAddress": "Mumbai, India",
    "hasHealthCondition": false,
    "healthConditions": [],
    "dietaryPreference": "high_protein"
  }
}
```

---

### 3.2. Update User Profile & Complete Onboarding
* **Method:** `PATCH`
* **Path:** `/api/v1/auth/me`
* **Auth:** Required (`Bearer <token>`)

#### Request Body:
```json
{
  "onboardingCompleted": true,
  "dateOfBirth": "1998-05-15",
  "gender": "male",
  "weightKg": 75.0,
  "heightCm": 178.0,
  "fitnessLevel": "intermediate",
  "fitnessGoal": "muscle_gain",
  "trainingFrequency": "4-5_days",
  "locationAddress": "Mumbai, India",
  "hasHealthCondition": false,
  "healthConditions": [],
  "dietaryPreference": "high_protein"
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "onboardingCompleted": true,
    "updatedAt": "2026-08-18T20:40:00Z"
  }
}
```

---

## 4. Frontend Integration Summary

1. **Session Hydration**: On app startup, the frontend retrieves the user profile from `/api/v1/auth/me`.
2. **Navigation Decision**:
   - If `onboardingCompleted === false`, the router directs the customer to the `ProfileSetup` screen.
   - If `onboardingCompleted === true`, the router directs the customer straight to `MainTabs` (`HomeScreen`).
