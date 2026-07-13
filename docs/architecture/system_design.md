# System Design Overview

- **Purpose**: Provides a high-level overview of the Aura Apex SaaS gym platform design, applications, and roles.
- **Scope**: Entire platform architecture and product scope.
- **Related Documents**: [Architecture Rules](../standards/architecture_rules.md), [Folder Structure](./folder_structure.md)
- **Last Updated**: 2026-07-13

---

# 1. Vision

Aura Apex is a modern multi-tenant SaaS Gym Management Platform designed to help gyms manage their complete business digitally.

The platform enables gym owners to manage members, subscriptions, attendance, trainers, equipment, revenue and analytics while providing members with a seamless mobile experience.

The system is designed from day one to support thousands of gyms without architectural changes.

Core principles:

• Modular
• Scalable
• Maintainable
• Secure
• Multi-tenant
• API-first
• Mobile-first
• Future-proof

The architecture must support adding completely new modules without modifying existing ones.

---

# 2. Product Overview

Aura Apex consists of three applications sharing one backend.

──────────────────────────────────────────────

Customer Mobile App

↓

React Native CLI

↓

Express API

↓

Supabase

──────────────────────────────────────────────

Owner Dashboard

↓

React Web

↓

Express API

↓

Supabase

──────────────────────────────────────────────

Super Admin Portal

↓

React Web

↓

Express API

↓

Supabase

──────────────────────────────────────────────

Everything shares:

• Authentication
• Database
• Storage
• API
• Business Logic

---

# 3. Platform Type

Aura Apex is a Multi-Tenant SaaS.

One platform serves many independent gyms.

Each gym behaves as an isolated tenant.

Example

Aura Apex

├── Gym A

├── Gym B

├── Gym C

├── Gym D

└── Gym N

Every gym has completely isolated

• Members

• Payments

• QR Codes

• Trainers

• Equipment

• Images

• Analytics

• Plans

No tenant can ever access another tenant's data.

---

# 4. Applications

## Customer Mobile App

Platform

React Native CLI

Target users

Gym Members

Purpose

Allow customers to manage their membership digitally.

Features

• Authentication

• View membership

• View current plan

• Renew membership

• QR Attendance

• Attendance history

• Browse gym images

• Gym timings

• Off days

• Notifications

• Profile

---

## Owner Dashboard

Platform

React Web

Target users

Gym Owners

Purpose

Complete business management.

Features

Dashboard

Members

Attendance

QR Management

Plans

Revenue

Analytics

Equipment

Trainers

Gym Gallery

Settings

Staff Management

---

## Super Admin Portal

Platform

React Web

Target users

Aura Apex Team

Purpose

Platform administration.

Features

Gym onboarding

Approve owners

Suspend gyms

Manage subscriptions

Platform analytics

Support

Manage plans

View logs

System configuration

---

# 5. User Roles

## Customer

Uses mobile app.

Can

• Buy plans

• View plans

• View membership

• Scan QR

• View attendance

• View gym information

---

## Owner

Owns a gym.

Can

• Manage members

• Manage trainers

• Manage equipment

• Create plans

• Generate QR codes

• Upload gym images

• View analytics

• Configure timings

• Configure holidays

---

## Staff

Works at reception.

Permissions controlled by owner.

Typical permissions

• Add members

• Check attendance

• View members

Cannot access revenue unless permitted.

---

## Trainer

Limited dashboard.

Can

• View assigned members

• View schedules

• View attendance

• Update trainer profile

---

## Super Admin

Controls entire SaaS platform.

Can

• Create gyms

• Approve owners

• Suspend gyms

• Delete gyms

• View platform metrics

• Manage subscriptions

• Manage platform settings

---

# 6. Core Modules

Every feature belongs to exactly one module.

Modules

Authentication

Tenant Management

Gym Management

Members

Plans

Subscriptions

Payments

Attendance

QR Management

Trainers

Equipment

Gallery

Analytics

Notifications

Reports

Settings

Admin

No business logic may exist outside its owning module.

---

# 7. Multi-Tenant Design

Each record belongs to exactly one tenant.

Example

Gym

↓

Members

↓

Attendance

↓

Payments

↓

Plans

↓

Equipment

↓

Analytics

↓

Images

Every database table must contain Tenant ID.

All backend queries must automatically filter by Tenant ID.

Cross-tenant access is forbidden.

---

# 8. Functional Modules

## Authentication

Handles

Login

Registration

Password reset

JWT

Roles

Permissions

---

## Membership Module

Handles

Members

Plans

Renewals

Expiry

History

---

## Attendance Module

Handles

QR Attendance

Attendance history

Validation

Duplicate prevention

Statistics

---

## QR Module

Handles

QR creation

QR rotation

QR revocation

QR validation

Multiple QR support

---

## Trainer Module

Handles

Trainer profiles

Specialization

Schedules

Images

Availability

---

## Equipment Module

Handles

Equipment inventory

Maintenance

Condition

Categories

Images

Service schedule

---

## Gallery Module

Handles

Gym images

Upload

