# Aura Apex — Backend API

Multi-tenant SaaS **Gym Management Platform** API. One backend serves three apps: the **Customer Mobile App** (React Native), the **Owner Dashboard** (React Web), and the **Super Admin Portal** (React Web).

### 📖 Live API Documentation (Swagger)
The API contract is fully documented and served interactively at:
* **Interactive UI:** `http://localhost:5000/docs` (Local) or `https://gym-app-xtru.onrender.com/docs` (Production)
* **Raw OpenAPI Spec:** `http://localhost:5000/docs/openapi.json`

This document is the reference guide for local environment setup, architecture patterns, and conventions.

- **Stack:** Node.js · Express · TypeScript (strict) · Supabase (PostgreSQL + Auth + Storage) · Razorpay · Zod · Pino
- **Base URL (local):** `http://localhost:5000`
- **API prefix:** `/api/v1`

---

## Table of Contents

1. [Architecture](#architecture)
2. [Getting Started](#getting-started)
3. [Conventions](#conventions) — base URL, auth, response envelope, pagination, errors
4. [Roles & Permissions (RBAC)](#roles--permissions-rbac)
5. [Endpoint Catalog](#endpoint-catalog)
6. [Core Flows](#core-flows) — register/login, checkout, QR attendance, image upload, webhooks
7. [Enums Reference](#enums-reference)
8. [Data Model](#data-model)
9. [Project Structure](#project-structure)

---

## Architecture

Feature-first, layered architecture. Every request flows:

```
Route → Middleware (auth → authorize → validate) → Controller → Service → Repository → PostgreSQL
```

- **Routes** define URLs and compose middleware only.
- **Controllers** are thin: read request → call service → return response.
- **Services** own all business logic and are framework-agnostic.
- **Repositories** own persistence (all extend a tenant-aware `BaseRepository`).
- **Every tenant-owned row carries `gym_id`** and every query is scoped to it — tenants can never see each other's data.
- **Multi-write business actions** (checkout, manual membership, QR rotation) run in atomic Postgres transaction functions (RPCs).

---

## Getting Started

```bash
cd backend
npm install
cp .env.example .env      # fill in Supabase (+ optional Razorpay) values
```

Apply the database schema to your Supabase project (SQL editor or CLI):

```bash
# from repo root — the complete schema lives in one file:
#   schema.sql   (also mirrored as supabase/migrations/*.sql)
```

Run:

```bash
npm run dev        # watch mode (ts-node-dev)
npm run build      # compile to dist/
npm start          # run compiled build
npm run typecheck  # tsc --noEmit
```

Verify it's up: `GET http://localhost:5000/health`.

> The server **fails fast** if required env vars are missing. See [`.env.example`](./.env.example) for the full list.

---

## Conventions

### Base URL & Versioning

All business endpoints are under `/api/v1`. Health probes (`/health`, `/ready`, `/live`) and the Razorpay webhook (`/webhooks/razorpay`) are at the root.

### Authentication

Auth is handled by **Supabase Auth**. The flow:

1. `POST /api/v1/auth/register` or `/login` → returns a `session` with `accessToken`.
2. Send that token on every protected request:

```
Authorization: Bearer <accessToken>
```

The backend verifies the JWT, loads the profile (role, gym, status), and attaches it to the request. **Never send `role`, `gymId`, or `userId` in the body** — the server derives them from the token.

### Response Envelope

Every **success** response:

```json
{ "success": true, "message": "…", "data": { }, "meta": { } }
```

Every **error** response:

```json
{ "success": false, "message": "…", "error": { "code": "MACHINE_CODE" } }
```

`meta.pagination` is present on list endpoints. Validation failures include `error.details` (array of `{ field, message }`).

### Pagination, Sorting, Search

List endpoints accept these query params:

| Param    | Type   | Default      | Notes                              |
| -------- | ------ | ------------ | ---------------------------------- |
| `page`   | number | `1`          | 1-indexed                          |
| `limit`  | number | `20`         | max `100`                          |
| `sort`   | string | `created_at` | column to sort by                  |
| `order`  | string | `desc`       | `asc` \| `desc`                    |
| `search` | string | —            | case-insensitive partial match     |

Paginated responses return the array in `data` and:

```json
"meta": { "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNext": true, "hasPrev": false } }
```

### HTTP Status Codes

| Code | Meaning                    | Code | Meaning                 |
| ---- | -------------------------- | ---- | ----------------------- |
| 200  | Success                    | 403  | Forbidden               |
| 201  | Created                    | 404  | Not Found               |
| 204  | No Content                 | 409  | Conflict                |
| 400  | Validation / Bad Request   | 422  | Business Rule Failure   |
| 401  | Unauthenticated            | 429  | Rate Limited            |
| 503  | Service Unavailable / Timeout | 500 | Unexpected Error     |

### Common Error Codes

`VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `ACCOUNT_INACTIVE`, `GYM_SUSPENDED`, `FORBIDDEN`, `ROLE_FORBIDDEN`, `PERMISSION_DENIED`, `NO_GYM_CONTEXT`, `NOT_FOUND`, `*_NOT_FOUND`, `CONFLICT`, `ALREADY_CHECKED_IN`, `MEMBERSHIP_INACTIVE`, `NOT_A_MEMBER`, `INVALID_QR`, `INVALID_SIGNATURE`, `PAYMENTS_DISABLED`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

## Roles & Permissions (RBAC)

Roles: `customer`, `owner`, `staff`, `trainer`, `super_admin`. Roles do **not** inherit; permissions are granted explicitly (staff can receive extra per-user grants).

| Capability            | customer | owner | staff | trainer | super_admin |
| --------------------- | :------: | :---: | :---: | :-----: | :---------: |
| Browse plans / gym    |    ✓     |   ✓   |   ✓   |    ✓    |      ✓      |
| Buy / view own membership | ✓    |   ✓   |   ✓   |    —    |      ✓      |
| QR check-in / own history | ✓    |   —   |   —   |    —    |      —      |
| Manage members        |    —     |   ✓   |  add  |    —    |      ✓      |
| Manage plans          |    —     |   ✓   |   —   |    —    |      ✓      |
| Payments / revenue / refunds | —  |   ✓   |   —   |    —    |      ✓      |
| Attendance (gym-wide) |    —     |   ✓   |   ✓   |    ✓    |      ✓      |
| QR management         |    —     |   ✓   |  read |    —    |      ✓      |
| Trainers / Equipment / Gallery | — |  ✓  | read  |   read  |      ✓      |
| Analytics             |    —     |   ✓   |   —   |    —    |      ✓      |
| Gym settings & staff  |    —     |   ✓   |   —   |    —    |      ✓      |
| Platform admin        |    —     |   —   |   —   |    —    |      ✓      |

---

## Endpoint Catalog

> `Auth` column: 🌐 public · 🔒 authenticated · 🔑 requires the listed permission/role.
> Owner-dashboard endpoints derive the gym from the caller's token; customer endpoints that read another gym take an explicit `gymId`.

### Health (root)

| Method | Path      | Auth | Description                                   |
| ------ | --------- | ---- | -------------------------------------------- |
| GET    | `/health` | 🌐   | Full report: db, storage, version, uptime.   |
| GET    | `/ready`  | 🌐   | 200 if DB reachable, else 503.               |
| GET    | `/live`   | 🌐   | Liveness (always 200 while running).         |

### Auth — `/api/v1/auth`

| Method | Path               | Auth | Body / Notes |
| ------ | ------------------ | ---- | ------------ |
| POST   | `/register`        | 🌐   | `{ email, password, fullName, phone? }` → `{ session, profile }` |
| POST   | `/login`           | 🌐   | `{ email, password }` → `{ session, profile }` |
| POST   | `/forgot-password` | 🌐   | `{ email }` — always 200 (no enumeration) |
| POST   | `/reset-password`  | 🌐   | `{ accessToken, password }` |
| POST   | `/logout`          | 🔒   | Revokes the session (best-effort) |
| GET    | `/me`              | 🔒   | Current profile |
| PATCH  | `/me`              | 🔒   | `{ fullName?, phone?, avatarUrl? }` |

`session` = `{ accessToken, refreshToken, expiresAt, tokenType: "bearer" }`.

### Gyms — `/api/v1/gyms`

| Method | Path    | Auth | Notes |
| ------ | ------- | ---- | ----- |
| GET    | `/me`   | 🔑 `gym.read`   | Caller's own gym (full) |
| PATCH  | `/me`   | 🔑 `gym.manage` | `{ name?, email?, phone?, address?, description?, logoUrl?, timings?, weeklyOff?, settings? }` |
| GET    | `/me/staff` | 🔑 `staff.manage` | List all staff members assigned to this gym |
| POST   | `/me/staff` | 🔑 `staff.manage` | `{ email, password, fullName, permissions? }` — onboard new staff user credentials |
| DELETE | `/me/staff/:id` | 🔑 `staff.manage` | Delete a staff member (deletes user account) |
| GET    | `/:id`  | 🔑 `gym.read`   | Public gym profile |

`timings` = `{ "monday": { "open": "06:00", "close": "22:00" }, … }`. `weeklyOff` = `["sunday"]`.


### Members — `/api/v1/members`  (owner/staff)

| Method | Path    | Auth | Notes |
| ------ | ------- | ---- | ----- |
| GET    | `/`     | 🔑 `member.read`   | List `?status`, + pagination/search |
| POST   | `/`     | 🔑 `member.create` | `{ fullName, email?, phone?, gender?, dateOfBirth?, address?, emergencyContact?, notes?, profileId? }` |
| GET    | `/:id`  | 🔑 `member.read`   | |
| PATCH  | `/:id`  | 🔑 `member.update` | Any of the create fields + `status` |
| DELETE | `/:id`  | 🔑 `member.delete` | Soft delete |

### Plans — `/api/v1/plans`

| Method | Path             | Auth | Notes |
| ------ | ---------------- | ---- | ----- |
| GET    | `/`              | 🔑 `plan.read`   | Owner: own gym. **Customer: `?gymId=` required**, returns active plans only |
| GET    | `/:id`           | 🔑 `plan.read`   | |
| POST   | `/`              | 🔑 `plan.create` | `{ name, price, durationDays, description?, features?, isActive? }` |
| PATCH  | `/:id`           | 🔑 `plan.update` | Partial |
| POST   | `/:id/activate`  | 🔑 `plan.update` | |
| POST   | `/:id/deactivate`| 🔑 `plan.update` | |
| DELETE | `/:id`           | 🔑 `plan.delete` | Soft delete |

### Subscriptions — `/api/v1/subscriptions`

| Method | Path          | Auth | Notes |
| ------ | ------------- | ---- | ----- |
| GET    | `/me`         | 🔑 `subscription.read`   | Customer's subscriptions across gyms |
| GET    | `/`           | 🔑 `subscription.read`   | Gym subscriptions `?status&memberId` |
| POST   | `/manual`     | 🔑 `subscription.manage` | `{ memberId, planId, method? }` — records cash/manual membership (active immediately) |
| GET    | `/:id`        | 🔑 `subscription.read`   | |
| POST   | `/:id/cancel` | 🔑 `subscription.manage` | |

### Payments — `/api/v1/payments`

| Method | Path          | Auth | Notes |
| ------ | ------------- | ---- | ----- |
| POST   | `/orders`     | 🔒   | `{ planId, memberId? }` → checkout params (see [Checkout flow](#2-membership-checkout-razorpay)) |
| POST   | `/verify`     | 🔒   | `{ orderId, paymentId, signature }` |
| GET    | `/`           | 🔑 `payment.read`   | List `?status&memberId` |
| GET    | `/:id`        | 🔑 `payment.read`   | |
| POST   | `/:id/refund` | 🔑 `refund.create`  | Refunds + cancels the subscription |

### Attendance — `/api/v1/attendance`

| Method | Path         | Auth | Notes |
| ------ | ------------ | ---- | ----- |
| POST   | `/check-in`  | 🔑 `attendance.create` | `{ token }` — customer QR scan |
| GET    | `/me`        | 🔑 `attendance.read`   | Customer's history |
| POST   | `/manual`    | 🔑 `attendance.create` | `{ memberId }` — staff reception check-in |
| GET    | `/`          | 🔑 `attendance.read`   | Gym log `?memberId&dateFrom&dateTo` |
| GET    | `/stats`     | 🔑 `attendance.read`   | `{ today, last7Days, last30Days }` |

### QR — `/api/v1/qr`  (owner/staff)

| Method | Path           | Auth | Notes |
| ------ | -------------- | ---- | ----- |
| GET    | `/active`      | 🔑 `qr.read`   | Current active QR (`qrValue` is what to render) |
| GET    | `/`            | 🔑 `qr.read`   | QR history |
| POST   | `/generate`    | 🔑 `qr.manage` | `{ label? }` — issues a new QR, revokes the old one atomically |
| POST   | `/:id/revoke`  | 🔑 `qr.manage` | |

### Trainers — `/api/v1/trainers`  (owner/staff)

| Method | Path   | Auth | Notes |
| ------ | ------ | ---- | ----- |
| GET    | `/`    | 🔑 `trainer.read`   | `?status` |
| POST   | `/`    | 🔑 `trainer.manage` | `{ fullName, specialization?, bio?, phone?, email?, imageUrl?, profileId?, password? }` — if email & password are provided, it automatically provisions their managed user login in Supabase Auth |
| GET    | `/:id` | 🔑 `trainer.read`   | |
| PATCH  | `/:id` | 🔑 `trainer.manage` | + `status` |
| DELETE | `/:id` | 🔑 `trainer.manage` | Soft deletes the trainer record and deletes their auth user account |


### Equipment — `/api/v1/equipment`  (owner/staff)

| Method | Path   | Auth | Notes |
| ------ | ------ | ---- | ----- |
| GET    | `/`    | 🔑 `equipment.read`   | `?status&condition` |
| POST   | `/`    | 🔑 `equipment.manage` | `{ name, category?, description?, quantity?, condition?, status?, imageUrl?, purchasedAt?, lastServicedAt?, nextServiceAt? }` |
| GET    | `/:id` | 🔑 `equipment.read`   | |
| PATCH  | `/:id` | 🔑 `equipment.manage` | Partial |
| DELETE | `/:id` | 🔑 `equipment.manage` | Soft delete |

### Gallery — `/api/v1/gallery`

| Method | Path          | Auth | Notes |
| ------ | ------------- | ---- | ----- |
| GET    | `/`           | 🔑 `gallery.read`   | Owner: own gym. Customer: `?gymId=`. `?entityType&entityId` |
| POST   | `/upload-url` | 🔑 `gallery.manage` | `{ fileName, mimeType, size, entityType? }` → signed upload target |
| POST   | `/`           | 🔑 `gallery.manage` | `{ path, mimeType?, size?, entityType?, entityId?, caption? }` — register after upload |
| DELETE | `/:id`        | 🔑 `gallery.manage` | Removes object + metadata |

### Analytics — `/api/v1/analytics`  (owner, `analytics.read`)

| Method | Path          | Notes |
| ------ | ------------- | ----- |
| GET    | `/dashboard`  | `{ members, subscriptions, revenue, attendance }` KPI block |
| GET    | `/revenue`    | `?from&to` → daily `[{ date, total, count }]` |
| GET    | `/attendance` | `?from&to` → daily `[{ date, count }]` |

### Notifications — `/api/v1/notifications`  (any authenticated user)

| Method | Path             | Notes |
| ------ | ---------------- | ----- |
| GET    | `/`              | Recipient's notifications (paginated) |
| GET    | `/unread-count`  | `{ count }` |
| POST   | `/read-all`      | Mark all read |
| PATCH  | `/:id/read`      | Mark one read |

### Admin — `/api/v1/admin`  (super_admin only)

| Method | Path                  | Notes |
| ------ | --------------------- | ----- |
| GET    | `/stats`              | Platform totals (gyms, members, active subs, revenue) |
| GET    | `/audit-logs`         | `?gymId&action` |
| POST   | `/gyms`               | Onboard gym `{ name, slug?, email?, phone?, address?, owner?: { email, password, fullName } }` |
| GET    | `/gyms`               | `?status` |
| GET    | `/gyms/:id`           | |
| POST   | `/gyms/:id/approve`   | |
| POST   | `/gyms/:id/suspend`   | Disables all gym users except super admin |
| POST   | `/gyms/:id/activate`  | |

---

## Core Flows

### 1. Register / Login

```http
POST /api/v1/auth/register
{ "email": "a@b.com", "password": "secret123", "fullName": "Alex" }
```
Response `data`: `{ session: { accessToken, … }, profile: { id, email, role, gymId, … } }`.
Store `accessToken` (MMKV on mobile / secure session on web) and send it as `Authorization: Bearer <token>`.

### 2. Membership Checkout (Razorpay)

```
1. POST /api/v1/payments/orders  { planId }        (customer; gym derived from plan)
      → { orderId, amountInPaise, currency, razorpayKeyId, subscriptionId, paymentId, planName }
2. Open Razorpay checkout on the client with those params.
3. On success the client receives razorpay_payment_id + signature, then:
   POST /api/v1/payments/verify  { orderId, paymentId, signature }
      → { subscriptionId, paymentId, status: "success", alreadyProcessed }
4. Razorpay also calls POST /webhooks/razorpay — the authoritative confirmation.
   Verify and confirm are idempotent: the subscription activates exactly once.
```

Owner recording a cash sale instead: `POST /api/v1/subscriptions/manual { memberId, planId, method: "cash" }`.

### 3. QR Attendance

```
Owner:    POST /api/v1/qr/generate     → prints qrValue (revokes any previous QR)
Customer: POST /api/v1/attendance/check-in { token: <scanned qrValue> }
```
The server validates: QR is active → derives the gym → the customer is a member → membership is **active** → not already checked in today (one check-in per member per day). Attendance is never trusted from the client.

### 4. Image Upload (direct-to-storage)

```
1. POST /api/v1/gallery/upload-url { fileName, mimeType, size, entityType }
      → { uploadUrl, path, token, publicUrl }
2. PUT the binary directly to `uploadUrl` (Supabase Storage) — bytes never touch the API.
3. POST /api/v1/gallery { path, mimeType, size, entityType, entityId?, caption? }  → registers metadata
```
Allowed types: JPEG, PNG, WEBP. Max size: `MAX_UPLOAD_SIZE_BYTES` (default 5 MB).

### 5. Razorpay Webhook Setup

Point your Razorpay webhook to `POST https://<host>/webhooks/razorpay`, set `RAZORPAY_WEBHOOK_SECRET`, and subscribe to `order.paid` / `payment.captured` / `payment.failed`. The endpoint verifies the HMAC signature against the **raw** body and processes events idempotently.

---

## Enums Reference

| Enum | Values |
| ---- | ------ |
| user role | `customer`, `owner`, `staff`, `trainer`, `super_admin` |
| account status | `active`, `inactive`, `suspended`, `pending` |
| gym status | `active`, `suspended`, `pending` |
| member status | `active`, `inactive`, `suspended` |
| subscription status | `pending`, `active`, `expired`, `cancelled` |
| payment status | `created`, `pending`, `success`, `failed`, `refunded` |
| payment method | `card`, `upi`, `netbanking`, `wallet`, `cash`, `other` |
| attendance method | `qr`, `manual` |
| qr status | `active`, `revoked` |
| equipment status | `operational`, `maintenance`, `retired` |
| equipment condition | `excellent`, `good`, `fair`, `poor` |
| trainer status | `active`, `inactive` |
| notification type | `info`, `payment`, `membership`, `attendance`, `system`, `promotion` |
| gallery entity type | `gym`, `trainer`, `equipment`, `profile`, `general` |

---

## Data Model

Complete schema: [`../schema.sql`](../schema.sql). Tables (all tenant tables carry `gym_id`; UUID PKs; `created_at`/`updated_at`; `deleted_at` where soft-deletable):

`gyms`, `profiles`, `gym_staff`, `members`, `plans`, `subscriptions`, `payments`, `qr_codes`, `attendances`, `trainers`, `equipment`, `gallery_images`, `notifications`, `audit_logs`, `platform_settings`.

Transactional RPCs: `create_membership_order`, `confirm_membership_payment`, `create_manual_membership`, `rotate_gym_qr`. Analytics views: `vw_daily_revenue`, `vw_daily_attendance`.

> **Payments and attendance are immutable/append-first** (corrections via refund records / status transitions). Business entities are soft-deleted. Audit logs are immutable.

---

## Project Structure

```
backend/src/
├── app.ts                 # Express app + middleware pipeline
├── server.ts              # HTTP bootstrap + graceful shutdown
├── config/                # env, logger, supabase, razorpay, constants
├── routes/                # aggregated /api/v1 router
├── shared/                # errors, responses, middleware, rbac, repositories, services, utils, validators
└── modules/               # feature-first modules, each: controller/service/repository/routes/validation/dto/types
    ├── auth/  gym/  members/  plans/  subscriptions/  payments/
    ├── attendance/  qr/  trainers/  equipment/  gallery/
    └── analytics/  notifications/  admin/  health/
```

Each module exposes a single public surface via its `index.ts`; consumers never import deep internal files.
