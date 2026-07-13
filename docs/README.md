# Aura Apex Engineering Handbook

- **Purpose**: Unified entry point and architecture guidance index for the Aura Apex platform.
- **Scope**: Entire codebase (Frontend, Backend, Database, Infrastructure).
- **Related Documents**: None
- **Last Updated**: 2026-07-13

---

> [!IMPORTANT]
> **MANDATORY RULES FOR ALL DEVELOPERS AND AI AGENTS:**
> 1. **Read this file first** before examining or editing any part of the codebase.
> 2. **Read the referenced documents in order** when onboarding or designing features.
> 3. **Never violate the architecture rules** defined in the [Architecture Constitution](standards/architecture_rules.md).
> 4. **If implementation conflicts with documentation, stop and ask** the team/owner instead of making assumptions.

## Handbook Directory

### 1. General & System Architecture
- [System Design Overview](architecture/system_design.md) - Product overview, user roles, core modules, and success criteria.
- [Backend Architecture](architecture/backend_architecture.md) - Goals, layered style, dependency rules, and modular philosophy.
- [Request Lifecycle](architecture/request_lifecycle.md) - Express request lifecycle, boot sequence, and middleware order.
- [Folder Structure](architecture/folder_structure.md) - Workspace monorepo and backend feature-first folder layouts.

### 2. Backend Deep Dives
- [Authentication & Tenant Isolation](backend/auth.md) - Supabase auth, JWT flow, roles (RBAC), and tenant isolation rules.
- [Database Architecture](backend/database.md) - PostgreSQL, Prisma ORM, migrations, RLS policies, indexing, and backup strategy.
- [API Design](backend/api.md) - Route, controller, service, repository patterns, validation pipelines, and versioning.
- [Security & Hardening](backend/security.md) - HTTPS, rate limiting, SQLi/XSS prevention, file upload rules, and audit logs.
- [Payments & Subscriptions](backend/payments.md) - Razorpay checkout, transaction status checking, and webhook validation.
- [QR Codes](backend/qr.md) - QR creation, rotation, and server-side validation.
- [Attendance Tracking](backend/attendance.md) - QR scan check-in validations, double check-in prevention, and daily limits.
- [Deployment & Infrastructure](backend/deployment.md) - Railway, GitHub Actions, env variables, rollbacks, and background jobs.
- [Testing & Quality Assurance](backend/testing.md) - Testing pyramid, unit, integration, and E2E validation.

### 3. Frontend Architecture
- [Frontend Architecture](frontend/frontend_architecture.md) - React Native CLI, React Vite Web, Zustand store, Metro packager setup, and Windows-specific fixes.

### 4. Standards & Decisions
- [Coding Standards](standards/coding_standards.md) - TypeScript conventions, naming rules, barrel exports, DTO patterns, and code reviews.
- [Architecture Rules (Constitution)](standards/architecture_rules.md) - Core architectural rules, success metrics, and the Aura Apex Engineering Oath.
- [Architecture Decision Records (ADR)](decisions/README.md) - Guide to documenting architectural decisions and templates.

---

## Onboarding Guide
If you are new to the codebase, we recommend reading the files in this sequence:
1. `docs/README.md` (This file)
2. [docs/architecture/system_design.md](architecture/system_design.md)
3. [docs/architecture/folder_structure.md](architecture/folder_structure.md)
4. [docs/standards/architecture_rules.md](standards/architecture_rules.md)
5. [docs/standards/coding_standards.md](standards/coding_standards.md)
6. Feature specific guides in the `backend/` and `frontend/` folders.
