# Mobile account deletion

Introduced on 2026-09-28. Updated on 2026-10-05 for the mobile client paired with
the durable backend deletion queue. Existing native binaries require a rebuild.

## User flow

Profile -> Settings -> Privacy & account deletion -> Request account deletion.
The native confirmation explains that acceptance signs the user out and makes
the account unavailable while cleanup continues in the background. The process
deletes the app profile, personal fitness history and private profile and progress
photos. Necessary gym membership, payment, attendance and accounting records,
including identifying details needed for those records, are retained for legal
obligations or resolving payment disputes. No retention period is asserted here;
the operator must define and enforce the applicable retention schedule.

Deletion does not issue a refund. Membership/payment disputes are directed to
the gym owner without requiring gym approval. Gym ownership, Apple sign-in access
and recurring payment mandates may require resolution before acceptance.
The confirmation preserves statutory rights and does not promise that every gym
record disappears. The in-app button is the primary deletion route; the support
inbox provides help and status updates.
Cancel/dismiss does not send a request. Confirmation sends authenticated
`DELETE /api/v1/auth/account` using the existing API client and current Bearer token.
Repeated submissions are blocked while pending.

An HTTP 202 response must include `success: true` and a valid UUID `requestId`
with `status: 'pending'`. The app shows that cleanup is pending, displays the
reference and support contact, and repeats the distinction between personal data
cleanup and retained gym records. It does not claim deletion is complete.
The previous HTTP 200 `success: true` response without a data payload remains
supported as completed account deletion, without promising that all data or photos
were purged. Malformed responses and HTTP errors keep the session; a timeout is
reported as unconfirmed, not proof that the account survived.

Ownership handoff, Apple revocation and recurring payment cancellation errors show
actionable instructions. Cancelling a membership in the app alone is not presented
as cancelling a provider mandate. Backend enforcement protects super admins, with
an additional frontend guard. No privileged key is added to the app.

Confirmed acceptance or legacy completion clears local profile, membership and gym
state, ignores stale queued responses, removes Supabase session/PKCE/user storage
keys from secure and legacy storage, and signs out locally. Clearing local
membership state does not delete the retained server records. Theme preferences
are preserved. A local cleanup failure is reported separately without losing the
accepted request reference or repeating DELETE. The login screen is withheld and
new sign-in is blocked until credential cleanup finishes.

## Release gates

Deploy and verify the durable backend queue and its database migration together
with this mobile contract. The historical deletion endpoint reported HTTP 200
without providing durable cleanup evidence; compatibility with that response is
not proof that the new cleanup process is deployed or that every object is gone.

Verify rejection of login/refresh/upload while a request is pending, Auth/profile
deletion, personal fitness cleanup, private and legacy personal-photo cleanup,
background retry and the final sweep for outstanding upload URLs. Acceptance alone
does not establish completion. Apple credential revocation and provider-confirmed
recurring cancellation must be implemented or completed before their guards can
permit deletion. Define retained fields, purposes, access controls and expiry
before release. Personal fitness logs are not financial records. A frontend
warning does not enforce retention or owner access limits.

## Basic verification

- TypeScript checks and focused Jest tests (confirmation/cancel, pending receipts,
  legacy completion, retained-record disclosures, malformed receipts, guard errors,
  401/403/500, timeout, duplicate request, cleanup failure, super-admin guard,
  stale profile/membership/gym responses and persisted credential cleanup).
- iOS regression tests for Apple/Google/email login options.
- No real accounts were deleted. End-to-end deletion requires an explicitly
  disposable account against the deployed backend, followed by a restart and
  attempted sign-in check on Android and iPhone.
- Existing APK/IPA binaries are not modified in place. Rebuild each branch to
  include the feature; a successful previous IPA build predates this change.
