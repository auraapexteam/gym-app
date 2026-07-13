# Testing & Quality Assurance

- **Purpose**: Documents testing methodologies, unit/integration/E2E test layers, mock guidelines, and pipeline check rules.
- **Scope**: Unit tests, supertest API integration tests, and CI/CD verification checks.
- **Related Documents**: [Deployment & Infrastructure](./deployment.md), [Coding Standards](../standards/coding_standards.md)
- **Last Updated**: 2026-07-13

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