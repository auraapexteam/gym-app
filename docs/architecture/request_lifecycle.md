# Backend Request Lifecycle

- **Purpose**: Documents the execution path of a request through Express, middleware, and backend layers.
- **Scope**: API Request processing pipeline.
- **Related Documents**: [Backend Architecture](./backend_architecture.md), [API Design](../backend/api.md)
- **Last Updated**: 2026-07-13

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