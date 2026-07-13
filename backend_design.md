# Backend Design
Version: 1.0

Aura Apex Backend Engineering Handbook

---

# 1. Purpose

This document defines the engineering standards, architectural decisions, implementation guidelines, and development rules for the Aura Apex backend.

It is the single source of truth for backend development.

Every backend engineer must follow this document to ensure the backend remains modular, scalable, maintainable, secure, and production-ready.

If this document conflicts with implementation, this document takes precedence unless superseded by an approved Architecture Decision Record (ADR).

---

# 2. Backend Goals

The backend must satisfy the following goals.

## Scalability

The architecture should support growth from a single gym to thousands of gyms without requiring architectural redesign.

Scaling should occur primarily through infrastructure rather than code rewrites.

---

## Maintainability

New engineers should understand the codebase within a short period.

Every module must have clear ownership and responsibility.

Code duplication must be minimized.

---

## Extensibility

Adding a new module should not require modifying existing modules.

Existing APIs should remain backward compatible whenever possible.

---

## Security

Security is not an optional feature.

Every request must be authenticated unless explicitly public.

Every request must be authorized.

Every input must be validated.

Every sensitive operation must be logged.

---

## Reliability

Failures should be isolated.

One module failing should never bring down the entire application.

Expected errors must be handled gracefully.

Unexpected errors must never expose internal implementation details.

---

# 3. Architectural Style

Aura Apex follows a modular layered architecture.

The backend is divided into independent feature modules.

Each module owns its own:

- Routes
- Controllers
- Services
- Validation
- Repository
- Types
- Tests

Modules communicate only through services.

Direct access between modules is prohibited.

---

# 4. Layered Architecture

Every request follows the exact same lifecycle.

Client
↓

Route
↓

Middleware

↓

Validation

↓

Authentication

↓

Authorization

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

Response Formatter

↓

Client

Each layer has exactly one responsibility.

---

# 5. Responsibility of Each Layer

## Routes

Routes only define URL mappings.

Routes never contain business logic.

Routes never access the database.

Routes only connect middleware and controllers.

---

## Middleware

Middleware handles cross-cutting concerns.

Examples:

- Authentication
- Authorization
- Validation
- Logging
- Rate limiting
- File uploads

Middleware must never contain business logic.

---

## Controllers

Controllers receive validated requests.

Responsibilities:

- Read request data
- Call service
- Return response

Controllers must remain extremely thin.

Controllers must never:

- Query the database
- Perform calculations
- Validate business rules

---

## Services

Services contain all business logic.

Services decide:

- What should happen
- Which repositories to call
- Which transactions are required

Services may communicate with other services.

Services must never know about Express.

---

## Repositories

Repositories are responsible for data access.

Responsibilities:

- SQL queries
- Inserts
- Updates
- Deletes
- Pagination
- Filtering

Repositories never implement business rules.

Repositories never know about HTTP.

---

## Database

The database stores data only.

Business rules belong inside services.

Database constraints protect data integrity but do not replace application logic.

---

# 6. Dependency Rules

Dependencies are strictly one-directional.

Allowed

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Database

Forbidden

Repository → Service

Repository → Controller

Controller → Repository

Route → Database

Middleware → Repository (except authentication middleware where necessary)

Circular dependencies are forbidden.

---

# 7. Feature First Organization

The backend is organized by feature instead of technical type.

Good

modules/

attendance/

payments/

members/

plans/

Bad

controllers/

routes/

services/

models/

Feature-first organization keeps related code together and improves maintainability.

---

# 8. Single Responsibility Principle

Every class, function, and file should have one reason to change.

Examples

MembershipService

Handles memberships only.

AttendanceService

Handles attendance only.

PaymentService

Handles payments only.

Do not create "UtilityService" or "CommonService" with unrelated responsibilities.

---

# 9. API First Development

The backend is the source of truth.

Frontend applications consume APIs.

Frontend must never implement business rules.

Business logic exists only on the backend.

This ensures consistent behavior across mobile and web applications.

---

# 10. Stateless Backend

The backend is stateless.

No request should depend on server memory.

All state is stored in:

- PostgreSQL
- Secure tokens
- Object storage

This allows horizontal scaling without code changes.

---

# 11. Error Philosophy

Errors are classified into:

Operational Errors

Examples

- Invalid credentials
- Membership expired
- Plan not found
- Payment failed

These are expected.

Return meaningful API responses.

System Errors

Examples

- Database unavailable
- External API failure
- Storage outage

These must be logged.

Return generic error messages to clients.

Never expose stack traces.

---

# 12. Logging Philosophy

Every significant action should produce structured logs.

Examples

User Login

Plan Purchase

Attendance

Payment

Gym Creation

Owner Creation

Refund

QR Generation

Logs must never contain passwords, secrets, tokens, or payment credentials.

---

# 13. Future Expansion Philosophy

The architecture must support future modules without modification of existing modules.

Examples

Diet Plans

Workout Plans

POS

Coupons

AI

Branches

Loyalty

Corporate Memberships

New modules should plug into the existing architecture through clearly defined services and APIs.

---

# 14. Engineering Principles

The backend follows:

SOLID

DRY

KISS

YAGNI

Composition over inheritance

Explicit over implicit

Convention over configuration

Readable code over clever code

Every pull request should improve the maintainability of the codebase.

# Part 2 — Project Structure & Module Organization

---

# 15. Project Structure

The backend follows a **Feature-First Modular Architecture**.

The project is organized around business domains instead of technical layers.

Every feature owns everything required for its implementation.

```
backend/
│
├── src/
│   │
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   ├── supabase.ts
│   │   ├── razorpay.ts
│   │   └── constants.ts
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   ├── gym/
│   │   ├── members/
│   │   ├── plans/
│   │   ├── subscriptions/
│   │   ├── payments/
│   │   ├── attendance/
│   │   ├── qr/
│   │   ├── trainers/
│   │   ├── equipment/
│   │   ├── gallery/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── admin/
│   │
│   ├── shared/
│   │
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── errors/
│   │   ├── types/
│   │   ├── dto/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── responses/
│   │
│   ├── routes/
│   │
│   ├── docs/
│   │
│   └── tests/
│
├── supabase/
│
├── package.json
│
└── tsconfig.json
```

---

# 16. Why Feature-First?

Traditional projects separate files like this:

```
controllers/

routes/

services/

repositories/
```

As the project grows, related files become scattered across many folders.

For example:

Attendance

```
controllers/attendance.controller.ts

services/attendance.service.ts

routes/attendance.route.ts

validators/attendance.ts

repository/attendance.repository.ts
```

Developers constantly jump between folders.

Instead we keep everything together.

