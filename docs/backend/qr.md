# QR Code Engine

- **Purpose**: Details QR code creation, automatic rotation cycles, revocation logic, and encryption protection details.
- **Scope**: QR code module routes, service, and validation logic.
- **Related Documents**: [Attendance Tracking](./attendance.md), [Security & Hardening](./security.md)
- **Last Updated**: 2026-07-13

---

# 129. QR Module

Purpose

Manage Gym QR Codes.

Responsibilities

Generate QR

Revoke QR

Replace QR

QR Metadata

QR Status

Dependencies

Gym

Attendance

Important

QR never records attendance.

Attendance module owns attendance.

QR module only owns QR lifecycle.

---