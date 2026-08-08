# Aura Apex – Engineering Changelog

> **Session Date**: 8 August 2026  
> **Scope**: Backend API, Mobile App (React Native), Web-App (React/Vite)  
> **Status**: All 58 backend tests passing · Frontend typecheck 0 errors · Web-app build clean

---

## Table of Contents

1. [Backend – Plans API](#1-backend--plans-api)
2. [Backend – Payments Service Enrichment](#2-backend--payments-service-enrichment)
3. [Backend – Post-Payment Auto-Join](#3-backend--post-payment-auto-join)
4. [Backend – Mock Data Removal from PlanService](#4-backend--mock-data-removal-from-planservice)
5. [Mobile App – PlansScreen (Live Data)](#5-mobile-app--plansscreen-live-data)
6. [Mobile App – Subscription History & Invoice Slips](#6-mobile-app--subscription-history--invoice-slips)
7. [Mobile App – Dashboard Membership Consistency Fix](#7-mobile-app--dashboard-membership-consistency-fix)
8. [Web-App – Payments Page Overhaul](#8-web-app--payments-page-overhaul)
9. [Test Results](#9-test-results)

---

## 1. Backend – Plans API

### Problem
Any customer who had **not yet joined a gym** (`profiles.gym_id = null`) received:
```json
{ "success": false, "message": "No gym associated with this account", "error": { "code": "NO_GYM_CONTEXT" } }
```
when calling `GET /api/v1/plans?gymId=<id>` even though they explicitly passed a `gymId` query param.

### Root Cause
`plans.routes.ts` applied `router.use(authenticate, requireGym)` globally for **all** routes including reads. The `requireGym` middleware blocks any user whose `req.user.gymId` is `null`, regardless of the `?gymId=` query parameter.

### Fix

**`backend/src/modules/plans/plans.routes.ts`**  
Split middleware: `GET /` and `GET /:id` now only require `authenticate`. `requireGym` + `requirePermission` remain on all mutation routes (`POST`, `PATCH`, `DELETE`).

```diff
- router.use(authenticate, requireGym);
+ // Read routes — any authenticated user can browse active plans
+ router.get('/', authenticate, validate(listPlansSchema), asyncHandler(PlanController.list));
+ router.get('/:id', authenticate, validate(planIdSchema), asyncHandler(PlanController.getById));
+ // Mutation routes — require gym context and permissions
+ router.use(authenticate, requireGym);
```

**`backend/src/modules/plans/plans.controller.ts`**  
Updated `PlanController.list` to:
- Honour `req.query.gymId` for **all roles** (not just `CUSTOMER`).
- Fall back to `user.gymId` if no `?gymId=` is supplied.
- Throw `BAD_REQUEST` (not `NO_GYM_CONTEXT`) only if neither source provides a gym ID.

---

## 2. Backend – Payments Service Enrichment

### Problem
`GET /api/v1/payments` returned generic placeholders — the **Member** column on the owner dashboard showed "Gym Member" for every transaction instead of real customer names. Revenue totals were also wrong because the frontend expected status `"completed"` but the DB stores `"success"`.

### Fix

**`backend/src/modules/payments/payments.service.ts`**  
`PaymentService.list` now performs an in-memory join against `members` and `subscriptions -> plans` tables:

```typescript
const [membersRes, subsRes] = await Promise.all([
  supabase.from('members').select('id, full_name, email, phone').in('id', memberIds),
  supabase.from('subscriptions').select('id, plan:plans(name)').in('id', subIds),
]);
```

Each `PaymentDto` item now includes:

| New Field | Source |
|-----------|--------|
| `memberName` | `members.full_name` or `members.email` |
| `memberEmail` | `members.email` |
| `memberPhone` | `members.phone` |
| `planName` | `subscriptions -> plans.name` |

**`backend/src/modules/payments/payments.types.ts`**  
Added four optional fields to `PaymentDto` interface.

---

## 3. Backend – Post-Payment Auto-Join

### Problem
After a successful Razorpay checkout, the backend called `this.handlePostPaymentAutoJoin(...)` but the method **did not exist**, causing a silent `TypeError` on the verification step. Owners could see the transaction. The customer could see the transaction. But:
- `members.status` remained `inactive`.
- `profiles.gym_id` was never set.
- The mobile HomeScreen still showed "Choose your plan" after payment.

### Fix

**`backend/src/modules/payments/payments.service.ts`**  
Implemented `handlePostPaymentAutoJoin(gymId, memberId)`:

```typescript
private static async handlePostPaymentAutoJoin(gymId: string, memberId: string) {
  // 1. Set member status -> active
  await supabase.from('members').update({ status: 'active' }).eq('id', memberId).eq('gym_id', gymId);

  // 2. Link profile to gym (sets profiles.gym_id)
  if (member.profileId) {
    await supabase.from('profiles').update({ gym_id: gymId }).eq('id', member.profileId);

    // 3. Mark any pending join request -> approved
    await supabase.from('gym_join_requests')
      .update({ status: 'approved' })
      .eq('profile_id', member.profileId)
      .eq('gym_id', gymId);
  }
}
```

This is called from both `verify()` (client fast-path) and `confirmFromWebhook()` (authoritative webhook path) to guarantee idempotent activation on either path.

---

## 4. Backend – Mock Data Removal from PlanService

### Problem
`PlanService.list` contained a fallback block that **auto-seeded 3 hardcoded mock plans** ("Starter Tier", "Standard Pro", "Elite VIP") whenever a gym had 0 plans in the database. This silently inserted fake production data.

### Fix

**`backend/src/modules/plans/plans.service.ts`**  
Removed the entire auto-seed block. The service now returns exactly what the database contains — an empty list if no plans have been created by the gym owner. The mobile `PlansScreen` handles the empty state with a proper UI message.

**`PlanService.getPurchasable`**  
Also removed the synthetic gym-ID-from-string fallback that tried to guess a gym from a fake plan ID string.

---

## 5. Mobile App – PlansScreen (Live Data)

### Problem
`PlansScreen.tsx` mixed live API data with synthetic client-side fallback arrays. Hardcoded plan IDs like `starter_plan_${gymId}`, mock feature strings, and hardcoded prices were used when the API returned an empty result. Customers saw fabricated plans and could "purchase" them with IDs that did not exist in the database.

### Fix

**`frontend/src/screens/PlansScreen.tsx`** — full rewrite:

| Feature | Before | After |
|---------|--------|-------|
| Plans data | Live API + synthetic fallback | 100% live from `GET /plans?gymId=<id>` |
| Gym info | Hardcoded strings | Live from `/gyms/:id/public` or directory cache |
| Plan features | Hardcoded arrays | `p.features` from DB, fallback to `[p.description]` |
| Empty state | Showed fake plans | "This gym has not published any packages yet" |
| Checkout | Used fake plan IDs | Real UUIDs from Supabase -> Razorpay order creation |
| Gym Switcher | N/A | Horizontal pill bar for all partner gyms in directory |
| Active badge | Based on local state | Cross-references live subscription from store |
| Pre-payment invoice | None | GST breakdown (base + 18%) in checkout drawer |

---

## 6. Mobile App – Subscription History & Invoice Slips

### Problem
`SubscriptionHistoryScreen.tsx` read plan price and dates using the wrong field paths:
- `item.plans?.price` — DTO field is `item.plan.price` (camelCase, not the plural `plans`)
- `item.amount || 2999` — hardcoded fallback of Rs 2,999 even when the real price was Rs 499
- `item.plans?.billing_interval` — field does not exist; duration lives at `item.plan.durationDays`
- `item.start_date` / `item.end_date` — DTO uses `item.startDate` / `item.endDate`

### Fix

**`frontend/src/screens/SubscriptionHistoryScreen.tsx`**

```typescript
const planPrice    = Number(item.plan?.price ?? item.plans?.price ?? item.amount ?? 0);
const planName     = item.plan?.name ?? item.plans?.name ?? item.planName ?? 'Gym Membership';
const startDate    = item.startDate  ?? item.start_date  ?? item.createdAt ?? item.created_at;
const endDate      = item.endDate    ?? item.end_date;
const durationDays = item.plan?.durationDays ?? item.plan?.duration_days ?? 30;
```

**Invoice slip modal now shows:**
- Correct transaction date (`startDate`)
- Correct validity range (`startDate — endDate`)
- Real plan name (e.g. "Basic", "Monthly Silver")
- Accurate amount paid from the database (not hardcoded)
- GST breakdown (base fee + 18% GST)
- Invoice reference number (`INV-<first-8-chars-of-UUID>`)
- Razorpay as payment gateway

---

## 7. Mobile App – Dashboard Membership Consistency Fix

### Problem
After a successful payment the Plans screen correctly showed **"ACTIVE MEMBERSHIP"** on the purchased plan card, but the HomeScreen dashboard still displayed the "Choose your plan" CTA. Two independent bugs caused this discrepancy.

**Bug A — `subscription` was stored as an array**  
`/subscriptions/me` returns `data: SubscriptionDto[]` (an array). The store blindly set `subscription = response.data.data` (the full array). Then `subscription.status === 'active'` on an array always yields `undefined` -> falsy, so `isSubscribed` was always `false`.

**Bug B — `setSession` blocked subscription load for customers without `gym_id`**  
The store's `setSession` only called `loadSubscription()` when `profiles.gym_id` was already set. But `handlePostPaymentAutoJoin` sets `gym_id` *after* login. A customer who paid after their session was established had an active subscription that was never loaded into the store.

### Fix

**`frontend/src/store/useAuthStore.ts`**

```typescript
// Pick a single resolved subscription from the array
const subs = Array.isArray(rawData) ? rawData : [rawData].filter(Boolean);
const activeSub = subs.find((s) => s.status === 'active') ?? subs[0] ?? null;
set({ subscription: activeSub });

// Self-heal: if an active sub exists but profile.gym_id is stale in memory, refresh profile
if (activeSub?.status === 'active' && !get().userProfile?.gym_id) {
  await get().loadUserProfile();
}
```

Removed the `hasGym` guard from `setSession` — subscriptions are now loaded for all customer logins.

**`frontend/src/screens/HomeScreen.tsx`**

```typescript
// Correct DTO field paths (plan not plans)
const resolvedPlan = subscription?.plan ?? subscription?.plans ?? null;
const planName     = resolvedPlan?.name || 'Membership Plan';

// Correct expiry field (endDate not current_period_end)
const end = subscription?.endDate ?? subscription?.end_date ?? subscription?.current_period_end;
const daysLeft = end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)) : 30;

// Progress ring uses actual plan duration from DB
const planDays = resolvedPlan?.durationDays ?? resolvedPlan?.duration_days ?? 30;
const progress = Math.max(0, Math.min(1, 1 - daysLeft / planDays));
```

---

## 8. Web-App – Payments Page Overhaul

### Problem
- **Member column** showed "Gym Member" for every row — no real customer identities.
- **Total Revenue** stat card showed wrong totals because the backend sends `status: "success"` but the frontend compared against `"completed"`.
- No way to view individual transaction invoices or print receipts.
- Hardcoded mock data array was still present in the file.

### Fix

**`web-app/src/hooks/usePayments.ts`**

```typescript
status: p.status === 'success' ? 'completed' : p.status,  // fix status mapping
transactionId: p.razorpayPaymentId || p.razorpayOrderId || `TXN-${p.id.slice(0,8).toUpperCase()}`,
memberName:  p.memberName  || 'Gym Customer',
memberEmail: p.memberEmail || null,
memberPhone: p.memberPhone || null,
planName:    p.planName    || 'Membership Plan',
```

**`web-app/src/pages/payments/PaymentsPage.tsx`** — full rewrite:

| Feature | Before | After |
|---------|--------|-------|
| Member column | "Gym Member" (every row) | Real customer full name + email sub-row |
| Plan column | Generic "Type" column | Live plan name |
| Revenue KPI | Wrong (status mismatch) | Real totals from DB transactions |
| Row action | None | "Invoice" button on every row |
| Invoice modal | None | Tax receipt: customer details, Razorpay ref, GST breakdown, Print/PDF |
| Mock data | Hardcoded rows in file | Completely removed |
| Search | Name + TXN ID only | Name + Email + Plan name + TXN ID |

**`web-app/src/types/index.ts`**  
Added `memberEmail?`, `memberPhone?`, `planName?` to `Payment` interface.

---

## 9. Test Results

All 58 backend unit tests pass after every change.

```
Test Files  13 passed (13)
     Tests  58 passed (58)
  Duration  ~3.5s
```

| Test Suite | Tests | Status |
|------------|-------|--------|
| `auth.test.ts` | 5 | PASS |
| `auth-security.test.ts` | 16 | PASS |
| `rbac.test.ts` | 5 | PASS |
| `tenant-isolation.test.ts` | 3 | PASS |
| `tenant-isolation-cross.test.ts` | 8 | PASS |
| `plans.test.ts` | 3 | PASS |
| `subscriptions.test.ts` | 3 | PASS |
| `payments.test.ts` | 3 | PASS |
| `attendance.test.ts` | 3 | PASS |
| `attendance-concurrency.test.ts` | 2 | PASS |
| `uploads.test.ts` | 2 | PASS |
| `payment-hardening.test.ts` | 2 | PASS |
| `transaction-safety.test.ts` | 3 | PASS |

**React Native (Mobile App)**

```
cd frontend && npm run typecheck  -->  0 errors
```

**Web-App**

```
cd web-app && npx tsc -b  -->  0 errors
```

---

## File Change Index

| File | Change | Description |
|------|--------|-------------|
| `backend/src/modules/plans/plans.routes.ts` | Modified | Moved `requireGym` off GET routes; only auth required to browse plans |
| `backend/src/modules/plans/plans.controller.ts` | Modified | `PlanController.list` honours `?gymId` for all roles |
| `backend/src/modules/plans/plans.service.ts` | Modified | Removed mock auto-seed block; clean live DB queries only |
| `backend/src/modules/payments/payments.service.ts` | Modified | Enriched `list()` with member + plan join; implemented `handlePostPaymentAutoJoin` |
| `backend/src/modules/payments/payments.types.ts` | Modified | Added `memberName`, `memberEmail`, `memberPhone`, `planName` to `PaymentDto` |
| `frontend/src/store/useAuthStore.ts` | Modified | Array -> single subscription resolution; removed `hasGym` guard; profile self-heal |
| `frontend/src/screens/HomeScreen.tsx` | Modified | Correct `plan` DTO paths; `endDate` for expiry; dynamic progress ring |
| `frontend/src/screens/PlansScreen.tsx` | Rewritten | 100% live data; no mock fallbacks; gym hero card; Razorpay drawer with GST invoice |
| `frontend/src/screens/SubscriptionHistoryScreen.tsx` | Modified | Correct DTO field paths for price, dates, duration; accurate invoice slips |
| `web-app/src/pages/payments/PaymentsPage.tsx` | Rewritten | Real member names & plan names; tax invoice modal; removed mock data |
| `web-app/src/hooks/usePayments.ts` | Modified | `success -> completed` status mapping; Razorpay ID as TXN ref; enriched fields |
| `web-app/src/types/index.ts` | Modified | Added `memberEmail`, `memberPhone`, `planName` to `Payment` interface |