```
attendance/

controller.ts

service.ts

repository.ts

routes.ts

validation.ts

types.ts

dto.ts
```

Everything related to Attendance stays inside Attendance.

This dramatically improves maintainability.

---

# 17. Module Structure

Every feature module follows exactly the same structure.

Example

```
attendance/

attendance.controller.ts

attendance.service.ts

attendance.repository.ts

attendance.routes.ts

attendance.validation.ts

attendance.dto.ts

attendance.types.ts

attendance.constants.ts

index.ts
```

Not every module must contain every file.

Only create files that are required.

---

# 18. Module Responsibilities

Each module owns:

Business Logic

Validation

Routes

Database Access

DTOs

Constants

Types

Tests

No module may access another module's database directly.

Communication happens only through services.

Example

Allowed

```
AttendanceService

↓

MembershipService
```

Forbidden

```
AttendanceRepository

↓

MembershipRepository
```

---

# 19. Shared Folder

The shared folder contains reusable code that belongs to no specific feature.

Examples

Authentication Middleware

Logger

Response Helpers

Custom Errors

Validation Helpers

Environment Config

JWT Utilities

Never place business logic inside shared.

Shared should remain framework-oriented.

---

# 20. Config Folder

Config contains initialization only.

Allowed

Supabase Client

Logger

Environment Variables

Razorpay Client

Constants

Forbidden

Business Logic

Controllers

Queries

Routes

---

# 21. App Entry Point

The backend has two entry files.

app.ts

Creates the Express application.

Registers middleware.

Registers routes.

Registers global error handler.

Exports the Express instance.

server.ts

Starts the HTTP server.

Reads environment variables.

Handles graceful shutdown.

Nothing else.

---

# 22. Index Files

Every module exposes a single public API using index.ts.

Example

```
attendance/

index.ts
```

```
export * from './attendance.routes';
export * from './attendance.service';
```

Consumers should never import deep internal files.

Good

```
import { AttendanceService } from "@/modules/attendance";
```

Bad

```
import AttendanceService from "../../attendance/service";
```

---

# 23. Import Rules

Always use path aliases.

Example

```
@/modules/auth

@/shared/utils

@/config/logger
```

Never use imports like

```
../../../

../../../../
```

Path aliases improve readability.

---

# 24. File Naming Convention

All filenames use lowercase with dots.

Examples

```
attendance.service.ts

attendance.controller.ts

attendance.repository.ts

attendance.routes.ts

attendance.validation.ts
```

Avoid

camelCase

PascalCase

snake_case

for filenames.

---

# 25. Naming Convention

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Database Tables

snake_case

Database Columns

snake_case

API Routes

kebab-case

Example

```
GET

/api/v1/gym-members
```

---

# 26. Barrel Exports

Each folder exports only what should be public.

Never export internal helpers.

Example

```
attendance/

index.ts

service.ts

private.helper.ts
```

Only

```
export AttendanceService
```

Do not export

```
private.helper.ts
```

---

# 27. Utilities

Utilities should be pure.

Good

Date Formatter

Slug Generator

Phone Formatter

Bad

Membership Calculator

Attendance Processor

Business logic belongs inside Services.

---

# 28. Constants

Each module owns its own constants.

Example

Attendance

```
MAX_DAILY_ATTENDANCE

CHECKIN_WINDOW
```

Do not create one giant

```
constants.ts
```

containing every constant in the application.

---

# 29. DTO Organization

Each module owns its DTOs.

Example

attendance.dto.ts

```
CreateAttendanceDto

AttendanceResponseDto

AttendanceHistoryDto
```

DTOs define API contracts.

Repositories never return raw database rows directly to controllers.

---

# 30. Validation

Validation belongs inside the module.

Example

attendance.validation.ts

Uses Zod.

Controllers assume validated input.

Never validate inside Services.

Never validate inside Repositories.

---

# 31. Response Models

Every API returns DTOs.

Never expose database models directly.

Reason

Database schema changes should never break API consumers.

Controllers always return Response DTOs.

Never database entities.

---

# 32. Shared Business Rules

If multiple modules require the same business logic,

Create a dedicated Service.

Example

Membership Status Checker

Payment Calculator

Permission Evaluator

Do not duplicate logic.

---

# 33. Module Independence

Every module should be removable without breaking unrelated modules.

Example

Removing Equipment should never affect

Attendance

Payments

Plans

Authentication

Loose coupling is mandatory.

---

# 34. Circular Dependencies

Circular imports are forbidden.

Bad

Attendance

↓

Plans

↓

Payments

↓

Attendance

Good

Attendance

↓

Membership Service

↓

Repository

One-directional dependencies only.

---

# 35. Architecture Rule

When adding a new feature,

Ask

"Which module owns this?"

If the answer is unclear,

The architecture is wrong.

Every feature must have exactly one owner.

This rule prevents duplicated logic and spaghetti code.

# Part 3 — Express Application Architecture

---

# 36. Backend Request Lifecycle

Every HTTP request MUST follow the exact same lifecycle.

```
Client
    │
    ▼
Express Router
    │
    ▼
Global Middleware
    │
    ▼
Authentication
    │
    ▼
Authorization
    │
    ▼
Validation
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
PostgreSQL / Supabase
    │
    ▼
Repository
    │
    ▼
Service
    │
    ▼
Controller
    │
    ▼
Response Formatter
    │
    ▼
Client
```

Every request MUST pass through these layers.

No shortcuts are allowed.

---

# 37. Express Boot Process

The backend starts in the following order.

```
server.ts
        │
        ▼
Load Environment Variables
        │
        ▼
Initialize Logger
        │
        ▼
Initialize Supabase Client
        │
        ▼
Initialize Razorpay Client
        │
        ▼
Create Express App
        │
        ▼
Register Global Middleware
        │
        ▼
Register API Routes
        │
        ▼
Register Global Error Handler
        │
        ▼
Start HTTP Server
```

The startup process should fail immediately if any critical dependency cannot be initialized.

Never start a partially configured server.

---

# 38. Middleware Execution Order

Middleware order matters.

The backend should always execute middleware in the following order.

```
Request ID

↓

Security Headers

↓

Compression

↓

CORS

↓

JSON Parser

↓

Cookie Parser

↓

Request Logger

↓

Rate Limiter

↓

Authentication

↓

Authorization

↓

Validation

↓

Route Handler

↓

404 Handler

↓

Global Error Handler
```

Changing this order requires architectural review.

---

# 39. Controller Responsibilities

Controllers exist only to coordinate HTTP requests.

Controllers are responsible for:

• Reading request parameters

• Reading query parameters

• Reading request body

• Calling a service

• Returning a response

Controllers are NOT responsible for:

• Validation

• Business Logic

• SQL Queries

• Authentication

• Authorization

