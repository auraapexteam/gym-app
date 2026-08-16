# Database Architecture & Data Layer

- **Purpose**: Explains PostgreSQL structure, Prisma ORM, migrations, RLS policies, indexing, and transactional rules.
- **Scope**: PostgreSQL schema, DB connection handling, indexing strategy, and repository queries.
- **Related Documents**: [Authentication & Tenant Isolation](./auth.md), [API Design](./api.md)
- **Last Updated**: 2026-07-13

---

# 89. Database Philosophy

Aura Apex uses PostgreSQL (Supabase) as the primary data store.

The database is responsible for:

- Data persistence
- Referential integrity
- ACID transactions
- Constraints
- Indexes

The database is **NOT** responsible for business logic.

Business rules belong in the Service Layer.

---

# 90. Why PostgreSQL?

Aura Apex manages highly relational data.

Examples

Customer

↓

Membership

↓

Payment

↓

Attendance

↓

Gym

↓

Owner

↓

Trainer

↓

Equipment

↓

Images

↓

Analytics

Relationships are first-class citizens.

PostgreSQL provides:

- ACID compliance
- Foreign Keys
- Transactions
- Indexes
- JSON support
- Excellent scalability
- Mature ecosystem

NoSQL is unnecessary for the current domain.

---

# 91. Multi-Tenant Database Design

Every business entity belongs to one tenant.

Example

```
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

Gallery

↓

Trainers
```

Every table must contain

```
gym_id
```

except

- profiles
- gyms
- audit_logs
- platform tables

Every repository query must automatically filter using gym_id.

Cross-tenant queries are prohibited.

---

# 92. Database Design Principles

Every table must have

```
id

created_at

updated_at
```

Soft-deletable tables additionally contain

```
deleted_at
```

Avoid unnecessary nullable columns.

Normalize until it becomes impractical.

Prefer explicit foreign keys.

Never duplicate data unless there is a measured performance benefit.

---

# 93. Primary Keys

Use UUIDs for all primary keys.

Example

```
id UUID PRIMARY KEY
```

Reasons

- Better security
- Easier synchronization
- Harder to enumerate
- Distributed-friendly

Never expose sequential IDs publicly.

---

# 94. Foreign Keys

Every relationship must be enforced.

Example

```
membership.plan_id

↓

plans.id
```

Database integrity is mandatory.

Never rely solely on application logic.

---

# 95. Naming Convention

Tables

snake_case

Columns

snake_case

Indexes

idx_table_column

Unique Constraints

uq_table_column

Foreign Keys

fk_child_parent

Example

```
idx_attendance_member

fk_members_gym

uq_profiles_email
```

Consistency improves maintainability.

---

# 96. Repository Pattern

Every table has exactly one repository.

Example

```
MemberRepository

PlanRepository

AttendanceRepository
```

Repositories expose methods, not SQL.

Good

```
findById()

findByGym()

findActivePlan()
```

Bad

```
query1()

query2()

execute()
```

Repositories describe intent.

---

# 97. Query Rules

Repositories should only execute queries.

Never:

Calculate revenue

Check permissions

Validate memberships

Generate QR

Those belong to services.

---

# 98. Transactions

Transactions are mandatory whenever one business action performs multiple writes.

Examples

Membership Purchase

```
Create Subscription

↓

Insert Payment

↓

Activate Membership

↓

Commit
```

If one step fails

Rollback everything.

Never leave partial state.

---

# 99. Read vs Write Operations

Separate reads from writes conceptually.

Reads

Search

Pagination

Analytics

History

Writes

Create

Update

Delete

Activate

Suspend

This separation improves clarity and future scalability.

---

# 100. Pagination

Every list endpoint must support pagination.

Required parameters

```
page

limit
```

Optional

```
sort

order

search
```

Never return entire tables.

Maximum page size should be enforced.

---

# 101. Filtering

Filtering should occur in repositories.

Examples

Status

