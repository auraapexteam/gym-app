# Sign in with Apple — release gate

Status (2026-09-27): frontend implementation added locally; Apple/Supabase provider configuration verified in the dashboards. Native build and live authentication are NOT verified. Do not submit this build yet.

Local checks: TypeScript and 18 focused Jest tests passed. These use mocked providers, not a real Apple account. Backend, dependency manifests, bundle ID, signing and Codemagic configuration remain unchanged.

Rechecked 2026-09-27: TypeScript passed; both focused Jest suites passed (18 tests); the release-mode iOS JavaScript bundle completed with 16 assets; Git whitespace validation passed. A heuristic scan of changed/untracked files found no private-key files or common credential patterns. This is not native compilation or end-to-end authentication verification.

## What changed

- Login and signup retain Google and email/password, with an equally accessible Apple option on iOS.
- Apple uses the existing Supabase OAuth browser flow and `auraapex://login-callback`. No new dependency or app-embedded credential was added.
- AppDelegate forwards incoming URL callbacks to React Native. The JS callback accepts only the expected scheme/host/path, handles token and code responses, and reports failure without logging tokens.
- This is browser-based Apple login, not the native AuthenticationServices sheet. Supabase supports this approach in some React Native cases and recommends native Apple login as best practice. Review the real-device browser return and Apple button presentation before submission.

## Account setup required

### Configuration verified in the dashboards

- Existing App ID: `in.auraapex.userapp`; Sign in with Apple enabled. The existing App Store profile was regenerated after enabling the capability; CI selection still needs verification in the next archive.
- Services ID: `in.auraapex.userapp.auth`, associated with that App ID.
- Apple web domain: `jodthhltepjoepeaoano.supabase.co`.
- Apple return URL: `https://jodthhltepjoepeaoano.supabase.co/auth/v1/callback`.
- The user downloaded the Apple signing key, generated the OAuth client secret, and saved it directly in Supabase. No credential is included in these notes.
- Supabase Apple is enabled with Client IDs `in.auraapex.userapp.auth`; allowing users without email remains off. Google and Email remain enabled.
- Supabase allows `auraapex://login-callback`. The existing Site URL remains `http://localhost:3000`; the explicit mobile callback is allowed, but password-reset/default email destinations still need separate verification.
- Private email relay sender setup and a secret-rotation owner/reminder remain outstanding. Dashboard configuration alone does not verify a successful Apple token exchange.

### Next build and device test

1. Review and commit the intended frontend/iOS changes to `ios-ipa` only after push approval. A push automatically triggers `aura-apex-ios-release`; do not start a duplicate build.
2. Keep the working Codemagic workflow and signing configuration intact. Verify the refreshed profile is used and the native archive succeeds.
3. The current workflow produces an App Store-signed IPA but has no App Store Connect publishing step. Such an IPA is not a general-purpose sideload build. Arrange an approved TestFlight upload separately, with an unused build number if required.
4. Test Apple login on a physical iPhone as listed below, plus Google/email regression tests. Do not submit for review merely because an IPA was generated.

An authorized Apple Developer account administrator and Supabase project administrator must complete/verify:

1. Enable Sign in with Apple on the existing App ID `in.auraapex.userapp`. Do not rename the bundle ID. If Apple changes signing entitlements/profile requirements, verify/regenerate the matching profile through the existing signing workflow rather than editing CI blindly.
2. Verify the registered Services ID `in.auraapex.userapp.auth` remains associated with that primary App ID.
3. In Apple's web authentication settings, register the actual Supabase Auth domain and its HTTPS callback URL, copied from the project's Apple-provider page. The Apple return URL is the Supabase endpoint, NOT the app's custom scheme.
4. Configure Supabase Authentication > Providers > Apple with the Services ID, signing credentials and generated client secret. For web OAuth, put the Services ID first when multiple client IDs are configured. Keep private keys and client secrets out of source control, the mobile app and chat.
5. Add `auraapex://login-callback` to Supabase's redirect allowlist. Preserve existing Google redirects/settings.
6. Configure Apple's private-email-relay sender registration and appropriate email authentication for the real Supabase/email sender, so Hide My Email users can receive necessary account messages.
7. Assign an owner for rotating the OAuth client secret before its expiry (Apple allows up to six months). This browser flow needs maintenance; no rotation automation has been created.

## Verification before claiming compliance

- Test on a signed physical iPhone build: first-time Apple signup with Hide My Email, normal sign-in, returning Apple user, cancellation, offline/provider failure, and cold/warm app return.
- Confirm a valid account/profile is created and existing gym features work. Apple OAuth does not return full name; do not require users to reveal their real email to bypass relay addresses. If a name is needed, use an explicit profile field.
- Test existing email and Google login. Do not silently merge accounts by matching an entered email, especially relay emails. Review authenticated account-linking behavior separately; existing members may have different identities.
- Integrate Apple credential revocation into the real account-deletion workflow once available. Logout alone does not revoke the Apple relationship.
- Check Apple's current button branding/layout rules on device and that both providers are equally discoverable.
- Do not infer success from unit tests or from the presence of a button. The provider must be enabled and a real session must be verified.

## Sources

- [Apple login-services requirement](https://developer.apple.com/app-store/review/guidelines/#login-services)
- [Supabase Apple authentication](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Configure Apple web authentication](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web)
- [React Native URL forwarding](https://reactnative.dev/docs/linking)