• Transactions

• Logging business events

Controllers should ideally remain under ~100 lines.

---

# 40. Service Responsibilities

Services contain ALL business logic.

Examples

Membership validation

Payment processing

Attendance rules

Plan upgrades

Subscription expiry

Revenue calculations

Analytics generation

Services are allowed to call:

Repositories

Other Services

External APIs

Storage

Queues

Services should never know about Express Request or Response objects.

A service must be reusable from:

REST API

Cron Jobs

Background Jobs

CLI Commands

Future GraphQL API

---

# 41. Repository Responsibilities

Repositories are responsible only for persistence.

Responsibilities include:

Create

Update

Delete

Read

Pagination

Sorting

Filtering

Search

Repositories never contain business rules.

Repositories should expose clear methods.

Example

```
findById()

findByEmail()

findByGym()

create()

update()

delete()

search()
```

Never expose raw SQL throughout the codebase.

---

# 42. Route Responsibilities

Routes define API endpoints.

Example

```
POST /api/v1/auth/login

↓

AuthController.login
```

Routes never contain:

Database code

Business logic

Validation

Authorization logic

Routes only compose middleware.

Example

```
Router

↓

Auth Middleware

↓

Role Middleware

↓

Validation Middleware

↓

Controller
```

---

# 43. Validation Pipeline

Every request must be validated before reaching the controller.

Validation includes:

Body

Query Parameters

URL Parameters

Headers (when required)

Validation uses Zod.

Invalid requests return HTTP 400 with structured validation errors.

Services should never validate HTTP input.

---

# 44. Authentication Flow

Protected endpoints require authentication.

Authentication middleware should:

Read JWT

↓

Verify Signature

↓

Load User

↓

Attach User Context

↓

Continue

Controllers never decode tokens manually.

---

# 45. Authorization Flow

Authorization happens after authentication.

Authorization verifies:

Role

Tenant

Permissions

Ownership

Example

```
Customer

×

Delete Gym

Denied
```

```
Owner

×

Delete Another Gym

Denied
```

```
Super Admin

✓

Allowed
```

---

# 46. User Context

Every authenticated request receives a User Context.

Example

```
request.user

id

email

role

tenantId

permissions
```

Controllers and Services should use this context.

Never trust client-supplied user IDs.

---

# 47. API Versioning

Every endpoint must be versioned.

```
/api/v1/
```

Future versions

```
/api/v2/
```

Never create unversioned APIs.

---

# 48. Response Pipeline

Every successful API should follow one response format.

Example

```json
{
  "success": true,
  "message": "Membership created successfully.",
  "data": { },
  "meta": { }
}
```

Errors

```json
{
  "success": false,
  "message": "Membership not found.",
  "error": {
      "code": "MEMBERSHIP_NOT_FOUND"
  }
}
```

Never return raw database objects.

---

# 49. Exception Flow

Unexpected exceptions should propagate.

```
Repository

↓

Service

↓

Controller

↓

Global Error Handler
```

Controllers should never wrap every method in repetitive try/catch blocks if a centralized async error wrapper is used.

---

# 50. Transactions

A transaction must be used whenever multiple database operations represent a single business action.

Examples

Membership Purchase

Payment Success

Refund

Owner Onboarding

Attendance + Reward Points (future)

Either everything succeeds

or

everything rolls back.

Never allow partial writes.

---

# 51. External Services

External integrations include:

Supabase

Razorpay

Email

SMS

Push Notifications

Storage

Never call external APIs directly from controllers.

Always create dedicated service classes.

Example

```
RazorpayService

NotificationService

StorageService
```

This keeps external dependencies isolated.

---

# 52. Background Jobs

Some tasks should not block HTTP requests.

Examples

Image optimization

Email sending

Push notifications

Report generation

Analytics aggregation

Future integrations

Background jobs should be processed asynchronously through a queue system when introduced.

The API should respond immediately after scheduling the task.

---

# 53. File Upload Flow

Uploads should follow this pipeline.

```
Client

↓

Validation

↓

File Type Check

↓

Size Validation

↓

Virus Scan (future)

↓

Upload to Supabase Storage

↓

Save Metadata

↓

Return URL
```

Never store binary files in PostgreSQL.

---

# 54. Razorpay Flow

Payment flow.

```
Client

↓

Backend

↓

Create Razorpay Order

↓

Client Checkout

↓

Payment Success

↓

Webhook

↓

Verify Signature

↓

Update Database

↓

Notify User
```

The webhook is the source of truth.

Never trust payment success returned directly from the client.

---

# 55. QR Attendance Flow

Attendance should always be verified on the server.

```
Customer

↓

Scan QR

↓

Backend

↓

Validate Gym

↓

Validate Membership

↓

Validate Duplicate Check-in

↓

Record Attendance

↓

Return Success
```

Attendance is never marked locally.

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

# 57. Health Endpoints

The backend should expose health endpoints.

```
GET /health
```

Returns

Database Status

Storage Status

API Version

Uptime

Environment

```
GET /ready
```

Used by Railway to determine readiness.

---

# 58. Graceful Shutdown

When the server stops:

Stop accepting new requests.

Finish active requests.

Flush logs.

Close database connections.

Terminate gracefully.

Never terminate abruptly unless forced.

---

# 59. Request Timeout

Every request should have a timeout.

Long-running operations should move to background jobs.

The API should never leave requests hanging indefinitely.

---

# 60. Golden Rule

Every HTTP request should be predictable.

Regardless of the module, every endpoint must behave consistently.

Consistency is more important than cleverness.

If two endpoints solving similar problems behave differently, the architecture is wrong.

# Part 4 — Authentication, Authorization & Multi-Tenant Security

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

# 84. Session Revocation

Admins may revoke sessions.

Examples

Owner suspended

Gym suspended

Password changed

Logout all devices

Future implementations should invalidate active refresh sessions.

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

# 89. Database Philosophy

Aura Apex uses PostgreSQL (Supabase) as the primary data store.

The database is responsible for:

- Data persistence
- Referential integrity
- ACID transactions
- Constraints
- Indexes

The database is **NOT** responsible for business logic.

Business rules belong in the Service Layer.

---

# 90. Why PostgreSQL?

Aura Apex manages highly relational data.

Examples

Customer

↓

Membership

↓

Payment

↓

Attendance

↓

Gym

↓

Owner

↓

Trainer

↓

Equipment

↓

Images

↓

Analytics

Relationships are first-class citizens.

PostgreSQL provides:

- ACID compliance
- Foreign Keys
- Transactions
- Indexes
- JSON support
- Excellent scalability
- Mature ecosystem

NoSQL is unnecessary for the current domain.

---

# 91. Multi-Tenant Database Design