Date Range

Gym

Trainer

Membership

Plan

Attendance

Filtering logic should be reusable.

---

# 102. Searching

Search should support

Partial matching

Case insensitive

Pagination

Future full-text search

Repositories own search implementations.

---

# 103. Soft Delete

Soft delete should be used for mutable business entities.

Examples

Members

Plans

Equipment

Trainers

Gallery Images

Soft delete adds

```
deleted_at
```

Deleted records remain recoverable.

---

# 104. Hard Delete

Hard delete only when legally or operationally required.

Examples

Temporary uploads

Cache tables

Test data

Payments and attendance records should never be hard deleted.

---

# 105. Audit Data

Financial and operational history should remain immutable.

Never edit

Payments

Attendance History

Audit Logs

Instead create correction records where necessary.

---

# 106. Index Strategy

Index every frequently queried column.

Examples

```
email

gym_id

plan_id

member_id

attendance_date

status

created_at
```

Composite indexes should be added for common query patterns.

Indexes should be reviewed periodically.

---

# 107. Constraints

Use database constraints aggressively.

Examples

UNIQUE

CHECK

FOREIGN KEY

NOT NULL

Application validation complements database constraints but never replaces them.

---

# 108. Migrations

All schema changes must be version controlled.

Never manually modify production databases.

Every schema change requires

Migration

Review

Testing

Rollback strategy

Database migrations are the only approved way to change schema.

---

# 109. Views

Use PostgreSQL Views for

Complex reporting

Analytics

Dashboard summaries

Do not use Views for core transactional operations.

---

# 110. Materialized Views (Future)

For expensive analytics

Monthly revenue

Attendance summaries

Retention

Leaderboards

Materialized Views may be introduced.

Refresh asynchronously.

Never refresh during API requests.

---

# 111. Data Integrity

Application validation

+

Database constraints

+

Transactions

=

Reliable data

Never depend on only one layer.

---

# 112. Repository Return Types

Repositories return domain models.

Controllers return DTOs.

Never expose raw database rows directly to API clients.

Transformation belongs inside services or dedicated mappers.

---

# 113. Bulk Operations

Bulk inserts and updates should be supported for

Customer imports

Equipment imports

Attendance imports

Bulk operations must remain transactional where possible.

---

# 114. Image Metadata

Images should never be stored inside PostgreSQL.

Only metadata.

Example

```
id

gym_id

bucket

path

mime_type

size

uploaded_by

created_at
```

Binary data remains in Supabase Storage.

---

# 115. Analytics Data

Analytics does not own data.

Analytics reads from

Attendance

Payments

Plans

Members

Reports

Future optimization may introduce precomputed aggregates.

---

# 116. Backup Strategy

Production databases require

Automated backups

Point-in-time recovery (if available)

Periodic restore testing

Backups are only useful if they can be restored.

---

# 117. Performance Guidelines

Avoid

SELECT *

Prefer explicit columns.

Avoid unnecessary joins.

Paginate large datasets.

Use indexes.

Profile slow queries.

Never optimize prematurely.

Measure first.

---

# 118. Future Scalability

The schema should support future additions without breaking existing tables.

Potential future modules

Branches

POS

Inventory

Workout Plans

Diet Plans

Coupons

Loyalty

Corporate Memberships

Referral System

Wearables

New modules should introduce new tables rather than modifying unrelated existing tables whenever practical.

---

# 119. Golden Rule

The database stores facts.

The Service Layer decides what those facts mean.

Never move business logic into SQL merely because it is possible.

Maintain a clear separation between persistence and business behavior.

# Part 6 — Feature Modules & Domain Architecture

---

# 185. Database Performance

Repositories should

- Select only required columns.
- Avoid SELECT *.
- Use indexes.
- Paginate large datasets.
- Avoid unnecessary joins.
- Batch queries where practical.

Every slow query should be investigated.

---

# 186. Pagination

Every collection endpoint must implement pagination.

