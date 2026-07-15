# Aura Apex – Production Hardening Roadmap

## Objective

Transform the current backend into a production-grade backend while preserving the existing architecture.

The current architecture, folder structure and module boundaries are already finalized.

Do NOT rewrite the backend.

Do NOT introduce unnecessary abstractions.

Do NOT convert to microservices.

Only improve correctness, security, maintainability and production readiness.

---

# Engineering Principles

These rules are mandatory.

- Never break existing APIs unless absolutely required.
- Every change must remain modular.
- Preserve the current layered architecture.

Controller
↓

Service
↓

Repository
↓

Supabase

- No business logic inside controllers.
- No SQL outside repositories.
- Validation before controllers.
- Every write should be auditable.
- Every critical change must include tests.

---

# Work Strategy

Work only one milestone at a time.

Never modify multiple unrelated systems in one milestone.

Each milestone must:

- compile successfully
- pass type checking
- keep previous functionality working
- update documentation
- include tests where applicable

---

# Milestone 1 – Testing Foundation

Objective:

Create a complete testing infrastructure.

Tasks

- Configure Vitest (preferred) or Jest.
- Configure Supertest.
- Create testing utilities.
- Create test environment.
- Create test database strategy.
- Add CI test command.
- Ensure `npm test` works.

Then create tests for

- authentication
- RBAC
- tenant isolation
- plans
- subscriptions
- attendance
- payments
- uploads

No feature development until testing infrastructure exists.

---

# Milestone 2 – Tenant Isolation Audit

Audit every repository.

Every tenant-owned query must derive gymId from authenticated server context.

Never trust gymId from client requests.

Verify

- Members
- Plans
- Attendance
- QR
- Equipment
- Trainers
- Gallery
- Notifications
- Progress

Create authorization tests proving

Gym A cannot access Gym B.

---

# Milestone 3 – Transaction Safety

Identify every multi-step workflow.

Convert critical workflows into atomic operations.

Examples

- Gym onboarding
- Owner creation
- Trainer creation
- Staff creation
- Join request approval
- Refund
- Subscription activation

Database writes should be transactional.

External side effects should occur only after successful commit.

---

# Milestone 4 – Payment Hardening

Improve Razorpay integration.

Requirements

- Store webhook events.
- Track processing status.
- Prevent duplicate processing.
- Prevent duplicate refunds.
- Verify captured payment before activation.
- Make webhook authoritative.

Add payment event table.

Implement idempotency.

---

# Milestone 5 – Attendance Hardening

Attendance must be database enforced.

Requirements

Unique constraint

(gym_id, member_id, attendance_date)

Return HTTP 409 for duplicates.

Create concurrency tests.

---

# Milestone 6 – API Contract

Generate OpenAPI documentation.

Document

- every endpoint
- request DTO
- response DTO
- error responses
- authentication
- role permissions
- pagination
- examples

Frontend should never need backend source code.

---

# Milestone 7 – Authentication Security

Review

- email verification
- password reset
- auth middleware
- logging
- JWT validation

Never log

- JWT
- Access Token
- Refresh Token
- Secrets

Require

SUPABASE_ANON_KEY

Do not allow fallback to service role.

---

# Milestone 8 – Upload Security

Review upload flow.

Requirements

- pending uploads
- ownership validation
- gym validation
- storage privacy
- image validation

Progress images

Private

Gallery

Public

---

# Milestone 9 – Progress Module

Restrict writes.

Customers only.

Validate

- weight
- water
- protein
- future dates
- image ownership

Prevent invalid values.

---

# Milestone 10 – CI/CD

Create GitHub Actions.

Pipeline

Install

↓

Typecheck

↓

Lint

↓

Tests

↓

Migration Validation

↓

Build

Every pull request must pass.

---

# Milestone 11 – Migration Validation

Automatically verify

Supabase migrations

on clean database.

Prevent schema drift.

---

# Milestone 12 – Operational Readiness

Configure

- Health endpoints
- Readiness endpoint
- Structured logging
- Error monitoring
- Backup documentation
- Restore documentation
- Deployment documentation
- Incident response guide

---

# Documentation Rules

Whenever implementation changes

Update

- architecture docs
- backend docs
- API contract
- README

Documentation should never become outdated.

---

# Code Quality Rules

Never use any.

Strict TypeScript.

Prefer interfaces.

Small services.

Small repositories.

Pure business logic.

Centralized errors.

Centralized validation.

Centralized logging.

---

# Deliverables Per Milestone

For every milestone produce

1.

Summary

2.

Files modified

3.

Architecture impact

4.

Database impact

5.

API impact

6.

Security impact

7.

Migration required

8.

Tests added

9.

Manual testing instructions

10.

Potential risks

Do not continue to the next milestone until the current one is fully complete and verified.

---

# Definition of Done

The backend is considered production ready only when:

✓ Type-safe

✓ Fully modular

✓ Critical flows tested

✓ Tenant isolation verified

✓ Payment lifecycle idempotent

✓ Attendance race conditions eliminated

✓ OpenAPI published

✓ CI/CD enabled

✓ Migrations validated

✓ Uploads secured

✓ Monitoring configured

✓ Documentation updated

✓ Zero known critical security issues

The architecture must remain clean, modular, maintainable and easy to extend for future features without requiring major rewrites.