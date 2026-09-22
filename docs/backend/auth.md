# Authentication & Tenant Isolation

- **Purpose**: Details backend authentication mechanisms, JWT sessions, Role-Based Access Control, and multi-tenant security.
- **Scope**: Authentication and Authorization middleware, tenant row level filtering.
- **Related Documents**: [Database Architecture](./database.md), [Security & Hardening](./security.md)
- **Last Updated**: 2026-07-13

---

# 61. Authentication Philosophy

Authentication answers one question:

> "Who is making this request?"

Authorization answers another:

> "Is this user allowed to perform this action?"

These concerns must always remain separate.

Authentication never grants permissions.

Authorization never verifies identity.

---

# 62. Authentication Provider

Aura Apex uses **Supabase Auth** as the authentication provider.

Reasons:

- Secure authentication
- JWT support
- Password reset
- Email verification
- OAuth support (future)
- Session management
- Battle-tested infrastructure

The backend trusts only JWTs issued by Supabase.

No custom password storage.

No custom authentication implementation.

---

# 63. User Lifecycle

Customer Registration

```
Customer

↓

Register

↓

Supabase Auth

↓

User Created

↓

Database Trigger

↓

Profile Created

↓

Customer Login
```

---

Owner Registration

```
Owner Request

↓

Super Admin Approval

↓

Create Owner

↓

Supabase Auth

↓

Profile

↓

Gym Assignment

↓

Owner Login
```

Owners cannot self-register.

Only Super Admin can onboard gym owners.

---

# 64. User Profile

Authentication data lives in Supabase Auth.

Business data lives inside PostgreSQL.

Never duplicate authentication information unnecessarily.

Example

Supabase Auth

```
id

email

created_at
```

Profiles

```
id

full_name

phone

avatar

role

gym_id

status

created_at
```

Authentication and business data have different responsibilities.

---

# 65. User Context

Every authenticated request receives a User Context.

```
{
    id,
    email,
    role,
    gymId,
    permissions
}
```

Controllers must never read user information from request headers or body.

Always use the authenticated context.

---

# 66. JWT Flow

```
User Login

↓

Supabase Auth

↓

JWT

↓

Client Stores Token

↓

Authorization Header

↓

Express Middleware

↓

Verify Token

↓

Attach User Context

↓

Controller
```

Never manually decode JWTs in controllers.

Authentication middleware owns token verification.

---

# 67. Token Storage

Customer Mobile

Use secure encrypted device storage.

Examples:

- MMKV
- Secure Storage

Web Dashboard

Store session securely.

Avoid exposing tokens to JavaScript where possible.

Never store tokens in plain localStorage if an alternative secure session strategy is available.

---

# 68. Token Lifetime

Access Tokens

Short-lived.

Refresh handled by Supabase.

The backend never creates custom JWTs.

Supabase remains the source of truth.

---

# 69. Authentication Middleware

Responsibilities:

✓ Verify JWT

✓ Verify expiry

✓ Load profile

✓ Load role

✓ Load tenant

✓ Attach request.user

Authentication middleware never checks permissions.

---

# 70. Authorization Middleware

Authorization determines access.

Checks include:

Role

Permission

Tenant

Ownership

Example

```
Customer

↓

Delete Plan

↓

Denied
```

Example

```
Owner

↓

Delete Own Plan

↓

Allowed
```

---

# 71. Roles

The platform supports the following roles.

Customer

Gym Owner

Staff

Trainer

Super Admin

Roles should never be hardcoded throughout the application.

Use centralized enums/constants.

---

# 72. Permission Philosophy

Roles are broad.

Permissions are granular.

Example

Owner

Permissions

```
plan.create

plan.update

plan.delete

member.create

trainer.create

equipment.create
```

Staff

```
member.read

attendance.read

attendance.create
```

Trainer

```
member.read

schedule.read
```

Future role customization becomes easier.

---

# 73. Role Hierarchy

```
Super Admin

↓

Owner

↓

Staff

↓

Trainer

↓

Customer
```

Higher roles do NOT automatically inherit every permission.

Permissions must be explicitly granted.

---

# 74. Tenant Isolation

Tenant isolation is mandatory.

Every business entity belongs to one gym.

```
Gym

↓

Members

↓

Plans

↓

Attendance

↓

Payments

↓

Equipment
```

Every database query must automatically filter by gym_id.

Cross-tenant access is forbidden.

---

# 75. Ownership Validation

Some actions require ownership.

Example

Owner edits Gym.

Backend verifies

```
request.user.gymId

==

gym.id
```

If not,

Return 403.

Never trust IDs provided by clients.

---

# 76. Super Admin Rules

Super Admin bypasses tenant restrictions.

Can

Create gyms

Delete gyms

Suspend gyms

Approve owners

View all analytics

Platform configuration

Customer data should still be accessed only when operationally necessary.

---

# 77. Public Endpoints

Only a small number of endpoints are public.

Examples

Login

Register Customer

Forgot Password

Reset Password

Health Check

Everything else requires authentication.

---

# 80. Account Status

Profiles contain account status.

Possible values

```
ACTIVE

INACTIVE

SUSPENDED

PENDING
```

Inactive users cannot authenticate.

Suspended gyms disable all associated users except Super Admin.

---

# 84. Session Revocation

Admins may revoke sessions.

Examples

Owner suspended

Gym suspended

Password changed

Logout all devices

Future implementations should invalidate active refresh sessions.

---

# 122. Authentication Module

Purpose

Manage identity and authentication.

Responsibilities

Customer Login

Customer Registration

Password Reset

Token Verification

Session Validation

Profile Loading

Dependencies

Supabase Auth

Owns

Authentication only.

It does NOT own

Permissions

Membership

Gym

Attendance

---

# 123. Phone OTP Authentication Flow

Purpose: Native SMS OTP authentication for frictionless mobile sign-in.

Endpoints:
- `POST /api/v1/auth/phone-otp`: `{ "phone": "+919876543210" }` → triggers SMS verification code dispatch
- `POST /api/v1/auth/verify-otp`: `{ "phone": "+919876543210", "code": "123456" }` → verifies OTP and returns `{ session, profile }`

Security Guarantees:
- Rate limited strictly via `authRateLimiter` (10 attempts per IP per 15 minutes).
- Automatic creation and synchronization of customer profile upon initial successful OTP verification.
- Tokens issued follow standard JWT schema and bearer authentication lifecycle.

---

# 124. Account Deletion (GDPR & App Store Compliance)

Purpose: Allows authenticated customers and users to self-delete their account and permanently purge their personal data, meeting Apple App Store & Google Play privacy requirements.

Endpoints:
- `DELETE /api/v1/auth/account`
- `DELETE /api/v1/auth/me` (alias)

Authentication:
- Required (`Authorization: Bearer <accessToken>`)

Behavior:
1. Validates the caller's JWT and resolves their profile.
2. Forbids `super_admin` self-deletion to prevent platform lockout.
3. Invokes Supabase Auth Admin deletion (`supabase.auth.admin.deleteUser(userId)`).
4. Cascades delete through `public.profiles` (`ON DELETE CASCADE`), which immediately purges all associated member rows, progress logs (`notes_logs`, `sleep_logs`, `progress_logs`, `water_logs`, `protein_logs`, `steps_logs`), workout history, saved gym bookmarks, and gym join requests.
5. Records an audit event (`auth.delete_account`).

Response:
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": null
}
```

---