Every business entity belongs to one tenant.

Example

```
Gym

↓

Members

↓

Attendance

↓

Payments

↓

Plans

↓

Equipment

↓

Gallery

↓

Trainers
```

Every table must contain

```
gym_id
```

except

- profiles
- gyms
- audit_logs
- platform tables

Every repository query must automatically filter using gym_id.

Cross-tenant queries are prohibited.

---

# 92. Database Design Principles

Every table must have

```
id

created_at

updated_at
```

Soft-deletable tables additionally contain

```
deleted_at
```

Avoid unnecessary nullable columns.

Normalize until it becomes impractical.

Prefer explicit foreign keys.

Never duplicate data unless there is a measured performance benefit.

---

# 93. Primary Keys

Use UUIDs for all primary keys.

Example

```
id UUID PRIMARY KEY
```

Reasons

- Better security
- Easier synchronization
- Harder to enumerate
- Distributed-friendly

Never expose sequential IDs publicly.

---

# 94. Foreign Keys

Every relationship must be enforced.

Example

```
membership.plan_id

↓

plans.id
```

Database integrity is mandatory.

Never rely solely on application logic.

---

# 95. Naming Convention

Tables

snake_case

Columns

snake_case

Indexes

idx_table_column

Unique Constraints

uq_table_column

Foreign Keys

fk_child_parent

Example

```
idx_attendance_member

fk_members_gym

uq_profiles_email
```

Consistency improves maintainability.

---

# 96. Repository Pattern

Every table has exactly one repository.

Example

```
MemberRepository

PlanRepository

AttendanceRepository
```

Repositories expose methods, not SQL.

Good

```
findById()

findByGym()

findActivePlan()
```

Bad

```
query1()

query2()

execute()
```

Repositories describe intent.

---

# 97. Query Rules

Repositories should only execute queries.

Never:

Calculate revenue

Check permissions

Validate memberships

Generate QR

Those belong to services.

---

# 98. Transactions

Transactions are mandatory whenever one business action performs multiple writes.

Examples

Membership Purchase

```
Create Subscription

↓

Insert Payment

↓

Activate Membership

↓

Commit
```

If one step fails

Rollback everything.

Never leave partial state.

---

# 99. Read vs Write Operations

Separate reads from writes conceptually.

Reads

Search

Pagination

Analytics

History

Writes

Create

Update

Delete

Activate

Suspend

This separation improves clarity and future scalability.

---

# 100. Pagination

Every list endpoint must support pagination.

Required parameters

```
page

limit
```

Optional

```
sort

order

search
```

Never return entire tables.

Maximum page size should be enforced.

---

# 101. Filtering

Filtering should occur in repositories.

Examples

Status

Date Range

Gym

Trainer

Membership

Plan

Attendance

Filtering logic should be reusable.

---

# 102. Searching

Search should support

Partial matching

Case insensitive

Pagination

Future full-text search

Repositories own search implementations.

---

# 103. Soft Delete

Soft delete should be used for mutable business entities.

Examples

Members

Plans

Equipment

Trainers

Gallery Images

Soft delete adds

```
deleted_at
```

Deleted records remain recoverable.

---

# 104. Hard Delete

Hard delete only when legally or operationally required.

Examples

Temporary uploads

Cache tables

Test data

Payments and attendance records should never be hard deleted.

---

# 105. Audit Data

Financial and operational history should remain immutable.

Never edit

Payments

Attendance History

Audit Logs

Instead create correction records where necessary.

---

# 106. Index Strategy

Index every frequently queried column.

Examples

```
email

gym_id

plan_id

member_id

attendance_date

status

created_at
```

Composite indexes should be added for common query patterns.

Indexes should be reviewed periodically.

---

# 107. Constraints

Use database constraints aggressively.

Examples

UNIQUE

CHECK

FOREIGN KEY

NOT NULL

Application validation complements database constraints but never replaces them.

---

# 108. Migrations

All schema changes must be version controlled.

Never manually modify production databases.

Every schema change requires

Migration

Review

Testing

Rollback strategy

Database migrations are the only approved way to change schema.

---

# 109. Views

Use PostgreSQL Views for

Complex reporting

Analytics

Dashboard summaries

Do not use Views for core transactional operations.

---

# 110. Materialized Views (Future)

For expensive analytics

Monthly revenue

Attendance summaries

Retention

Leaderboards

Materialized Views may be introduced.

Refresh asynchronously.

Never refresh during API requests.

---

# 111. Data Integrity

Application validation

+

Database constraints

+

Transactions

=

Reliable data

Never depend on only one layer.

---

# 112. Repository Return Types

Repositories return domain models.

Controllers return DTOs.

Never expose raw database rows directly to API clients.

Transformation belongs inside services or dedicated mappers.

---

# 113. Bulk Operations

Bulk inserts and updates should be supported for

Customer imports

Equipment imports

Attendance imports

Bulk operations must remain transactional where possible.

---

# 114. Image Metadata

Images should never be stored inside PostgreSQL.

Only metadata.

Example

```
id

gym_id

bucket

path

mime_type

size

uploaded_by

created_at
```

Binary data remains in Supabase Storage.

---

# 115. Analytics Data

Analytics does not own data.

Analytics reads from

Attendance

Payments

Plans

Members

Reports

Future optimization may introduce precomputed aggregates.

---

# 116. Backup Strategy

Production databases require

Automated backups

Point-in-time recovery (if available)

Periodic restore testing

Backups are only useful if they can be restored.

---

# 117. Performance Guidelines

Avoid

SELECT *

Prefer explicit columns.

Avoid unnecessary joins.

Paginate large datasets.

Use indexes.

Profile slow queries.

Never optimize prematurely.

Measure first.

---

# 118. Future Scalability

The schema should support future additions without breaking existing tables.

Potential future modules

Branches

POS

Inventory

Workout Plans

Diet Plans

Coupons

Loyalty

Corporate Memberships

Referral System

Wearables

New modules should introduce new tables rather than modifying unrelated existing tables whenever practical.

---

# 119. Golden Rule

The database stores facts.

The Service Layer decides what those facts mean.

Never move business logic into SQL merely because it is possible.

Maintain a clear separation between persistence and business behavior.

# Part 6 — Feature Modules & Domain Architecture

---

# 120. Domain-Driven Module Philosophy

Aura Apex is divided into independent business modules.

Each module owns:

• Business Logic

• API Endpoints

• Validation

• DTOs

• Services

• Repository

• Events

• Permissions

Every feature belongs to exactly one module.

No feature should belong to multiple modules.

---

# 121. Module Communication

Modules must communicate through Services.

Allowed

```
AttendanceService

↓

MembershipService
```

Forbidden

```
AttendanceRepository

↓

MembershipRepository
```

