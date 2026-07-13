# Attendance Tracking

- **Purpose**: Documents gym check-in validations, double scan prevention logic, daily check-in limits, and backend verification flows.
- **Scope**: Attendance routes, middleware check-in processing, and database log storage.
- **Related Documents**: [QR Code Engine](./qr.md), [System Design Overview](../architecture/system_design.md)
- **Last Updated**: 2026-07-13

---

# 55. QR Attendance Flow

Attendance should always be verified on the server.

```
Customer

↓

Scan QR

↓

Backend

↓

Validate Gym

↓

Validate Membership

↓

Validate Duplicate Check-in

↓

Record Attendance

↓

Return Success
```

Attendance is never marked locally.

---

# 128. Attendance Module

Purpose

Attendance tracking.

Responsibilities

QR Check-in

Attendance History

Duplicate Prevention

Statistics

Dependencies

Gym

Members

Subscriptions

Attendance must always validate

Active Membership

Gym Ownership

QR Validity

before recording attendance.

---

# 171. Attendance Security

Attendance always validates

Membership

Gym

QR

Duplicate Check

Date

Time

Attendance cannot be created directly from the database.

Always through service layer.

---

# 9. QR Attendance Flow

Owner

↓

Generate QR

↓

Print QR

↓

Stick inside gym

↓

Customer opens mobile app

↓

Scans QR

↓

Backend validates

↓

Attendance stored

↓

Analytics updated

Important rules

QR codes are revocable.

Owners may generate new QR codes at any time.

Old QR codes immediately become invalid.

Attendance is always validated server-side.

Client-side attendance is never trusted.

---