# Backend Architecture

- **Purpose**: Defines goals, architectural style, layering principles, and features coupling rules.
- **Scope**: Backend API Server and module boundaries.
- **Related Documents**: [Request Lifecycle](./request_lifecycle.md), [Folder Structure](./folder_structure.md)
- **Last Updated**: 2026-07-13

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

# 12. Scalability Principles

The system must support

10 gyms

100 gyms

1,000 gyms

10,000 gyms

without redesign.

Rules

Every feature isolated.

Feature-first architecture.

Independent modules.

Service layer.

Repository layer.

No shared mutable state.

Transactions for financial operations.

Background jobs for expensive tasks.

Images never stored in database.

Large queries paginated.

Indexes on searchable fields.

Soft delete where appropriate.

No business logic inside controllers.

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