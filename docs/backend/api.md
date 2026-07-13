# API Design & Layer Responsibilities

- **Purpose**: Specifies endpoint design, routing, controller/service structure, DTO utilization, and error response standards.
- **Scope**: API Controllers, routes, DTOs, versioning, status codes, and error formatting.
- **Related Documents**: [Request Lifecycle](../architecture/request_lifecycle.md), [Database Architecture](./database.md)
- **Last Updated**: 2026-07-13

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

# 253. Controller Rules

Controllers

Receive Request.

Call Service.

Return Response.

Nothing more.

Controllers should remain thin.

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