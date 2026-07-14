# Frontend Architecture & Developer Guide

- **Purpose**: Documents frontend application setup, technology stacks, configuration details, and Windows-specific fixes.
- **Scope**: Customer Mobile App, Owner Dashboard, Super Admin Portal, and local bundler settings.
- **Related Documents**: [System Design Overview](../architecture/system_design.md), [Folder Structure](../architecture/folder_structure.md)
- **Last Updated**: 2026-07-13

---

## Frontend Applications & Technology Stacks

Aura Apex consists of three frontend applications sharing the unified backend API.

### Customer Mobile Application
- **Platform**: React Native CLI
- **Language**: TypeScript
- **Target Users**: Gym Members
- **Key Packages**:
  - `React Navigation` (Routing & Stacks)
  - `Zustand` (State Management for authentication sessions and user profiles)
  - `TanStack Query` (Server state caching and sync)
  - `React Hook Form` & `Zod` (Input forms and schema verification)
  - `Axios` (HTTP Client instance)
  - `MMKV` (High performance key-value local storage)
  - `React Native Razorpay SDK` (Checkout overlay module)

### Owner & Customer Web Portal (`web-app/`)
- **Platform**: React SPA with Vite + TailwindCSS v4
- **Language**: TypeScript
- **Target Users**: Gym Owners, Staff, Trainers, Customers, Super Admin
- **Key Features by Role**:

| Role | Available Tabs |
|---|---|
| `super_admin` | Platform Overview, Onboard Gym, Audit Logs |
| `owner` | Overview, Staff, Trainers, Members (search + profile modal), Plans, Record Sale, Gym QR, Gallery, Join Requests, Gym Profile |
| `staff` | Front Desk, Members Directory, Manual Checkin, Gym QR |
| `trainer` | Overview, Member Log |
| `customer` | Overview (gym search → link request → plan view), **Progress Logbook** |

- **Customer Progress Logbook** (`activeTab === "progress"`):
  - Month summary stats row (avg weight, total water in L, total protein in g, days logged)
  - Interactive calendar grid — dots on logged dates, today ring-highlighted, future dates disabled
  - Click-a-date log panel — weight (kg), water (ml), protein (g), progress photo upload
  - Pre-fills existing values when reopening a previously logged date
  - Photo upload reuses the gallery `POST /gallery/upload-url` → binary `PUT` → `POST /progress/image` flow

---


## Workspace Setup & Dev Scripts

### Prerequisites
Before starting, ensure you have the following installed:
* **Node.js** (LTS version >= 22.11.0)
* **Java Development Kit (JDK)** (version 17, recommended for React Native 0.74+)
* **Android Studio & SDK** (configured with `ANDROID_HOME` environment variables)
* A physical Android device with **USB Debugging** enabled, or an active Android Virtual Device (AVD).

### Frontend Local Configuration
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Create a `.env` file containing your local keys (this file is git-ignored):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   API_BASE_URL=http://localhost:5000
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   ```
   *(Note: The application uses `react-native-dotenv` to dynamically read configuration values directly from `frontend/.env` during build).*

### Running the Mobile Client
1. **Configuring USB Debugging & Port Forwarding**
   Connect your physical Android phone to your PC via USB. Verify it is recognized by running:
   ```bash
   adb devices
   ```
   Forward port `5000` so that requests to `localhost:5000` inside your phone are routed to your local computer's backend:
   ```bash
   adb reverse tcp:5000 tcp:5000
   ```
2. **Starting the Metro Packager**
   Open a new terminal in the root directory and run:
   ```bash
   cd frontend
   npm run start
   ```
3. **Running on Android Device**
   Open a third terminal in the root directory and deploy the app:
   ```bash
   cd frontend
   npx react-native run-android --no-packager
   ```

---

## Windows-Specific Build Fixes

### Windows Path Length Error (`build.ninja still dirty`)
During native Android builds on Windows, paths can exceed the 260-character maximum length limit, causing CMake/Ninja compilation of C++ elements (such as `react-native-screens`) to crash or loop infinitely.

**How we fixed this in this project:**
We added a global directory redirection script inside [frontend/android/settings.gradle](file:///c:/Users/baodh/OneDrive/Desktop/Projects/Subscription-Management-React-Cli/frontend/android/settings.gradle). This forces the compilation objects of all library subprojects to write to short paths in `C:\tmp\cxx\`:
```groovy
gradle.beforeProject { project ->
    project.plugins.withId("com.android.library") {
        if (project.android.hasProperty("externalNativeBuild")) {
            project.android.externalNativeBuild.cmake {
                buildStagingDirectory = file("C:/tmp/cxx/${project.name}")
            }
        }
    }
}
```

If you ever run into Ninja loop issues or lockouts, simply clean your build cache:
```bash
# In a powershell terminal
Stop-Process -Name java -Force # Stops locked Gradle/Java processes
Remove-Item -Path C:/tmp/cxx -Recurse -Force # Deletes old CMake caches
cd frontend/android
./gradlew clean
```