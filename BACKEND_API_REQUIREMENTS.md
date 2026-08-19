# Backend API Requirements & Endpoint Gap Analysis
**Project**: Aura Apex Fitness Ecosystem (Mobile Application Integration)  
**Target Audience**: Backend Engineering Team  
**Date**: August 14, 2026  
**API Base Path**: `/api/v1`

---

## Executive Summary
This document provides a comprehensive API audit and gap analysis between the mobile frontend UI/UX (`frontend/src`) and the Node.js/Express backend service (`backend/src`).

All primary features (Authentication, Gym Directory, QR Check-in, Logbook Progress, Razorpay Payment Orders/Verification, and Signed Image Uploads) are fully integrated and passing TypeScript builds (`0 compilation errors`).

To achieve complete feature parity with the mobile design system and client workflows, **3 new endpoint modules** and **1 RBAC permission adjustment** are documented below for implementation by the backend team.

---

## 1. Required New Backend Endpoints

### 1.1 Saved / Bookmarked Gyms Feature
* **Context**: In the mobile `ProfileScreen` and `ExploreScreen`, users can bookmark/save partner gyms to quickly access their details.

#### 1. `GET /api/v1/gyms/saved`
* **Description**: Returns a list of gyms bookmarked by the authenticated user.
* **Authentication**: Required (`Bearer <JWT>`)
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "gym-uuid-1",
      "name": "Cult.fit Koramangala",
      "address": "Koramangala, Bengaluru",
      "rating": 4.8,
      "monthlyPrice": 999,
      "imageUrl": "https://..."
    }
  ]
}
```

#### 2. `POST /api/v1/gyms/:id/bookmark`
* **Description**: Toggles bookmark status for a gym (saves if not saved, removes if already saved).
* **Authentication**: Required (`Bearer <JWT>`)
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "isSaved": true,
    "gymId": "gym-uuid-1"
  }
}
```

---

### 1.2 Phone SMS / OTP Authentication Flow (Optional Upgrade)
* **Context**: The mobile `LoginScreen` contains a tab switcher for `Phone` vs `Email` mode (`IN +91 | Mobile number`). Currently, phone logins are converted to email aliases. Implementing native OTP verification will enhance mobile conversion.

#### 1. `POST /api/v1/auth/phone-otp`
* **Description**: Triggers SMS OTP code generation via Twilio / Supabase Auth.
* **Payload**:
```json
{
  "phone": "+919876543210"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "message": "OTP sent to +919876543210"
}
```

#### 2. `POST /api/v1/auth/verify-otp`
* **Description**: Verifies 6-digit OTP code and returns Supabase JWT session tokens.
* **Payload**:
```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```

---

### 1.3 Detailed Workout Log Breakdown Endpoints
* **Context**: `ProgressScreen` displays workout analytics (`24 Workouts this month`, `12,480 kcal burned`, `58 min Avg`). Currently, basic metrics (weight, water, protein, steps) are stored via `/progress/*`. Adding a dedicated workout log endpoint allows logging specific exercise routines.

#### 1. `GET /api/v1/workouts/history`
* **Description**: Returns detailed exercise logs (e.g. `Push Day - Chest + Triceps`, 8 exercises, 55 min).
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "w-101",
      "workoutName": "Chest + Triceps",
      "category": "Push Day",
      "durationMin": 55,
      "caloriesBurned": 420,
      "exercisesCount": 8,
      "logDate": "2026-07-30"
    }
  ]
}
```

---

## 2. Required Authorization / RBAC Permission Adjustments

### 2.1 Customer Subscription Self-Service Cancellation
* **Current Behavior**: `POST /api/v1/subscriptions/:id/cancel` in `subscriptions.routes.ts` requires `requirePermission(Permission.SUBSCRIPTION_MANAGE)`.
* **Issue**: Regular customers attempting to cancel their own active membership on `SubscriptionHistoryScreen.tsx` receive a `430 Forbidden` permission error because `SUBSCRIPTION_MANAGE` is restricted to gym owners/staff.
* **Required Change in `subscriptions.routes.ts` / `subscriptions.controller.ts`**:
Allow subscription cancellation if:
1. User has `Permission.SUBSCRIPTION_MANAGE` (gym owner/staff cancellation), **OR**
2. `subscription.user_id === req.user.id` (customer self-service cancellation).

```typescript
// Proposed Controller Modification in backend/src/modules/subscriptions/subscriptions.controller.ts
export class SubscriptionController {
  static async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user.id;
    const isStaff = req.user.roles.includes(Role.OWNER) || req.user.roles.includes(Role.STAFF);