Delete

Display

Compression

Optimization

---

## Revenue Module

Handles

Payments

Revenue

Refunds

Reports

Subscriptions

---

## Analytics Module

Consumes data from

Payments

Attendance

Plans

Members

Equipment

Produces

Dashboard

Charts

Growth metrics

Retention

Revenue insights

Attendance insights

---

# 11. Analytics Philosophy

Analytics never owns data.

Analytics reads data from

Attendance

Payments

Plans

Equipment

Members

Analytics produces

Revenue trends

Attendance trends

Member growth

Retention

Peak hours

Equipment health

Trainer performance

No analytics data should become the source of truth.

---

# 14. Technology Stack

Customer

React Native CLI

TypeScript

React Navigation

TanStack Query

React Hook Form

Zod

Axios

MMKV

---------------------------------

Owner Dashboard

React

Vite

TypeScript

React Router

TanStack Query

TailwindCSS

Shadcn

---------------------------------

Super Admin

React

Vite

TypeScript

---------------------------------

Backend

Express

Node.js

TypeScript

Prisma ORM

JWT

Razorpay

---------------------------------

Database

Supabase PostgreSQL

---------------------------------

Storage

Supabase Storage

---------------------------------

Deployment

Railway

GitHub Actions

Cloudflare

---

# 15. Future Expansion

Architecture must support future modules without redesign.

Possible additions

Multiple branches

Multiple owners

POS

Nutrition shop

Workout plans

Diet plans

Trainer booking

Online coaching

Video classes

Corporate memberships

Coupons

Referral system

Loyalty points

AI analytics

Wearable integration

WhatsApp integration

Email automation

Mobile push campaigns

Franchise management

---

# 16. Non Functional Requirements

Performance

API response under 300ms (excluding uploads).

Availability

99.9% uptime target.

Scalability

Horizontal scaling supported.

Reliability

Graceful failure.

Security

OWASP best practices.

Maintainability

Independent modules.

Observability

Centralized logging.

Monitoring

Health checks.

Backups

Automated daily backups.

Disaster Recovery

Recovery plan documented.

---

# 19. Success Criteria

Aura Apex is considered architecturally successful when

• New modules can be added without rewriting existing modules.

• Every gym remains fully isolated.

• Mobile and Web consume the same APIs.

• Business logic exists only inside backend services.

• UI remains independent of backend implementation.

• APIs remain backward compatible.

• The system can scale from one gym to thousands with minimal infrastructure changes.

• Every component follows a modular, maintainable, production-grade architecture suitable for long-term SaaS growth.

# 123. Gym Module

Purpose

Represents a Gym (Tenant).

Responsibilities

Gym Profile

Timings

Weekly Off Days

Contact Information

Gallery

Settings

QR Configuration

Owner Assignment

Dependencies

Authentication

Storage

Notifications

Gym owns

Everything belonging to one tenant.

---

# 124. Member Module

Purpose

Manage gym customers.

Responsibilities

Create Member

Update Profile

Membership Status

Attendance History

Plan History

Profile

Dependencies

Gym

Plans

Attendance

Payments

Notifications

Member module does NOT process payments.

---

# 125. Plan Module

Purpose

Manage membership plans.

Responsibilities

Create Plan

Update Plan

Activate

Deactivate

Pricing

Duration

Visibility

Dependencies

Gym

Plans never activate memberships directly.

---

# 126. Subscription Module

Purpose

Manage active memberships.

Responsibilities

Purchase

Renewal

Expiry

Auto Renew

Cancellation

Status

Dependencies

Plans

Payments

Notifications

Attendance

Subscription owns membership lifecycle.

---

# 130. Trainer Module

Purpose

Manage trainers.

Responsibilities

Trainer Profile

Images

Specialization

Status

Availability

Assignments (future)

Dependencies

Gym

Gallery

Trainer module never owns customers.

---

# 131. Equipment Module

Purpose

Manage gym equipment.

Responsibilities

Equipment

Category

Status

Maintenance

Images

Purchase Details

Dependencies

Gym

Gallery

Future

Maintenance reminders.

---

# 132. Gallery Module

Purpose

Manage images.

Responsibilities

Upload

Delete

Compression

Optimization

Metadata

Dependencies

Supabase Storage

Gallery never knows

Gym

Trainer

Equipment

It only manages images.

Business modules decide how images are used.

---

# 133. Analytics Module

Purpose

Business intelligence.

Consumes

Attendance

Payments

Subscriptions

Plans

Members

Equipment

Produces

Charts

KPIs

Revenue

Growth

Retention

Analytics never modifies business data.

Read-only module.

---

# 134. Notification Module

Purpose

Deliver notifications.

Channels

Push

Email (future)

SMS (future)

WhatsApp (future)

Notifications should be event-driven.

Never tightly coupled.

---

# 135. Admin Module

Purpose

Platform administration.

Responsibilities

Owner Onboarding

Gym Approval

Gym Suspension

Platform Analytics

Platform Settings

Subscription Monitoring

Support

Admin module bypasses tenant isolation.

---