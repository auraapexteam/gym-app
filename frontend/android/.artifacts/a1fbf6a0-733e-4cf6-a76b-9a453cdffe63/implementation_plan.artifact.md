# Implementation Plan - Fix Gradle Build and Runtime Crash

This plan addresses the Gradle build failure (`AndroidLocationsBuildService`) and the subsequent runtime crash (`Screen fragments should never be restored`) in the React Native Android application.

## User Review Required

> [!IMPORTANT]
> I am proposing to downgrade Gradle from **9.3.1** to **8.10.2** and explicitly set the Android Gradle Plugin (AGP) version to **8.7.3**. Gradle 9.x is currently experiencing compatibility issues with the build services on Windows in this environment.

## Proposed Changes

### Gradle Configuration

#### [MODIFY] [gradle-wrapper.properties](file:///D:/gym-app/frontend/android/gradle/wrapper/gradle-wrapper.properties)
- Downgrade `distributionUrl` to Gradle **8.10.2**.

#### [MODIFY] [build.gradle (root)](file:///D:/gym-app/frontend/android/build.gradle)
- Explicitly set `com.android.tools.build:gradle` version to **8.7.3**.
- Adjust `kotlinVersion` if necessary (currently 2.1.20, which is fine for Gradle 8.10).

#### [MODIFY] [build.gradle (app)](file:///D:/gym-app/frontend/android/app/build.gradle)
- Ensure `layout.buildDirectory.set(...)` is used instead of `buildDir` (already updated, will maintain).

#### [MODIFY] [gradle.properties](file:///D:/gym-app/frontend/android/gradle.properties)
- Add `android.overridePathCheck=true` to help with Windows path issues.

### Activity Configuration

#### [MODIFY] [MainActivity.kt](file:///D:/gym-app/frontend/android/app/src/main/java/com/subscriptionmanagement/MainActivity.kt)
- Enhance `onCreate` to explicitly clear fragment state from `savedInstanceState` before calling `super.onCreate(null)`. This is a robust workaround for `react-native-screens` restoration issues.

## Verification Plan

### Automated Tests
- Run `./gradlew clean :app:assembleDebug` to verify the build fix.

### Manual Verification
- Deploy the app to the device.
- Verify that the app starts without the `IllegalStateException: Screen fragments should never be restored` crash.
- Test activity recreation (e.g., rotate screen or toggle dark mode) to ensure fragments are not incorrectly restored.
