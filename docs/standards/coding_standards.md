# Coding Standards & Engineering Guidelines

- **Purpose**: Defines naming conventions, TypeScript practices, SOLID architecture compliance rules, and code review criteria.
- **Scope**: Coding guidelines, folder exports conventions, and DTO rules.
- **Related Documents**: [Backend Architecture](../architecture/backend_architecture.md), [Architecture Rules](./architecture_rules.md)
- **Last Updated**: 2026-07-13

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

# 17. Development Principles

The project follows these principles.

Single Responsibility Principle

SOLID

Clean Architecture

Feature-first organization

Repository Pattern

Service Layer

Dependency Injection where beneficial

DTOs

Strict TypeScript

Centralized error handling

API Versioning

Reusable components

Reusable hooks

Shared validation

Atomic commits

Comprehensive documentation

No breaking API changes

---

# 18. Project Standards

Backend implementation must comply with:

API_CONTRACTS.md

Frontend implementation must comply with:

UI_SYSTEM.md

These documents define the coding standards, API contracts, UI consistency, naming conventions, validation rules, and design language for the entire platform.

This document only defines the overall system architecture.

Implementation details belong in their respective design documents.

---