Modules must never directly access another module's database layer.

This preserves encapsulation.

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

# 123. Gym Module

Purpose

Represents a Gym (Tenant).

Responsibilities

Gym Profile

Timings

Weekly Off Days

Contact Information

Gallery

Settings

QR Configuration

Owner Assignment

Dependencies

Authentication

Storage

Notifications

Gym owns

Everything belonging to one tenant.

---

# 124. Member Module

Purpose

Manage gym customers.

Responsibilities

Create Member

Update Profile

Membership Status

Attendance History

Plan History

Profile

Dependencies

Gym

Plans

Attendance

Payments

Notifications

Member module does NOT process payments.

---

# 125. Plan Module

Purpose

Manage membership plans.

Responsibilities

Create Plan

Update Plan

Activate

Deactivate

Pricing

Duration

Visibility

Dependencies

Gym

Plans never activate memberships directly.

---

# 126. Subscription Module

Purpose

Manage active memberships.

Responsibilities

Purchase

Renewal

Expiry

Auto Renew

Cancellation

Status

Dependencies

Plans

Payments

Notifications

Attendance

Subscription owns membership lifecycle.

---

# 127. Payment Module

Purpose

Financial transactions.

Responsibilities

Create Razorpay Orders

Verify Webhooks

Store Payments

Refund

Invoices (future)

Revenue

Dependencies

Razorpay

Subscriptions

Audit Logs

Payment module is the financial source of truth.

---

# 128. Attendance Module

Purpose

Attendance tracking.

Responsibilities

QR Check-in

Attendance History

Duplicate Prevention

Statistics

Dependencies

Gym

Members

Subscriptions

Attendance must always validate

Active Membership

Gym Ownership

QR Validity

before recording attendance.

---

# 129. QR Module

Purpose

Manage Gym QR Codes.

Responsibilities

Generate QR

Revoke QR

Replace QR

QR Metadata

QR Status

Dependencies

Gym

Attendance

Important

QR never records attendance.

Attendance module owns attendance.

QR module only owns QR lifecycle.

---

# 130. Trainer Module

Purpose

Manage trainers.

Responsibilities

Trainer Profile

Images

Specialization

Status

Availability

Assignments (future)

Dependencies

Gym

Gallery

Trainer module never owns customers.

---

# 131. Equipment Module

Purpose

Manage gym equipment.

Responsibilities

Equipment

Category

Status

Maintenance

Images

Purchase Details

Dependencies

Gym

Gallery

Future

Maintenance reminders.

---

# 132. Gallery Module

Purpose

Manage images.

Responsibilities

Upload

Delete

Compression

Optimization

Metadata

Dependencies

Supabase Storage

Gallery never knows

Gym

Trainer

Equipment

It only manages images.

Business modules decide how images are used.

---

# 133. Analytics Module

Purpose

Business intelligence.

Consumes

Attendance

Payments

Subscriptions

Plans

Members

Equipment

Produces

Charts

KPIs

Revenue

Growth

Retention

Analytics never modifies business data.

Read-only module.

---

# 134. Notification Module

Purpose

Deliver notifications.

Channels

Push

Email (future)

SMS (future)

WhatsApp (future)

Notifications should be event-driven.

Never tightly coupled.

---

# 135. Admin Module

Purpose

Platform administration.

Responsibilities

Owner Onboarding

Gym Approval

Gym Suspension

Platform Analytics

Platform Settings

Subscription Monitoring

Support

Admin module bypasses tenant isolation.

---

# 136. Cross Module Rules

Allowed

Attendance

↓

Subscription

↓

Plans

Forbidden

Attendance

↓

Payments

Attendance should ask

"Is Membership Active?"

not

"Has payment succeeded?"

Responsibilities remain separated.

---

# 137. Business Events

Modules communicate using domain events.

Examples

MemberCreated

MembershipPurchased

PaymentCaptured

AttendanceMarked

QRGenerated

TrainerCreated

EquipmentAdded

GymCreated

Events reduce coupling.

---

# 138. Event Flow Example

Payment Success

↓

Payment Module

↓

Membership Activated

↓

Attendance Enabled

↓

Notification Sent

↓

Analytics Updated

Each module reacts independently.

---

# 139. Ownership Rules

Each module owns exactly one business capability.

Example

Payments own

Money

Attendance owns

Attendance

QR owns

QR

Analytics owns

Reporting

Never mix ownership.

---

# 140. Dependency Graph

```
Auth

↓

Gym

↓

Members

↓

Plans

↓

Subscriptions

↓

Payments

↓

Attendance

↓

Analytics

↓

Notifications
```

Higher modules should never depend on lower modules.

Avoid circular dependencies.

---

# 141. Module Independence

A module should be removable without affecting unrelated modules.

Removing Equipment should never break

Payments

Attendance

Plans

Authentication

Loose coupling is mandatory.

---

# 142. Feature Addition Rule

Every new feature must answer

1.

Which module owns it?

2.

Which services does it depend on?

3.

Does it introduce a new business capability?

If ownership is unclear,

the feature should be redesigned before implementation.

---

# 143. Future Modules

The architecture should support adding modules such as

Inventory

POS

Workout Plans

Diet Plans

Loyalty

Coupons

Corporate Memberships

Online Coaching

Marketplace

Wearables

AI Coach

without modifying existing modules.

Each future capability should be introduced as an independent module following the same architectural rules.

---

# 144. Golden Rule

Modules own behavior.

Services own business rules.

Repositories own persistence.

Controllers own HTTP.

No layer should assume another layer's responsibility.

Maintaining these boundaries is mandatory for long-term scalability and maintainability.

# Part 7 — Security & Production Hardening

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

# 160. Razorpay Webhook Security

Every webhook must verify

Signature

Timestamp (if supported)

Secret

Never trust client payment success.

Only webhook confirmation updates financial records.

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

# 170. Payment Security

Payments are immutable.

Never edit payment records.

Corrections require

Refund

Adjustment

New Transaction

---

# 171. Attendance Security

Attendance always validates

Membership

Gym

QR

Duplicate Check

Date

Time

Attendance cannot be created directly from the database.

Always through service layer.

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

# 181. Performance Philosophy

Performance should be designed into the architecture rather than optimized as an afterthought.

The backend should remain responsive under increasing load without requiring major architectural changes.

Rules

- Measure before optimizing.
- Optimize bottlenecks, not assumptions.
- Prefer readability over micro-optimizations.
- Scale infrastructure before rewriting code.
- Every optimization must have measurable impact.

---

# 182. Scalability Goals

The architecture should comfortably support

Phase 1

- 10 Gyms
- 5,000 Users

Phase 2

- 100 Gyms
- 50,000 Users

Phase 3

