# Mobile account deletion

Added on 2026-09-28 for `ios-ipa` (iOS) and `frontend-app` (Android).

## User flow

Profile -> Settings -> Privacy -> Delete account permanently. The native confirmation
warns that deletion cannot be undone and removes app access. It explains that
deletion does not issue a refund, directs membership/payment disputes to the gym
owner without requiring gym approval, and warns that necessary payment/accounting
records and identifying details may remain for legal obligations or disputes.
It does not promise that every gym record disappears or waive statutory rights.
Cancel/dismiss does not send a request. Confirmation sends authenticated
`DELETE /api/v1/auth/account` using the existing API client and current Bearer token.
Repeated submissions are blocked while pending.

Only a response with `success: true` triggers success and local cleanup. HTTP errors
keep the session and permit retry; a timeout is reported as unconfirmed, not proof
that the account was preserved. Backend enforcement protects super admins, with an
additional frontend guard. No privileged key is added to the app.

Successful deletion clears profile, membership and gym state, ignores stale queued
responses, removes only Supabase session/PKCE/user storage keys, and signs out locally.
Theme preferences are preserved. A local cleanup failure is reported separately
from server deletion. The login screen is withheld until cleanup finishes.

## Release gates (backend unchanged)

Read-only inspection of `origin/main` at `5e979ce` found the new endpoints and the
web client method. `AuthService.deleteAccount` currently falls back to deleting
only the profile if Supabase Auth user deletion returns an error. The route then
reports success. This must be corrected/verified by the backend owner before
claiming guaranteed permanent account deletion: an Auth account could survive.
The frontend cannot detect that partial success from the current response.

Also verify Apple credential revocation, intended cascade/storage cleanup and
existing-token handling on the server. No backend or database changes were made.
The operator now wants necessary gym financial records retained. Reconcile that
requirement with the cascade-delete implementation and define retained fields,
purposes and expiry before release. Personal fitness logs are not financial
records. A frontend warning does not enforce retention or owner access limits.

## Basic verification

- TypeScript checks and focused Jest tests (confirmation/cancel, success, 401/403/500,
  timeout, unexpected body, duplicate request, cleanup failure, super-admin guard,
  stale profile/membership/gym responses and persisted credential cleanup).
- iOS regression tests for Apple/Google/email login options.
- No real accounts were deleted. End-to-end deletion requires an explicitly
  disposable account against the deployed backend, followed by a restart and
  attempted sign-in check on Android and iPhone.
- Existing APK/IPA binaries are not modified in place. Rebuild each branch to
  include the feature; a successful previous IPA build predates this change.
