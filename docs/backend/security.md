# Security & Production Hardening

- **Purpose**: Comprehensive guide to production security, covering CORS, rate limiting, SQLi/XSS protection, uploads security, webhook validation, and audits.
- **Scope**: Production hardening, server security settings, validation middleware, and incident rules.
- **Related Documents**: [Authentication & Tenant Isolation](./auth.md), [Payments & Subscriptions](./payments.md)
- **Last Updated**: 2026-07-13

---

# 78. Secure File Uploads

Uploads require authentication.

Validation includes

Allowed MIME types

Maximum file size

Maximum dimensions (future)

Ownership verification

Images uploaded by one gym cannot be modified by another gym.

---

# 79. Audit Trail

Every privileged operation must be recorded.

Examples

Gym Created

Owner Created

Plan Deleted

Equipment Deleted

Manual Attendance Edit

Refund

Role Change

Audit entries should contain

Timestamp

Actor

Role

Gym

Action

Resource

Result

Audit records must never be edited.

---

# 81. Soft Delete

Business entities should generally use soft delete.

Examples

Members

Plans

Equipment

Trainers

Gym Images

Never hard delete unless legally required.

Payments and attendance records should never be deleted.

---

# 82. Password Security

Passwords are managed exclusively by Supabase.

Backend never:

Stores passwords

Hashes passwords

Validates passwords

Authentication provider owns password security.

---

# 83. Brute Force Protection

Authentication endpoints should be rate limited.

Repeated failures

↓

Temporary lockout

↓

Retry later

Future enhancements may include CAPTCHA.

---

# 85. API Security Headers

Every response should include security headers.

Examples

Content-Security-Policy

X-Frame-Options

X-Content-Type-Options

Strict-Transport-Security

Referrer-Policy

Security middleware should configure these globally.

---

# 86. Principle of Least Privilege

Every user receives only the permissions required.

Never grant extra permissions "just in case."

Permission escalation requires explicit approval.

---

# 87. Security Events

The following events should always be logged.

Login Success

Login Failure

Password Reset

Role Change

Gym Suspension

Owner Creation

Permission Changes

Failed Authorization

Webhook Failure

Logs should never expose sensitive tokens or credentials.

---

# 88. Security Principles

The backend follows:

Zero Trust

Least Privilege

Defense in Depth

Server-side Validation

Server-side Authorization

Immutable Audit Logs

Tenant Isolation

Fail Secure

Security always takes precedence over convenience.

# Part 5 — Database Architecture & Data Layer

---

# 56. Audit Logging

Critical actions should be recorded.

Examples

Owner created

Gym created

Gym suspended

Plan updated

Plan deleted

QR generated

QR revoked

Refund processed

Attendance manually edited

Audit logs must include:

Timestamp

User ID

Role

Tenant ID

Action

Affected Resource

IP Address (if applicable)

Audit logs are immutable.

---

# 145. Security Philosophy

Security is the responsibility of every layer of the application.

No request should be trusted.

No client input should be assumed valid.

Every request must pass through multiple security layers before reaching business logic.

The backend follows a **Zero Trust Architecture**.

Trust must always be earned through authentication, authorization and validation.

---

# 146. Security Layers

Every request passes through the following security layers.

```

HTTPS

↓

Security Headers

↓

Rate Limiting

↓

Authentication

↓

Authorization

↓

Validation

↓

Business Rules

↓

Database Constraints

↓

Audit Logging

```

Security should never rely on a single mechanism.

Multiple layers provide defense in depth.

---

# 147. HTTPS

All production traffic must use HTTPS.

HTTP requests should be redirected automatically.

Never expose authentication tokens over insecure connections.

TLS termination should happen before requests reach Express.

---

# 148. Environment Variables

Secrets must never exist inside source code.

Examples

```
JWT_SECRET

SUPABASE_SERVICE_ROLE_KEY

RAZORPAY_SECRET

DATABASE_URL

SMTP_PASSWORD
```

Rules

Never commit `.env`

Never log secrets

Never expose secrets to frontend

Never hardcode credentials

---

# 149. Authentication Protection

Protected APIs require

Valid JWT

Valid Session

Active Account

Active Gym

Correct Tenant

Expired sessions immediately return

```
401 Unauthorized
```

---

# 150. Authorization

Authorization must be enforced server-side.

Frontend permissions are for UI convenience only.

Backend always decides access.

Never trust

```
role

gymId

userId
```

sent by clients.

Always derive these from the authenticated token.

---

# 151. Input Validation

Every API validates

Body

URL Parameters

Query Parameters

Headers (if required)

Validation uses Zod.

Invalid requests never reach controllers.

---

# 152. SQL Injection

Always use parameterized queries.

Never concatenate SQL strings.

Bad

```
SELECT * FROM users WHERE id = '${id}'
```

Good

Repository