- 1,000+ Gyms
- 500,000+ Users

without changing the application architecture.

Infrastructure should be the only scaling concern.

---

# 183. Stateless Backend

The Express backend must remain completely stateless.

Never store

- Sessions
- User state
- QR state
- Attendance state
- Payment state

inside server memory.

All persistent state belongs in

- PostgreSQL
- Supabase Storage
- Authentication Provider

This enables horizontal scaling.

---

# 184. Horizontal Scaling

Multiple backend instances should behave identically.

```
        Load Balancer
              │
────────────────────────
│          │          │
API 1    API 2     API 3
│          │          │
──────── PostgreSQL ────────
```

No request should depend on a specific server instance.

---

# 185. Database Performance

Repositories should

- Select only required columns.
- Avoid SELECT *.
- Use indexes.
- Paginate large datasets.
- Avoid unnecessary joins.
- Batch queries where practical.

Every slow query should be investigated.

---

# 186. Pagination

Every collection endpoint must implement pagination.

Required

```
page

limit
```

Optional

```
sort

order

search

filters
```

Never return unlimited records.

Recommended maximum

100 records per request.

---

# 187. Sorting

Repositories should support sorting.

Examples

Newest

Oldest

Revenue

Attendance

Alphabetical

Sorting belongs inside repositories.

---

# 188. Searching

Searching should support

- Partial matches
- Case insensitive
- Pagination
- Indexed columns

Future

PostgreSQL Full Text Search.

---

# 189. Image Performance

Images should never block API performance.

Images stored in

Supabase Storage

Database stores metadata only.

Frontend loads images lazily.

Future

Image compression

CDN

Multiple resolutions

---

# 190. File Upload Optimization

Upload pipeline

```
Client

↓

Validation

↓

Upload

↓

Storage

↓

Metadata

↓

Response
```

Future

Background optimization

Thumbnail generation

Compression

WebP conversion

---

# 191. Background Jobs

Expensive tasks should never block API requests.

Examples

Email

Push Notifications

Analytics

Report Generation

Image Processing

Future AI

Background jobs improve response times.

---

# 192. Event Driven Architecture

Modules communicate through domain events.

Example

```
PaymentCaptured

↓

Subscription Updated

↓

Analytics Updated

↓

Notification Sent
```

Events reduce coupling.

---

# 193. API Response Time Goals

Simple Read

< 150ms

Authenticated Read

< 250ms

Complex Search

< 500ms

Uploads

Depends on file size.

Analytics

May exceed 500ms.

Long-running operations should move to background jobs.

---

# 194. Connection Management

Use connection pooling.

Avoid opening new database connections for every request.

Reuse connections whenever possible.

---

# 195. Memory Management

Avoid

Large in-memory arrays.

Large JSON objects.

Long-running synchronous loops.

Prefer streaming for large datasets.

---

# 196. Health Checks

Expose

```
GET /health
```

Returns

- API Status
- Database Status
- Storage Status
- Version
- Uptime

```
GET /ready
```

Used for deployment readiness.

```
GET /live
```

Returns server liveness.

---

# 197. Monitoring

Production should monitor

API Latency

Error Rate

CPU Usage

Memory

Database

Storage

Webhook Failures

Payment Failures

Attendance Failures

Monitoring should detect problems before users do.

---

# 198. Logging

Use structured logging.

Every request receives

Request ID

Timestamp

Duration

Status Code

User ID (if authenticated)

Gym ID

Critical actions generate business logs.

---

# 199. Error Tracking

Unexpected exceptions should be centralized.

Future

Integrate

Sentry

OpenTelemetry

or equivalent observability platform.

Never rely only on console logs.

---

# 200. Timeouts

External services require timeouts.

Examples

Razorpay

Email

Storage

Future APIs

Never wait indefinitely.

Implement retries only for safe operations.

---

# 201. Retry Strategy

Safe retries

Read operations

Webhook verification

Notification delivery

Unsafe retries

Payment capture

Refund

Membership purchase

Idempotency is mandatory for retryable writes.

---

# 202. Circuit Breakers (Future)

If an external service becomes unavailable,

Temporarily stop requests.

Prevent cascading failures.

Recover automatically.

---

# 203. Graceful Shutdown

Shutdown sequence

Stop accepting requests.

↓

Finish active requests.

↓

Flush logs.

↓

Close database connections.

↓

Exit.

Never terminate immediately.

---

# 204. Caching Philosophy

Do not cache prematurely.

Only cache

Frequently read

Rarely changing

Expensive data.

Examples

Gym Settings

Membership Plans

Analytics Snapshots

Never cache financial truth.

Payments always come from PostgreSQL.

---

# 205. Redis Strategy (Future)

Redis is optional.

Introduce Redis only when profiling demonstrates a real need.

Recommended uses

- Rate limiting
- Temporary OTP storage
- Short-lived caches
- Background job queues
- Session blacklisting (if needed)

Do not use Redis as the primary data store.

---

# 206. API Compression

Enable gzip or brotli compression.

Compress

JSON

Text

Responses

Never compress already compressed files.

---

# 207. Static Assets

Static assets should be served by object storage or CDN.

Never serve large media directly from Express.

---

# 208. Deployment Strategy

Deploy backend on Railway.

Requirements

- Environment variables
- Health checks
- Automatic restart
- Zero-downtime deployments
- Rollback support

---

# 209. Backup Strategy

Database

Daily automated backups.

Storage

Versioning if supported.

Regular restore testing.

Backups are meaningless unless recovery is verified.

---

# 210. Disaster Recovery

The platform should recover from

Server failure

Database outage

Deployment failure

Storage outage

Recovery procedures should be documented and tested.

---

# 211. Future Scaling

The architecture should support future additions such as

- Read replicas
- CDN
- Message queues
- Distributed caching
- Multiple API instances
- Multi-region deployment

without changing business logic.

---

# 212. Performance Checklist

Before every release verify

✓ No N+1 queries

✓ Pagination

✓ Indexes

✓ Compression

✓ Logging

✓ Health checks

✓ Timeouts

✓ Slow query review

✓ Image optimization

✓ Monitoring

✓ Database backups

✓ Successful load testing

---

# 213. Golden Rule

Build for today's requirements.

Design for tomorrow's growth.

Never overengineer.

Never underengineer.

Scale because the product grows—not because the architecture failed.

# Part 9 — Testing, Deployment & DevOps

---

# 214. DevOps Philosophy

Deployment should be boring.

A successful deployment should require no manual intervention.

Every deployment should be:

- Repeatable
- Automated
- Reversible
- Observable

Production deployments should never depend on developer machines.

---

# 215. Git Branch Strategy

The project follows a simplified Git Flow.

