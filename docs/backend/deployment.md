# Deployment & Infrastructure

- **Purpose**: Explains deployment setup on Railway, GitHub Actions CI/CD workflows, environment parameters, background jobs, and system monitoring.
- **Scope**: Infrastructure hosting config, deployment scripts, monitoring pipelines, and backups.
- **Related Documents**: [Database Architecture](./database.md), [Testing & QA](./testing.md)
- **Last Updated**: 2026-07-13

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