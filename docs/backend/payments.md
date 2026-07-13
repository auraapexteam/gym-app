# Payments & Subscriptions

- **Purpose**: Documents the Razorpay integration flow, webhook signature validation, checkout synchronization, and payment audit tracking.
- **Scope**: Payments service, subscription status checking, webhook controller routes.
- **Related Documents**: [Backend Architecture](../architecture/backend_architecture.md), [Security & Hardening](./security.md)
- **Last Updated**: 2026-07-13

---

# 54. Razorpay Flow

Payment flow.

```
Client

↓

Backend

↓

Create Razorpay Order

↓

Client Checkout

↓

Payment Success

↓

Webhook

↓

Verify Signature

↓

Update Database

↓

Notify User
```

The webhook is the source of truth.

Never trust payment success returned directly from the client.

---

# 127. Payment Module

Purpose

Financial transactions.

Responsibilities

Create Razorpay Orders

Verify Webhooks

Store Payments

Refund

Invoices (future)

Revenue

Dependencies

Razorpay

Subscriptions

Audit Logs

Payment module is the financial source of truth.

---

# 160. Razorpay Webhook Security

Every webhook must verify

Signature

Timestamp (if supported)

Secret

Never trust client payment success.

Only webhook confirmation updates financial records.

---

# 170. Payment Security

Payments are immutable.

Never edit payment records.

Corrections require

Refund

Adjustment

New Transaction

---