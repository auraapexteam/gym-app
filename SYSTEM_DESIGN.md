# System Design Document
# Subscription Management Practice Project

> **Purpose:** Build a production-style subscription management application to learn React Native CLI, Express.js, Supabase, PostgreSQL, Authentication, Razorpay Subscription APIs, Webhooks, and secure backend architecture.

---

# Tech Stack

## Frontend

- React Native CLI
- TypeScript
- React Navigation
- Zustand (State Management)
- Axios
- React Native Razorpay SDK

---

## Backend

- Express.js
- TypeScript
- Supabase JS SDK
- Razorpay SDK
- JWT Verification Middleware
- Express Router Architecture

---

## Database

- Supabase PostgreSQL

---

## Authentication

- Supabase Auth (Email + Password)

Backend must verify Supabase JWT for every protected route.

Never create a custom authentication system.

---

# High Level Architecture

```text
                React Native CLI
                       │
             Supabase Auth Login
                       │
                JWT Access Token
                       │
                Authorization Header
                       │
                       ▼
                 Express Backend
                       │
            Verify Supabase JWT
                       │
         ┌─────────────┴─────────────┐
         │                           │
     Razorpay API              Supabase DB
         │                           │
         └─────────────┬─────────────┘
                       │
                Razorpay Webhooks
                       │
               Update Subscription
```

---

# Core Features

## Authentication

- Email Signup
- Email Login
- Logout
- Session Persistence
- Protected Routes

Use Supabase Auth only.

---

## Plans

Display available subscription plans.

Each plan contains:

- Name
- Description
- Price
- Billing Interval

---

## Subscription

User should be able to:

- View Plans
- Subscribe
- Complete Razorpay Checkout
- View Subscription Status
- View Next Billing Date

---

## Payments

Track every payment.

Store:

- Amount
- Status
- Razorpay Payment ID
- Paid Date

---

# Database Schema

## plans

```
id (UUID)

name

description

price

billing_interval

created_at

updated_at
```

---

## subscriptions

```
id (UUID)

user_id

plan_id

razorpay_subscription_id

status

current_period_start

current_period_end

created_at

updated_at
```

---

## payments

```
id (UUID)

subscription_id

amount

currency

status

razorpay_payment_id

paid_at

created_at
```

---

# Relationships

```
User
 │
 └── Subscription
        │
        ├── Plan
        │
        └── Payments
```

---

# Security

## Authentication

Every protected API must verify:

```
Authorization:
Bearer <Supabase JWT>
```

---

## Webhooks

Every webhook must verify Razorpay signature.

Never trust incoming webhook payload directly.

---

## Row Level Security

Enable RLS.

Policies:

- User can only access their own subscriptions.
- User can only access their own payments.
- Public read access only for Plans.

---

# Backend Folder Structure

```
src/

config/

controllers/

middlewares/

routes/

services/

utils/

types/

app.ts

server.ts
```

---

# API Endpoints

## Authentication

Handled completely by Supabase Auth.

Backend only verifies JWT.

---

## Plans

```
GET /plans
```

Returns available subscription plans.

---

## Subscription

### Create Subscription

```
POST /subscriptions
```

Creates:

- Razorpay Subscription
- Subscription row in DB

Returns Razorpay Subscription ID.

---

### Get Current Subscription

```
GET /subscriptions/me
```

Returns

- Status
- Current Plan
- Current Billing Cycle
- Next Billing Date

---

# Webhooks

```
POST /webhooks/razorpay
```

Handle:

- subscription.charged
- subscription.cancelled
- payment.failed

Update database accordingly.

Webhook is the source of truth.

Frontend payment success must never directly activate subscription.

---

# Services

## Razorpay Service

Responsible for

- Creating subscriptions
- Fetching subscriptions
- Verifying signatures

---

## Subscription Service

Responsible for

- Creating DB records
- Updating subscription status
- Updating billing cycle
- Recording payments

---

# Middleware

## Auth Middleware

Responsibilities

- Read Authorization Header
- Verify Supabase JWT
- Attach User to Request

---

# Frontend Screens

```
Splash

↓

Login

↓

Signup

↓

Home

↓

Plans

↓

Checkout

↓

Subscription Status

↓

Profile
```

---

# Frontend Architecture

```
src/

api/

components/

navigation/

screens/

hooks/

store/

types/

utils/
```

---

# State Management

Use Zustand.

Maintain:

```
User

Access Token

Subscription

Loading States
```

---

# Environment Variables

Frontend

```
SUPABASE_URL

SUPABASE_ANON_KEY

API_BASE_URL

RAZORPAY_KEY_ID
```

Backend

```
PORT

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

SUPABASE_JWT_SECRET

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET

RAZORPAY_WEBHOOK_SECRET
```

---

# Subscription Flow

```
User Login

↓

View Plans

↓

Choose Plan

↓

Frontend

↓

POST /subscriptions

↓

Backend

↓

Create Razorpay Subscription

↓

Save DB Record

↓

Return Subscription ID

↓

React Native Razorpay Checkout

↓

Payment Success

↓

Razorpay

↓

Webhook

↓

Backend Updates DB

↓

Subscription Active
```

---

# Payment Flow

```
Payment

↓

Razorpay

↓

Webhook

↓

Verify Signature

↓

Update Subscription

↓

Create Payment Record

↓

Return 200
```

---

# Error Handling

Backend must have centralized error handling.

Return consistent API responses.

Example

```
{
    success: false,
    message: "Subscription creation failed"
}
```

---

# Logging

Log:

- Incoming webhook events
- Failed webhook verification
- Payment failures
- Subscription creation failures

No sensitive credentials should ever be logged.

---

# Deployment

Backend

- Railway

Frontend

- Android APK

Database

- Supabase

---

# Development Order

## Phase 1

- Setup Supabase
- Configure Auth
- Create Tables
- Configure RLS

---

## Phase 2

- Express Project Setup
- Authentication Middleware
- Razorpay Configuration
- Subscription APIs

---

## Phase 3

- Webhook Handling
- Signature Verification
- Payment Flow
- Database Updates

Test webhook flow thoroughly using Razorpay Test Mode + ngrok before building frontend.

---

## Phase 4

React Native

- Authentication
- Plan Listing
- Checkout
- Subscription Status

---

## Phase 5

Deploy Backend

Reconnect Webhook

Retest Complete Flow

---

# Coding Guidelines

- TypeScript Strict Mode
- Layered Architecture
- Controllers should remain thin
- Business logic belongs in Services
- No SQL in Controllers
- Reusable utility functions
- Strong typing throughout
- Async/Await only
- Proper error handling
- Environment variables for all secrets
- Follow production-grade folder structure

---

# Out of Scope

Do NOT implement:

- Redis
- Queues
- Cron Jobs
- Microservices
- Admin Panel
- Multi-tenancy
- Social Login
- Analytics
- Push Notifications
- Docker
- CI/CD

Keep the project focused on learning authentication, subscription management, payment processing, secure backend design, and production-ready architecture.

---

# Primary Goal

The objective is **learning production-grade architecture**, not feature completeness.

Focus on:

- Clean architecture
- Maintainable code
- Secure authentication
- Proper webhook handling
- Database design
- API design
- Best practices
- Scalability-ready folder structure

Avoid shortcuts that compromise code quality.