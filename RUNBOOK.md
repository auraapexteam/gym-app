# Aura Apex — Operations Runbook

> Last updated: 2026-07-15 | Backend version: 1.0.0

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Deployment](#2-deployment)
3. [Environment Variables](#3-environment-variables)
4. [Health Checks](#4-health-checks)
5. [Logs](#5-logs)
6. [Incident Response](#6-incident-response)
7. [Backup & Restore](#7-backup--restore)
8. [Rollback](#8-rollback)
9. [Common Issues](#9-common-issues)

---

## 1. Architecture Overview

```
Frontend (Vercel)          Backend (Render)          Database (Supabase)
https://gym-app-flax-mu   https://gym-app-xtru       PostgreSQL + Storage
.vercel.app               .onrender.com              jodthhltepjoepeaoano
                                    ↕                       .supabase.co
                               Razorpay (payments)
```

- **Runtime**: Node.js 20, Express, TypeScript
- **Auth**: Supabase Auth (JWT) — tokens are validated server-side on every request
- **Storage**: Supabase Storage (`gym-media` bucket) — images never flow through Express
- **Payments**: Razorpay (test mode keys currently)

---

## 2. Deployment

### Render (Backend)

Render auto-deploys on every push to `main`.

**Build Command** (Render → Settings → Build Command):
```
npm install && npm run build
```

**Start Command**:
```
npm start
```

**Node Version**: Set `NODE_VERSION=20` in Render environment variables.

### Manual Deploy

```bash
git push origin main
```

Render picks up the push and runs the build/start pipeline automatically.

To force a re-deploy without a code change:
1. Render dashboard → your service → **Manual Deploy** → **Deploy latest commit**

### Vercel (Frontend)

Auto-deploys on push to `main`. No manual steps needed.

---

## 3. Environment Variables

All variables are validated on startup — the server **refuses to boot** if any required variable is missing.

### Required

| Variable | Where to get it |
|----------|----------------|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Webhooks → your webhook → secret |

### Recommended for Production

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://gym-app-flax-mu.vercel.app
LOG_LEVEL=info
```

> [!CAUTION]
> Never commit `.env` to version control. `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — if leaked, rotate it immediately in Supabase → Project Settings → API.

---

## 4. Health Checks

Three endpoints — no auth required:

| Endpoint | Purpose | Expected response |
|----------|---------|-------------------|
| `GET /health` | Full health check — DB connectivity | `200 { status: "ok", db: "ok" }` |
| `GET /ready` | Readiness — is the server ready to receive traffic? | `200` |
| `GET /live` | Liveness — is the process alive? | `200` |

Render uses `/health` for its health check probe (configure in Render → Settings → Health Check Path: `/health`).

**Test manually**:
```bash
curl https://gym-app-xtru.onrender.com/health
```

---

## 5. Logs

Logs are structured JSON in production (Pino). View them in:
- **Render**: Dashboard → your service → **Logs** tab
- **Local**: `npm run dev` (pino-pretty — colorized, human-readable)

### Key log events

| Event | Level | Meaning |
|-------|-------|---------|
| `server_started` | info | Server booted successfully |
| `Auth token verification failed` | warn | Invalid/expired JWT presented |
| `Profile database lookup failed` | error | DB error during auth |
| `Unhandled error` | error | Unexpected exception — needs investigation |
| `Shutting down gracefully` | info | SIGTERM received — Render is restarting |

### Sensitive fields are always redacted:
`authorization`, `password`, `token`, `accessToken`, `refreshToken`, `secret`, `razorpay_signature` — these appear as `[REDACTED]` in all log output.

---

## 6. Incident Response

### Server not responding

1. Check Render → your service → **Logs** for crash output
2. Check `GET /health` — if it returns non-200, DB may be down
3. Check Supabase status: https://status.supabase.com
4. If logs show `process.exit(1)` → uncaught exception — check the error detail in logs
5. Trigger a manual redeploy on Render if needed

### Authentication failures spike

1. Check logs for `Auth token verification failed` — could be a client bug or attack
2. `authRateLimiter` allows 10 requests/minute/IP — if a single IP is spamming, Render's DDoS protection should block it
3. No action needed unless the spike is from legitimate users (then check Supabase Auth status)

### Payment webhook not processing

1. Check Render logs for `Webhook event missing id` or `Signature verification failed`
2. Verify `RAZORPAY_WEBHOOK_SECRET` in Render env matches the secret in Razorpay Dashboard
3. Check `payment_events` table in Supabase for events with `status = 'failed'`
4. Razorpay retries webhooks for 24h — fixing the secret and redeploying is enough

### Database errors

1. Check Supabase → Database → Logs for slow queries or errors
2. Check connection pool — Supabase free tier has a connection limit
3. If urgent, restart the Render service (new connections are re-established on boot)

---

## 7. Backup & Restore

### Automated Backups

Supabase automatically backs up the database daily on all plans. Access via:
**Supabase Dashboard → Database → Backups**

Point-in-time recovery (PITR) is available on Pro plan.

### Manual Export

```bash
# Export full schema + data
pg_dump "postgresql://postgres:[PASSWORD]@db.jodthhltepjoepeaoano.supabase.co:5432/postgres" \
  --no-owner --no-acl -F c -f backup_$(date +%Y%m%d).dump
```

Get the DB password from: Supabase → Project Settings → Database → Connection string.

### Restore from Dump

```bash
pg_restore --clean --no-owner --no-acl \
  -d "postgresql://postgres:[PASSWORD]@db.jodthhltepjoepeaoano.supabase.co:5432/postgres" \
  backup_20260715.dump
```

> [!CAUTION]
> `--clean` drops existing tables before restoring. Only run this on a known-good backup. Coordinate with all stakeholders before restoring production.

### Schema Migration

After any schema change, run `schema.sql` against the database:

**Via Supabase Dashboard**: SQL Editor → paste `schema.sql` content → Run

**Via CLI**:
```bash
psql "postgresql://postgres:[PASSWORD]@db.jodthhltepjoepeaoano.supabase.co:5432/postgres" \
  -f schema.sql
```

---

## 8. Rollback

### Code Rollback

If a bad deploy goes out:

1. **Option A — Revert commit**:
```bash
git revert HEAD
git push origin main
```
Render will auto-deploy the revert.

2. **Option B — Render rollback**:
Render Dashboard → Deploys → find last good deploy → **Rollback to this deploy**

### Database Rollback

If a migration caused data issues:
1. Restore from Supabase daily backup (see section 7)
2. Or write a corrective SQL migration and run it

---

## 9. Common Issues

### Server fails to start — "Invalid environment configuration"

**Cause**: A required env variable is missing or malformed.  
**Fix**: Check Render → Environment — ensure all required variables from section 3 are set. Redeploy.

### `SUPABASE_ANON_KEY` error on startup

**Cause**: `SUPABASE_ANON_KEY` was made required in M7. Previously optional.  
**Fix**: Add it to Render environment variables (get it from Supabase → API → anon public key).

### "JWT expired" errors from users

**Cause**: Supabase access tokens expire after 1 hour. The client must refresh using the refresh token.  
**Fix**: Frontend should call `supabase.auth.refreshSession()` before expiry. No backend change needed.

### Payments working in test, failing in production

**Cause**: Razorpay test keys vs live keys.  
**Fix**: Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render to live keys. Update `RAZORPAY_WEBHOOK_SECRET` to match the live webhook.

### High memory usage on Render free tier

**Cause**: Render free tier has 512MB RAM. pino-pretty logging uses extra memory.  
**Fix**: Ensure `NODE_ENV=production` is set — this disables pino-pretty and uses raw JSON logging, which is significantly lighter.
