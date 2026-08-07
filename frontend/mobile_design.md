# AURA APEX — Customer Mobile App System Design & Specifications

> **Target Platform:** Mobile Client (iOS & Android)  
> **Target Audience:** Gym Customers / Members  
> **Repository Location:** `frontend/` (React Native 0.86 + TypeScript)  
> **Backend Integration:** REST API v1 (`/api/v1/...`) + Supabase Auth  
> **Live Web Application:** [https://gym-app-pw9a.vercel.app/](https://gym-app-pw9a.vercel.app/)

---

## 1. Executive Summary & Purpose

The **AURA APEX Customer Mobile App** serves as the personal fitness companion and access pass for gym members. While Gym Owners, Staff, and Platform Super Admins operate their management workflows on the Web Application, members use this React Native application to:
1. Browse public gym directories and submit join requests.
2. View gym-specific membership plans and purchase packages online via **Razorpay**.
3. Track active membership validity with remaining days counters and visual progress bars.
4. Access their **Digital QR Check-in Pass** or scan the reception QR code for daily attendance.
5. Record daily fitness metrics (weight, water, protein, steps) on an interactive dot-matrix calendar logbook.
6. Access beginner fitness guides, operating hours, and gym announcements.

---

## 2. Technology Stack & Native Dependencies

| Component Layer | Technology / Library | Purpose & Scope |
| :--- | :--- | :--- |
| **Framework** | React Native `0.86.0` (React 19) | Cross-platform native mobile application engine |
| **Language** | TypeScript `^5.8.3` | Type-safe models, props, and API response contracts |
| **Navigation** | `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` | Native stack and bottom tab bar navigation |
| **State Management** | Zustand `^5.0.14` | Global state management (`useAuthStore`, `useGymStore`) |
| **Storage & Persistence** | `@react-native-async-storage/async-storage` | Secure JWT session token and user preference persistence |
| **Camera & Hardware** | `react-native-camera-kit` | Native camera QR code scanner for reception desk check-ins |
| **Payment Gateway** | `react-native-razorpay` | Native SDK overlay for Razorpay package checkouts |
| **Styling & UI** | `react-native-reanimated`, `lucide-react-native`, `react-native-svg` | Dark-themed micro-animations, vector icons, and dynamic progress bars |
| **HTTP Network Client** | Axios `^1.18.1` | REST API requests with request/response interceptors for Bearer auth tokens |

---

## 3. Architecture & User Onboarding Lifecycle

```
 +-----------------------------------------------------------------------------------+
 |                             CUSTOMER MOBILE LIFECYCLE                              |
 +-----------------------------------------------------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        |  1. Registration / Authentication   |
                        |   - Email/Password + Strong Rules   |
                        |   - Session restored via AsyncStorage|
                        +-------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        |    2. Gym Selection & Join Request  |
                        |   - Browse Directory & Details      |
                        |   - Send Join Request (PENDING)     |
                        +-------------------------------------+
                                           |
                                           v  (Owner Approves)
                        +-------------------------------------+
                        |  3. Member Linked (Status: INACTIVE)|
                        |   - Prompted to select a plan       |
                        +-------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        |   4. Plan Purchase via Razorpay     |
                        |   - Native Razorpay SDK Overlay     |
                        |   - Backend Signature Verification  |
                        +-------------------------------------+
                                           |
                                           v  (Payment Verified)
                        +-------------------------------------+
                        |  5. Active Membership & Pass Unlocked|
                        |   - Status promotes to ACTIVE       |
                        |   - Validity Bar (e.g. 30 Days Left)|
                        |   - Digital QR Check-in Pass active |
                        +-------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        |     6. Daily Check-ins & Logbook    |
                        |   - Scan Reception QR / Display QR  |
                        |   - Log Weight, Water, Protein      |
                        +-------------------------------------+
```

---

## 4. Mobile Screen Specifications & Feature Modules

### **Module 1: Authentication & Security (`LoginScreen`, `SignupScreen`, `ForgotPassword`)**
- **Strong Password Rules**: Enforces minimum 8 characters, at least 1 uppercase letter (`A-Z`), 1 digit (`0-9`), and 1 special symbol (`!@#$%...`).
- **Real-Time Requirement Checklist**: Displays interactive visual indicators (checkmarks/crosses) as the user types.
- **Error Feedback**: Parses structured backend errors (`details`) and highlights specific input fields.
- **Session Restoration**: Restores JWT token from `AsyncStorage` on app launch.

### **Module 2: Customer Home Dashboard (`HomeScreen`)**
- **Gym Link Status Banner**: Prompts user when `NO GYM LINKED`, shows `PENDING APPROVAL` while awaiting owner review, or displays `ACTIVE MEMBER` when linked.
- **Today's Check-in Card**: Shows real-time status (*Checked In Today* vs *Not Checked In Yet*).
- **Active Plan Validity Progress Bar**: Renders remaining days counter (e.g., **30 Days Remaining**), expiration date, and visual gradient progress bar.
- **Quick Action Bar**: Shortcuts for QR Check-in Scanner, Daily Logbook, and Gym Support.

### **Module 3: Gym Directory & Join Requests (`GymInfoScreen`)**
- **Public Directory Browsing**: Filter gyms by location, view photos, operating hours, weekly off days, and contact phone/email.
- **Join Application Submission**: Submits join request token to gym owner for approval.
- **Directory Card Filtering**: Automatically hides directory cards once a customer join application is pending or approved.

### **Module 4: Membership Package Purchase & Payments (`PlansScreen`, `SubscriptionHistoryScreen`)**
- **Dynamic Package Browsing**: Fetches membership packages offered by the linked gym (`GET /api/v1/plans?gymId={id}`).
- **Razorpay Checkout SDK**: Triggers native Razorpay SDK overlay with `order_id`, `amount`, `currency`, and `key`.
- **Backend Verification**: Sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `POST /api/v1/payments/verify`.
- **Automatic Status Promotion**: Successful verification promotes member status to `active` and unlocks digital check-in passes.
- **Active Package Badge**: Active plans display a neon `ACTIVE PLAN` badge, remaining days button, and renew date.

### **Module 5: Digital QR Pass & Reception Camera Scanner (`QRCheckInScreen`, `AttendanceHistoryScreen`)**
- **Digital Member Pass**: Displays personal rotational check-in QR code on mobile screen.
- **Camera Reception Scanner**: Uses `react-native-camera-kit` to scan the gym's reception QR code for instant check-in.
- **Attendance Timeline**: Scrollable timeline of check-ins.
- **Concurrency Guard**: Backend database constraint blocks duplicate check-ins on the same day.

### **Module 6: Daily Fitness & Progress Logbook (`ProgressScreen`)**
- **Daily Metrics Logger**: Track body weight (kg), water intake (L), protein intake (g), and steps/activity.
- **Calendar Dot-Matrix**: Monthly flex calendar showing color dots on logged workout days.
- **Validation Rules**: Restricts physiological values (weight 1-500kg, water max 20L) and blocks future date selections.

### **Module 7: Beginner Resource Center (`BeginnerGuideScreen`)**
- **Fitness & Nutrition Guides**: Workout routines, posture tips, and nutrition basics.
- **Gym Schedule & Support**: Operating hours, weekly holidays, and support contact details.

### **Module 8: User Profile & App Settings (`ProfileScreen`, `SettingsScreen`)**
- **Profile Management**: Update full name, phone number, and avatar image.
- **Preferences**: Dark/Light theme toggle, Notification preferences, Security & Privacy settings.

---

## 5. Comprehensive API Integration Reference

The mobile app communicates with backend services via `/api/v1` REST endpoints using standard JSON payloads and Bearer Token Authorization headers (`Authorization: Bearer <accessToken>`):

### **Authentication & Profile Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new customer account (`email`, `password`, `fullName`, `phone`) | No |
| `POST` | `/api/v1/auth/login` | Authenticate customer (`email`, `password`) -> Returns session & user profile | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated customer profile & gym link status | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Send password recovery email | No |
| `PUT` | `/api/v1/auth/profile` | Update profile information (`fullName`, `phone`, `avatarUrl`) | Yes |

### **Gym Directory & Join Request Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/gyms/directory` | List all public active gyms | Yes |
| `GET` | `/api/v1/gyms/my-request` | Check current customer join request status | Yes |
| `POST` | `/api/v1/gyms/join-request` | Submit join request to target gym (`gymId`) | Yes |

### **Membership Plans & Subscription Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/plans` | Fetch available plans for linked gym (`?gymId={id}`) | Yes |
| `GET` | `/api/v1/subscriptions/my-subscriptions` | Fetch customer's active and historical subscriptions | Yes |
| `POST` | `/api/v1/subscriptions` | Create new subscription record | Yes |

### **Razorpay Payment Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/create-order` | Create Razorpay payment order (`planId`) -> Returns `orderId`, `amount`, `key` | Yes |
| `POST` | `/api/v1/payments/verify` | Verify payment signature & activate subscription (`orderId`, `paymentId`, `signature`) | Yes |

### **Attendance & QR Check-in Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/attendance/my-attendance` | Fetch customer's personal check-in history logs | Yes |
| `GET` | `/api/v1/qr/my-pass` | Retrieve customer's rotational digital QR check-in pass token | Yes |
| `POST` | `/api/v1/qr/checkin` | Submit scanned reception QR token to log check-in | Yes |

### **Daily Fitness Progress Endpoints**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/progress/my-progress` | Fetch logged fitness metrics & calendar entries | Yes |
| `POST` | `/api/v1/progress` | Create or update daily metric log (`date`, `weight`, `water`, `protein`, `notes`) | Yes |

---

## 6. Directory Structure (`/frontend`)

```
frontend/
├── mobile_design.md             # <--- THIS SYSTEM DESIGN DOCUMENT
├── App.tsx                      # Application Entry Point & Root Providers
├── package.json                 # Dependencies & React Native scripts
├── metro.config.js              # Metro bundler configuration
├── babel.config.js              # Babel preset & dotenv configuration
├── tsconfig.json                # TypeScript compiler configuration
├── android/                     # Android Native Studio project folder
├── ios/                         # iOS Xcode project folder & Podfile
└── src/
    ├── api/                     # Axios API clients & interceptors
    ├── components/              # Reusable Native UI components (Cards, Badges, Modals)
    ├── config.ts                # Environment configuration (API Base URL, Supabase URL)
    ├── context/                 # React Context Providers (AuthContext, ThemeContext)
    ├── navigation/              # Native stack & bottom tab bar navigators
    ├── screens/                 # 22 Dedicated Mobile Screen Components
    │   ├── HomeScreen.tsx               # Customer Dashboard & Progress Bar
    │   ├── LoginScreen.tsx              # Auth Sign-In
    │   ├── SignupScreen.tsx             # Auth Registration & Format Checklist
    │   ├── PlansScreen.tsx              # Package Browsing & Razorpay Checkout
    │   ├── QRCheckInScreen.tsx          # Digital QR Pass & Camera Scanner
    │   ├── ProgressScreen.tsx           # Daily Logbook & Dot-Matrix Calendar
    │   ├── GymInfoScreen.tsx            # Gym Details & Directory Info
    │   ├── BeginnerGuideScreen.tsx      # Fitness & Nutrition Resource Center
    │   ├── ProfileScreen.tsx            # Member Profile & Details
    │   ├── SettingsScreen.tsx           # App Settings & Preferences
    │   └── ...                          # Additional Sub-Settings Screens
    ├── store/                   # Zustand Global Stores (useAuthStore, useGymStore)
    ├── theme/                   # Aura Dark Color Palette & Typography Tokens
    └── types/                   # TypeScript DTOs & Entity Contracts
```

---

## 7. Verification & Build Commands

- **Start Metro Bundler:** `npm start`
- **Run on Android Emulator:** `npm run android`
- **Run on iOS Simulator:** `npm run ios`
- **TypeScript Type Check:** `npm run typecheck` (`tsc --noEmit`)
