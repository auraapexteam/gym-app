# iOS pre-submission audit — 2026-09-22

Branch: `ios-ipa`, based on `f72b174`. Source-code review, not an iPhone test or an Apple approval guarantee. **Do not submit yet.**

## Follow-up decisions

- 2026-09-27: Apple Services ID/callback setup is saved, and Supabase Apple is enabled with `in.auraapex.userapp.auth`. The mobile redirect is allowlisted; Google and Email remain enabled. This supersedes the provider-activation-pending notes below. Signed-build and real-device login tests, private email relay setup, and the other submission gates are still outstanding. See `ios-apple-login-setup.md` for verified public configuration and the build handoff.

- Latest work: added the Apple OAuth frontend option alongside Google/email and fixed iOS URL callback forwarding. This supersedes the earlier note that Apple login was not added. Provider activation and real-device/native verification remain pending; see `ios-apple-login-setup.md`. No backend, signing or Codemagic configuration files were changed. Account deletion remains pending the user's update; legal drafts remain unapproved.

- Backend is read-only per the user. Fetched `origin/main` at `8c81e1b0e175fff4177c2df1590200b31a8f344e` without switching branches. Its auth routes have no self-service deletion endpoint. `AuthService.removeUser` is an internal rollback helper; `DELETE /members/:id` requires member-delete permission and soft-deletes a gym member record, not the user's account. No backend files were changed or backend operations invoked.
- Google and email/password login/signup are restored on both iOS and Android at the user's request. The original OAuth handlers are unchanged. Do not remove working features just to address review risk; the equivalent privacy-focused login requirement remains an unresolved submission issue. Apple login was not added because it needs provider configuration.
- User confirms current services are gym-related, with digital content only a future possibility. Current Razorpay flow remains untouched. Reassess payment eligibility and implement the applicable Apple purchase flow before introducing paid digital content.
- No published policy pages were found in the local website source or indexed domain search. This does not establish that none exist. A privacy policy is a public webpage explaining actual data use, sharing, retention/deletion and contact details; terms explain service conditions and cancellation/refunds. Drafting/review and publication still need to happen before connecting verified URLs. The privacy-policy URL is explicitly required by Apple; terms should accurately describe the gym service, not Apple auto-renewable subscriptions.

## Local fixes

- Removed unenforced trainer-data-sharing and analytics consent switches. Their values were only saved in AsyncStorage and never consumed.
- Renamed the partial profile display to an account summary; closing it no longer falsely claims an export was generated.
- Removed false deletion-success and unsupported end-to-end-security claims. Deletion and legal documents now explicitly report unavailable; this is honesty hardening, NOT implementation of those requirements.
- Removed navigation entries for notification and language preferences that do not actually control notifications or translate the app. Existing screen code and stored preferences are preserved.
- Display actual membership duration instead of mislabeling every plan as monthly/yearly.
- Handle image-picker errors and add a camera Settings recovery path.
- Set confirmed support details to `contact@auraapex.in` and `+918010949460`; corrected unsupported cancellation/offline-save FAQ claims.

## Blocking decisions and work

1. **Account deletion (5.1.1(v)).** `PrivacySettingsScreen.tsx` has no real deletion flow and auth routes have no self-service deletion endpoint. Backend modification needs approval under the earlier preservation constraint. Do not just expose `AuthService.removeUser`: profile deletion can leave member/trainer personal data through SET NULL relationships, and uploaded images need cleanup. Define lawful retention, implement authenticated self-only deletion with confirmation and retry-safe cleanup, then verify with disposable test accounts after backend deployment. Email-only support is not a substitute for in-app initiation.
2. **Privacy policy (5.1.1(i)).** Supply a public privacy-policy URL and terms URL. Connect accessible in-app links (including signup) and the App Store Connect policy field. Policy must describe actual collected data, processors, sharing, retention/deletion and contact details. Do not invent company/legal promises. The website was not accessible through the research tool, so no policy URL has been verified.
3. **Login (4.8).** Login and signup offer Google without an equivalent privacy-focused login option. Choose email/password-only on iOS, or configure and implement Sign in with Apple, including account linking and revocation on deletion. Do not add a cosmetic Apple button without a working backend/provider configuration.
4. **Privacy disclosures.** The app processes identity/contact details, profile photos, membership/payment records and fitness logs. The checked-in privacy manifest has an empty collected-data list. Review actual app/SDK collection, fill the appropriate manifest and App Store Connect answers, and inspect the archived privacy report. React Native's Pod post-install code aggregates required-reason APIs and attaches the manifest; the checked-in Xcode resource list alone is not proof that it is absent from the IPA. Do not declare “no data collected.”
5. **Payments (3.1.3(e)).** Current checkout appears to sell gym memberships using Razorpay. External payment is appropriate for physical services consumed outside the app. Confirm that paid plans do not also unlock paid digital features/content before retaining this model. Do not add StoreKit solely because the UI uses the word subscription.
6. **Other incomplete UI (2.1).** About screen still has fake website/rating/sharing/license alerts, a hard-coded build 102, and unverified developer identity. Replace/remove unfinished actions and verify identity before release. Confirm the configured Supabase password-reset destination actually lets users reset their password; no dedicated reset-completion screen is present in this mobile app.

## Submission/device checks still required

- Real-device TestFlight tests: email signup/login/logout, any chosen social login, password reset, camera/photo permission denial and recovery, gym linking/check-in, checkout verification/cancellation, offline failures, deletion and retained-data behavior.
- Supply an active review account, usable gym/QR test data and review instructions; keep the backend available. Do not create payments or delete real accounts during testing.
- Complete privacy labels, age rating, support/policy URLs, accurate screenshots and review notes in App Store Connect. Explain physical gym purchases if confirmed.
- Inspect actual IPA manifest/SDK signatures and test supported iPad layouts; target includes iPhone and iPad.
- Use a new build number for later App Store Connect uploads when required. Existing Codemagic/signing/version configuration is unchanged by this audit.

## Verification

- TypeScript check and iOS release JavaScript bundle passed after the fixes; Git whitespace validation passed.
- Eight focused Jest tests cover ineffective privacy switches, honest summary behavior, no fake deletion success, unfinished preference entries, and preserved Google/email options on iOS/Android login and signup. Re-run after changes. The earlier release bundle check predates the login-option follow-ups.
- No iOS native archive, on-device test, live account deletion or payment was performed.
- Backend, database, dependencies, bundle ID, native signing and Codemagic files remain unchanged. Nothing committed, pushed or submitted.

## Primary sources

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): 2.1, 3.1.3(e), 4.8, 5.1.1.
- [Offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
- [App privacy details](https://developer.apple.com/app-store/app-privacy-details/).