```
main
│
├── develop
│
├── feature/auth
├── feature/payments
├── feature/attendance
├── feature/analytics
│
├── bugfix/login
│
└── hotfix/payment-webhook
```

Rules

main

Production-ready code only.

develop

Latest stable development.

feature/*

One feature per branch.

bugfix/*

Bug fixes.

hotfix/*

Critical production fixes.

Never commit directly to main.

---

# 216. Commit Convention

Every commit should follow Conventional Commits.

Examples

```
feat(auth): implement customer registration

feat(payments): integrate Razorpay webhooks

fix(attendance): prevent duplicate check-in

refactor(plans): simplify validation

docs(system): update architecture

test(auth): add login tests

chore(ci): configure GitHub Actions
```

Benefits

- Better history
- Automatic changelogs
- Easier releases

---

# 217. Pull Request Rules

Every PR should

- Solve one problem only.
- Be reviewed.
- Pass CI.
- Build successfully.
- Include tests when applicable.

PR checklist

✓ Builds

✓ Lints

✓ Tests

✓ Documentation updated

✓ No secrets

✓ No console logs

---

# 218. Code Review Checklist

Reviewers verify

Architecture

Security

Performance

Naming

Error handling

Validation

Testing

Documentation

Maintainability

Readability

Reviewers should focus on long-term quality, not only correctness.

---

# 219. Testing Philosophy

Testing should verify behavior rather than implementation.

Prefer

"What should happen?"

instead of

"Which function was called?"

Tests should give confidence to refactor safely.

---

# 220. Testing Pyramid

```
          E2E
        /     \
 Integration
     /         \
 Unit Tests
```

Most tests should be Unit Tests.

Fewer Integration Tests.

Very few End-to-End tests.

---

# 221. Unit Tests

Every service should have unit tests.

Examples

Membership expiry

Revenue calculation

QR validation

Attendance rules

Permission logic

Unit tests never access real databases.

---

# 222. Integration Tests

Integration tests verify

API

Database

Storage

External services (mocked where appropriate)

Examples

Login

Payment flow

Attendance

Plan purchase

---

# 223. End-to-End Tests

Critical business flows only.

Examples

Customer Registration

Membership Purchase

QR Attendance

Gym Owner Onboarding

Avoid excessive E2E coverage.

---

# 224. Test Environment

Testing should never use production resources.

Separate

Database

Storage

Secrets

API Keys

Environment Variables

Test data must be isolated.

---

# 225. CI/CD

Every push triggers

Install Dependencies

↓

Lint

↓

Type Check

↓

Run Tests

↓

Build

↓

Deploy (approved branches)

Deployment only occurs after successful validation.

---

# 226. GitHub Actions

Pipeline should include

- Dependency installation
- ESLint
- TypeScript build
- Unit Tests
- Integration Tests (future)
- Production Build

Failed pipelines block merges.

---

# 227. Railway Deployment

Railway hosts

Express Backend

Requirements

Environment Variables

Health Endpoint

Automatic Restart

Build Command

Start Command

Deployment should be automatic from GitHub.

---

# 228. Environment Configuration

Supported environments

Development

Testing

Staging (future)

Production

Each environment has independent

Secrets

Database

Storage

Configuration

Never reuse production credentials.

---

# 229. Environment Variables

Every environment variable must be documented.

Example

```
NODE_ENV

PORT

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

RAZORPAY_KEY_ID

RAZORPAY_SECRET

RAZORPAY_WEBHOOK_SECRET
```

Missing variables should fail startup immediately.

---

# 230. Database Migrations

Schema changes only through migrations.

Rules

Never edit production manually.

Every migration must

Be reviewed

Be reversible

Be tested

Migration history should remain immutable.

---

# 231. Release Strategy

Every production release should follow

Build

↓

Automated Tests

↓

Deploy

↓

Health Check

↓

Monitor

↓

Rollback if necessary

Releases should be predictable.

---

# 232. Rollback Strategy

Rollback must be possible if

Deployment fails

Critical bug discovered

Database migration issue

Rollback procedures should be documented before deployment.

---

# 233. Monitoring

Production monitoring includes

API Latency

Database

Memory

CPU

Errors

Storage

Payments

Attendance

Webhook failures

Monitoring should generate alerts.

---

# 234. Logging

Structured logs should include

Request ID

Timestamp

User ID

Gym ID

Route

Status Code

Duration

Logs should support troubleshooting.

---

# 235. Health Monitoring

Health endpoints

```
GET /health

GET /ready

GET /live
```

Deployment platforms use these endpoints to determine application health.

---

# 236. Backup Strategy

Production

Daily Database Backup

Weekly Restore Verification

Storage Backup Strategy

Periodic backup testing

Recovery should be tested regularly.

---

# 237. Disaster Recovery

Recovery plan includes

Server Failure

Database Failure

Storage Failure

Deployment Failure

Recovery procedures should be documented.

---

# 238. Documentation

Every public API

Every module

Every environment variable

Every migration

must be documented.

Documentation is part of the product.

---

# 239. Release Checklist

Before production deployment

✓ Tests Passing

✓ Build Successful

✓ Lint Passing

✓ Type Check Passing

✓ Environment Variables Verified

✓ Database Migration Reviewed

✓ Health Endpoint Working

✓ Monitoring Enabled

✓ Rollback Plan Ready

✓ Documentation Updated

---

# 240. Golden Rule

Deploy confidently.

Monitor continuously.

Rollback quickly.

Improve continuously.

A successful deployment is one users never notice.

# Part 10 — Engineering Standards & Project Constitution

---

# 241. Engineering Philosophy

The codebase should be written for humans first and computers second.

Readable code is more valuable than clever code.

The goal is not to write the shortest code.

The goal is to write code that another engineer can understand six months later.

Every engineer should leave the codebase cleaner than they found it.

---

# 242. SOLID Principles

Every module must follow SOLID.

### Single Responsibility Principle

One class.

One responsibility.

---

### Open Closed Principle

Extend modules.

Never modify stable modules unless necessary.

---

### Liskov Substitution

Interfaces should be interchangeable.

---

### Interface Segregation

Small focused interfaces.

Never giant interfaces.

---

### Dependency Inversion

Depend on abstractions.

Never concrete implementations.

---

# 243. DRY

Do not duplicate business logic.

If the same logic exists twice,

extract it.

Duplicate code always becomes inconsistent.

---

# 244. KISS

Keep It Simple.

Prefer

Simple

Readable

Maintainable

Avoid unnecessary abstractions.

Never introduce complexity "because we might need it."

---

# 245. YAGNI

You Aren't Gonna Need It.

Do not implement future features today.

Examples

❌ AI Services

❌ Redis

❌ Kafka

❌ RabbitMQ

❌ Microservices

until the business actually requires them.

---

# 246. Feature Ownership

Every feature has exactly one owner.

Example

Attendance

↓

Attendance Module

Payments

↓

Payment Module

Analytics

↓

Analytics Module

Never split ownership.

---

# 247. DTO Rules

Every API must use DTOs.

Never expose

Database Models

Database Rows

ORM Objects

Controllers return DTOs only.

---

# 248. TypeScript Rules

Strict Mode enabled.

Never disable

```
strict

noImplicitAny

strictNullChecks
```

Never use

```
any
```

Use

```
unknown
```

when necessary.

Prefer explicit types.

---

# 249. Naming Rules

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case or module-name.type.ts

Database

snake_case

Consistency is mandatory.

---

# 250. Function Rules

Functions should

Do one thing.

Be small.

Be testable.

Avoid hidden side effects.

Avoid deeply nested conditions.

Extract complexity into helper functions.

---

# 251. Service Rules

Services own business logic.

Services never

Access Express Request

Access Response

Read Headers

Write HTTP Status

Throw framework-specific errors

Services remain framework independent.

---

# 252. Repository Rules

Repositories

Only access database.

Never

Calculate Revenue

Validate Membership

Generate QR

Send Notifications

Repositories persist data.

Nothing else.

---

# 253. Controller Rules

Controllers

Receive Request.

Call Service.

Return Response.

Nothing more.

Controllers should remain thin.

---

# 254. Validation Rules

Validation occurs

Before Controller.

Never inside Services.

Never inside Repositories.

Use Zod.

Validation failures return

400 Bad Request.

---

# 255. Error Handling

Never throw raw Error.

Use custom error classes.

Example

```
ValidationError

UnauthorizedError

ForbiddenError

ConflictError

NotFoundError

PaymentError
```

Global middleware converts errors into API responses.

---

# 256. API Response Standard

Every success response

```json
{
    "success": true,
    "message": "...",
    "data": {},
    "meta": {}
}
```

Every failure

```json
{
    "success": false,
    "message": "...",
    "error": {
        "code": "..."
    }
}
```

Never invent different formats.

---

# 257. HTTP Status Codes

200

Success

201

Created

204

No Content

400

Validation

401

Unauthenticated

403

Forbidden

404

Not Found

409

Conflict

422

Business Rule Failure

429

Rate Limited

500

Unexpected Error

Use status codes consistently.

---

# 258. Logging Rules

Never use

```
console.log()
```

Use structured logger.

Levels

Trace

Debug

Info

Warn

Error

Fatal

Production logs should be machine-readable.

---

# 259. Documentation Rules

Every public function should explain

Purpose

Parameters

Returns

Side effects

Complex algorithms require comments explaining *why*, not *what*.

---

# 260. Comments

Bad

```ts
// increment i

i++;
```

Good

```ts
// Prevent duplicate attendance when network retries occur.
```

Code explains "what".

Comments explain "why".

---

# 261. Constants

Avoid magic numbers.

Bad

```
if(days > 30)
```

Good

```
MAX_PLAN_DURATION
```

Constants improve readability.

---

# 262. Environment Rules

Never read process.env directly.

Use centralized configuration.

Example

```
config.env.JWT_SECRET
```

Single source of truth.

---

# 263. Dependency Rules

Every dependency

Must be maintained.

Must have documentation.

Must have community support.

Remove unused packages.

Minimize dependencies.

---

# 264. Database Rules

No raw SQL inside controllers.

No raw SQL inside services.

Repositories own persistence.

Always use transactions for multi-step writes.

---

# 265. API Versioning

Every endpoint

```
/api/v1/
```

Breaking changes require

```
/api/v2/
```

Never silently break clients.

---

# 266. New Module Checklist

Before creating a module ask

Does it represent a business capability?

Does it own business logic?

Does it need APIs?

Does it need persistence?

If yes

Create new module.

Otherwise

Extend existing module carefully.

---

# 267. Adding New APIs

Every new endpoint requires

Route

Validation

Controller

Service

Repository (if needed)

DTO

Tests

Documentation

Nothing is optional.

---

# 268. Adding New Roles

Never hardcode permissions.

Add

Role

Permissions

Middleware

Tests

Documentation

RBAC must remain centralized.

---

# 269. Anti Patterns

Never

❌ Fat Controllers

❌ Fat Routes

❌ Business Logic in Middleware

❌ SQL inside Controllers

❌ Circular Dependencies

❌ Duplicate Logic

❌ Shared Mutable State

❌ Global Variables

❌ Silent Exceptions

❌ Copy Paste Programming

❌ Hardcoded Secrets

❌ Direct Cross Module Repository Access

Violating these rules requires architectural review.

---

# 270. Code Review Principles

Every review asks

Is it readable?

Is it secure?

Is it testable?

Is it maintainable?

Is it modular?

Will this still make sense in two years?

---

# 271. Performance Rules

Never optimize blindly.

Measure.

Profile.

Optimize.

Repeat.

Premature optimization creates complexity.

---

# 272. Security Rules

Never trust

Client

Headers

Payload

Query

JWT Claims

Always verify.

Always validate.

Always authorize.

---

# 273. Refactoring Rules

Refactor when

Complexity increases.

Duplication appears.

Naming becomes confusing.

Architecture drifts.

Never refactor only for personal preference.

---

# 274. Architecture Decision Records (ADR)

Significant architectural decisions should be documented.

Examples

Switching ORM

Introducing Redis

Adding Queue System

Migrating Storage

Moving to Microservices

Every major decision requires an ADR.

---

# 275. Project Success Metrics

The backend is considered successful when

New modules require minimal changes.

Features remain isolated.

Testing is straightforward.

Developers onboard quickly.

Performance scales predictably.

Security incidents are minimized.

Production deployments are routine.

---

# 276. Final Architecture Rules

These rules are absolute.

1.

Controllers never contain business logic.

2.

Services own business logic.

3.

Repositories own persistence.

4.

Validation happens before controllers.

5.

Authentication before authorization.

6.

Every request is logged.

7.

Every write is auditable.

8.

Every feature belongs to one module.

9.

Every module is independently maintainable.

10.

Every API is versioned.

11.

Every response follows one format.

12.

Every business rule exists in exactly one place.

13.

Every database change uses migrations.

14.

Every secret stays outside the codebase.

15.

Every engineer leaves the project better than they found it.

---

# 277. The Aura Apex Engineering Oath

We build software that is:

Reliable.

Maintainable.

Scalable.

Secure.

Readable.

Testable.

Documented.

Modular.

Future-ready.

We optimize for long-term success over short-term convenience.

Every line of code should make the next engineer's job easier—not harder.

That is the standard of Aura Apex.