    const subscription = await SubscriptionService.getById(id);
    if (!subscription) {
      throw new NotFoundError('Subscription not found.');
    }

    // Customer can only cancel their own subscription
    if (!isStaff && subscription.userId !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this subscription.');
    }

    const updated = await SubscriptionService.cancel(id);
    return res.json({ success: true, data: updated });
  }
}
```

---

## 3. Audit Summary of Existing & Fully Working Backend Endpoints

The following backend endpoints are **fully operational, tested, and actively consumed** by the frontend app:

| Feature Area | Endpoint | HTTP Method | Status | Consumed By |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/login` | `POST` | ✅ Working | `LoginScreen.tsx` |
| **Auth** | `/api/v1/auth/register` | `POST` | ✅ Working | `SignupScreen.tsx` |
| **Auth** | `/api/v1/auth/forgot-password` | `POST` | ✅ Working | `ForgotPasswordScreen.tsx` |
| **Auth** | `/api/v1/auth/me` | `GET` / `PATCH` | ✅ Working | `ProfileScreen.tsx`, `ProfileSetupScreen.tsx` |
| **Gyms** | `/api/v1/gyms/directory` | `GET` | ✅ Working | `ExploreScreen.tsx`, `useGymStore.ts` |
| **Gyms** | `/api/v1/gyms/join-request/status` | `GET` | ✅ Working | `HomeScreen.tsx`, `GymDirectoryScreen.tsx` |
| **Gyms** | `/api/v1/gyms/join-request` | `POST` | ✅ Working | `GymDirectoryScreen.tsx` |
| **Attendance** | `/api/v1/attendance/check-in` | `POST` | ✅ Working | `BookScreen.tsx` (QR Scan), `QRCheckInScreen.tsx` |
| **Attendance** | `/api/v1/attendance/me` | `GET` | ✅ Working | `BookScreen.tsx` (History), `AttendanceHistoryScreen.tsx` |
| **Progress** | `/api/v1/progress/month` | `GET` | ✅ Working | `ProgressScreen.tsx`, `HomeScreen.tsx` |
| **Progress** | `/api/v1/progress/weight` | `POST` | ✅ Working | `ProgressScreen.tsx`, `HomeScreen.tsx` |
| **Progress** | `/api/v1/progress/water` | `POST` | ✅ Working | `ProgressScreen.tsx`, `HomeScreen.tsx` |
| **Progress** | `/api/v1/progress/protein` | `POST` | ✅ Working | `ProgressScreen.tsx`, `HomeScreen.tsx` |
| **Progress** | `/api/v1/progress/steps` | `POST` | ✅ Working | `ProgressScreen.tsx`, `HomeScreen.tsx` |
| **Progress** | `/api/v1/progress/image` | `POST` | ✅ Working | `ProgressScreen.tsx` |
| **Payments** | `/api/v1/payments/orders` | `POST` | ✅ Working | `PlansScreen.tsx` (Razorpay order creation) |
| **Payments** | `/api/v1/payments/verify` | `POST` | ✅ Working | `PlansScreen.tsx` (Razorpay signature verification) |
| **Uploads** | `/api/v1/uploads/signed-url` | `POST` | ✅ Working | `utils/upload.ts`, `ProfileScreen.tsx` |
| **Notifications** | `/api/v1/notifications` | `GET` / `PATCH` | ✅ Working | `NotificationsScreen.tsx` |
