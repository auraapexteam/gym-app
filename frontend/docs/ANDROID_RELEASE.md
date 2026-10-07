# Android release preparation

The selected public package ID is `in.auraapex.userapp`, matching the intended iOS bundle ID. The Java/Kotlin namespace remains `com.subscriptionmanagement`. Play registration and package availability are not yet verified. Do not change the public ID after the first Play upload.

Release builds use a private upload keystore. They fail if credentials are absent or point to the template debug key. Debug builds continue to use the development key.

Supply these settings as environment variables or in the owner's private `~/.gradle/gradle.properties`:

| Setting | Value |
| --- | --- |
| `AURA_APEX_UPLOAD_STORE_FILE` | Absolute path to the private upload keystore |
| `AURA_APEX_UPLOAD_STORE_PASSWORD` | Keystore password |
| `AURA_APEX_UPLOAD_KEY_ALIAS` | Upload-key alias |
| `AURA_APEX_UPLOAD_KEY_PASSWORD` | Key password |
| `AURA_APEX_VERSION_CODE` | Positive integer; increase for each subsequent Play upload |
| `AURA_APEX_VERSION_NAME` | User-facing version, initially `1.0.0` |

Never put signing passwords, keystores or private Gradle properties in Git, screenshots or chat. Keystore/JKS/AAB files are ignored by this repository. The owner must retain an encrypted backup of the upload key and recovery details. Prefer Play App Signing during enrollment; completing agreements and payment remains an owner action.

Use JDK 21, Android SDK/platform/build tools 36 and the repository's pinned NDK/Gradle versions. After the backend and staging environment are configured, build from `frontend/android`:

```powershell
.\gradlew.bat bundleRelease
```

The expected output is `app/build/outputs/bundle/release/app-release.aab`. Before uploading, verify the certificate against the intended upload key, confirm the merged manifest is not debuggable and has only justified permissions, check the bundled API/Supabase endpoints, and exercise the release on Android 16 and a 16 KB page-size environment. Run the native authentication, camera/photo-picker and accessibility walkthrough on a device. Check dependency privacy notices and store disclosures against the resolved native artifact.

No release AAB or signing certificate has been produced or verified by this source change. Android SDK/device testing, key setup, account enrollment and Play upload remain release gates.
