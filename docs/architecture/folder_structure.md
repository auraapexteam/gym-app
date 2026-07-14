# Folder Structure & Module Organization

- **Purpose**: Explains the physical folder structure of the monorepo and the feature-first backend layout.
- **Scope**: Entire directory workspace structure.
- **Related Documents**: [Backend Architecture](./backend_architecture.md), [System Design Overview](./system_design.md)
- **Last Updated**: 2026-07-13

---

### Workspace Monorepo Layout
As defined in the root README, the repository has a monorepo structure separating the client, API, database migrations, and project documentation:
```text
Gym-Management-App/
├── backend/                  # Node.js + Express.js API Server
├── frontend/                 # React Native CLI Mobile Application
├── supabase/                 # Version-controlled database migrations
├── schema.sql                # Complete updated PostgreSQL relational schema
└── docs/                     # Project Engineering Handbook (This handbook)
```

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
│   │   ├── admin/
│   │   └── progress/
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