# Aura Apex - Implemented Customer Features List

This document lists all of the customer mobile application features that have been successfully verified, audited, and implemented:


---

## 1. Authentication & Security
- **Email/Password Signup**: Checks password strength with rules (min 8 chars, 1 uppercase, 1 digit, 1 special character).
- **Email/Password Sign-In**: Powered directly by Supabase Auth with secure auto-restoring JWT tokens.
- **Forgot Password**: Password reset recovery emails sent via Supabase.
- **Strict Role-Based Routing**: Restricts screen navigation context depending on whether the user is logged in as a `customer` or an `owner`.

---

## 2. Customer Dashboard & Quick Panels
- **Today's Check-in Status**: A dashboard banner showing whether the user has checked in today or if attendance is required.
- **Recent Notification Preview**: A preview card on the dashboard showing the latest announcement or update.
- **Gym Link Status**: Prompts user to select a gym from the public directory when `gym_id` is not yet set.
- **Pending/Request Tracking**: Gracefully checks for join approval status with the owner.

---

## 3. Membership & Plans
- **Directory Browsing**: Select a gym, browse details, and send join request tokens.
- **Active Plans Selection**: View gym-specific plans dynamically using target `?gymId=` queries.
- **Razorpay Checkout SDK Integration**: Open overlay options, securely verify signatures on backend nodes, and activate packages automatically.
- **Subscription History**: Lists active/past subscriptions and billing cycles.
- **Membership Cancellation**: Stop billing cycle access cleanly via dedicated action handlers.

---

## 4. Attendance & Logs
- **QR Check-in Scanner**: Check-in with daily rotational tokens.
- **Comprehensive History**: Scrollable timeline of check-ins.
- **Race Condition Prevention**: Database-level unique constraint blocks duplicate logs for the same member on any single day.

---

## 5. Daily Progress Logbook
- **Daily Calendar Dot-Matrix**: Flex calendar showing color check dots on logged days.
- ** Physiological Boundary Validation**: Restricts input fields to realistic values (weight 1-500kg, water max 20L, protein max 1kg).
- **Future Log Blocking**: Date selections strictly locked to past or current days.

---

## 6. Beginner's Resource Center & Gym Info
- **Beginner Guide Screen**: Explains platform usage and offers basic fitness/nutrition advice.
- **Gym Info Screen**: Displays the linked gym name, operating hours, weekly off days, and support phone/email.