Required

```
page

limit
```

Optional

```
sort

order

search

filters
```

Never return unlimited records.

Recommended maximum

100 records per request.

---

# 187. Sorting

Repositories should support sorting.

Examples

Newest

Oldest

Revenue

Attendance

Alphabetical

Sorting belongs inside repositories.

---

# 188. Searching

Searching should support

- Partial matches
- Case insensitive
- Pagination
- Indexed columns

Future

PostgreSQL Full Text Search.

---

# 10. Image Storage

Images are optional.

Supported image types

Gym

Trainer

Equipment

Profile

Images stored in object storage.

Database stores only metadata.

Images should support

Compression

Lazy loading

Caching

Future CDN support

---

# 11. Progress Logbook Tables

The Progress Logbook module uses four customer-owned tables to track daily fitness metrics.

All four tables follow the schema convention: `profile_id + log_date` as a `UNIQUE` composite constraint, enabling safe `UPSERT` (re-logging the same date overwrites the previous entry).

## progress_logs

Stores daily body weight for a customer.

```sql
id          UUID PRIMARY KEY
profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE
weight      NUMERIC(5,2) CHECK (weight > 0)
log_date    DATE NOT NULL
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
UNIQUE (profile_id, log_date)
```

## progress_images

Stores a pre-signed URL to the customer's daily progress photo in Supabase Storage.

```sql
id          UUID PRIMARY KEY
profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE
image_url   TEXT NOT NULL
log_date    DATE NOT NULL
created_at  TIMESTAMPTZ
UNIQUE (profile_id, log_date)
```

Note: binary data is in Supabase Storage; this table stores only the public URL.

## water_logs

Stores daily water intake in millilitres.

```sql
id          UUID PRIMARY KEY
profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE
amount_ml   INTEGER CHECK (amount_ml >= 0)
log_date    DATE NOT NULL
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
UNIQUE (profile_id, log_date)
```

## protein_logs

Stores daily protein intake in grams.

```sql
id          UUID PRIMARY KEY
profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE
amount_g    INTEGER CHECK (amount_g >= 0)
log_date    DATE NOT NULL
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
UNIQUE (profile_id, log_date)
```

## saved_gyms

Stores bookmarked/saved partner gyms for a customer profile.

```sql
id          UUID PRIMARY KEY
profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE
gym_id      UUID REFERENCES gyms(id) ON DELETE CASCADE
created_at  TIMESTAMPTZ
UNIQUE (profile_id, gym_id)
```

## workout_logs

Stores structured workout sessions and exercise breakdowns for a customer.

```sql
id               UUID PRIMARY KEY
profile_id       UUID REFERENCES profiles(id) ON DELETE CASCADE
workout_name     TEXT NOT NULL
category         TEXT NOT NULL
duration_min     INTEGER CHECK (duration_min > 0)
calories_burned  INTEGER DEFAULT 0 CHECK (calories_burned >= 0)
exercises_count  INTEGER DEFAULT 0 CHECK (exercises_count >= 0)
exercises        JSONB DEFAULT '[]'::jsonb
log_date         DATE NOT NULL
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
```

## RLS Policies

All tables have Row Level Security enabled.

- **Customers** can read and write only their own rows (`auth.uid() = profile_id`).
- **Gym owners/staff** can read logs of members who belong to their gym.
- **Super admins** can read all rows.

## Indexes

```
idx_progress_logs_profile    ON progress_logs(profile_id, log_date)
idx_progress_images_profile  ON progress_images(profile_id, log_date)
idx_water_logs_profile       ON water_logs(profile_id, log_date)
idx_protein_logs_profile     ON protein_logs(profile_id, log_date)
idx_saved_gyms_profile       ON saved_gyms(profile_id)
idx_saved_gyms_gym           ON saved_gyms(gym_id)
idx_workout_logs_profile     ON workout_logs(profile_id, log_date)
```

---