↓

Parameterized query

↓

Database

---

# 153. XSS Protection

Never return unescaped HTML.

Frontend escapes output.

Backend stores plain text.

Rich text should be sanitized before storage.

---

# 154. CORS

Allow only approved origins.

Production origins should be explicitly configured.

Never use

```
Access-Control-Allow-Origin: *
```

in production.

---

# 155. Security Headers

Helmet should configure

Content Security Policy

X-Frame-Options

X-Content-Type-Options

Strict Transport Security

Referrer Policy

Permissions Policy

Headers should be applied globally.

---

# 156. Rate Limiting

Authentication

Strict

Payments

Strict

Attendance

Medium

Search

Medium

Public APIs

Relaxed

Health Check

No limit (internal)

Use IP-based rate limiting.

Future

User-based rate limiting.

---

# 157. Request Size Limits

Maximum JSON payload

Recommended

```
1 MB
```

Maximum image upload

Configurable

Reject oversized payloads immediately.

---

# 158. File Upload Security

Allowed Types

JPEG

PNG

WEBP

Maximum Size

Configurable

Validation

MIME Type

Extension

Content Type

Future

Virus scanning.

Never trust file extensions.

---

# 159. Storage Security

Files stored inside Supabase Storage.

Database stores only metadata.

Private images remain private.

Public images require explicit buckets.

Signed URLs should be preferred where appropriate.

---

# 161. Replay Protection

Duplicate webhook requests should be ignored safely.

Webhook events must be idempotent.

Processing the same webhook twice must never duplicate payments.

---

# 162. Idempotency

Critical APIs should support idempotency.

Examples

Membership Purchase

Payment Confirmation

Refund

Attendance

Repeated identical requests should produce one result.

---

# 163. Audit Logs

The following actions must always be logged.

Login

Logout

Payment

Refund

Owner Creation

Gym Suspension

QR Generation

QR Revocation

Manual Attendance Update

Permission Change

Logs must be immutable.

---

# 164. Sensitive Data

Never log

Passwords

JWT

Refresh Tokens

OTP

Payment Secrets

Service Role Keys

Personally identifiable information should be minimized.

---

# 165. Error Messages

Never expose

Stack Traces

SQL Errors

Internal File Paths

Framework Errors

Clients receive generic messages.

Detailed logs remain server-side.

---

# 166. Password Policy

Handled by Supabase.

Backend never hashes passwords.

Backend never stores passwords.

Backend never validates passwords.

---

# 167. Brute Force Protection

Authentication endpoints

Rate limited.

Future

Progressive delay

Captcha

Temporary lockout

---

# 168. Account Locking

Suspended users

↓

Cannot authenticate

Disabled gyms

↓

Disable all associated users

Except Super Admin.

---

# 169. Soft Delete Security

Deleted resources remain inaccessible.

Repositories automatically exclude deleted records.

Recovery requires privileged permissions.

---

# 172. Logging & Monitoring

Critical failures trigger alerts.

Examples

Repeated Login Failures

Webhook Failures

Database Connection Failures

Unexpected Exceptions

Monitoring should be proactive.

---

# 173. Secrets Rotation

Secrets should support rotation.

Examples

JWT

Webhook Secret

API Keys

Database Password

Rotation should occur without code changes.

---

# 174. Dependency Security

Dependencies should be

Updated

Reviewed

Scanned

Unused packages removed.

Avoid abandoned libraries.

---

# 175. API Abuse Protection

Protect against

Enumeration

Spam

Credential Stuffing

Brute Force

Mass Registration

Introduce throttling where necessary.

---

# 176. Incident Response

Production incidents should follow

Detect

Contain

Recover

Review

Every incident should produce a postmortem.

---

# 177. Backup Security

Backups must be

Encrypted

Access Controlled

Regularly Tested

Backups are production data.

Treat them as highly sensitive.

---

# 178. Compliance

The system should be designed to support future compliance requirements.

Examples

GDPR

DPDP (India)

SOC2

Without requiring major architectural changes.

---

# 179. Security Checklist

Before every release verify

✓ Authentication

✓ Authorization

✓ Validation

✓ Rate Limiting

✓ Logging

✓ HTTPS

✓ Environment Variables

✓ Secrets

✓ File Uploads

✓ Webhooks

✓ Payments

✓ Tenant Isolation

✓ Audit Logs

---

# 180. Golden Rule

Never trust the client.

Always validate.

Always authorize.

Always verify.

Security is not one feature.

Security is every feature.

# Part 8 — Performance, Scalability & Reliability

---

# 13. Security Principles

Role-based authorization.

Tenant isolation.

JWT authentication.

Input validation.

Rate limiting.

Audit logs.

Secure file uploads.

Server-side payment verification.

No secrets inside frontend.

HTTPS only.

Every request authenticated except public endpoints.

---