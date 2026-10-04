# Aura Apex release rollout and support procedure

Prepared 4 October 2026. The Aura Apex account owner is the release lead. The implementation maintainer investigates code/service failures. The support operator monitors `contact@auraapex.in`, records requests and verifies ownership before handling account data. The release lead must assign those roles to available people before a store rollout.

## Release record

For each candidate record the source commits for mobile/backend/website, build numbers, artifact checksums, signed build identity, API/Supabase environment, approved legal-page versions, dependency/SDK disclosure review, test results, reviewer access and rollout decision. Keep signing keys, passwords, tokens and personal data out of the record.

Tag or otherwise identify the tested commit and retain the previous known-good backend/website deployment and mobile artifact. A newer mobile build does not automatically contain a backend change on another branch.

## Checks before uploading

- Required account enrollment, identity/device/package verification and store declarations are complete.
- The backend typecheck, tests and compiled build pass; the intended environment passes readiness and a disposable-account smoke test.
- Customer/staff access boundaries, private images and sensitive-data/deletion behavior match disclosures.
- The exact signed mobile build passes login/restart, sign-out/account switch, gym selection, membership, QR, progress, error handling, permissions and deletion checks on the target devices.
- Privacy/Terms/support/deletion URLs work, the contact inbox receives requests, and provider callbacks/password-reset URLs target the intended release.
- The intended Android upload key/AAB and iOS distribution identity/build number are verified.
- Review credentials and a synthetic fixture are tested without real payments or member data.

Stop the release if a core flow fails, a store declaration is unsupported, or any user can access another user's private data.

## Testing and gradual release

Start with internal/disposable-account testing, then the applicable TestFlight/Play test track. Satisfy any account-specific closed-testing prerequisite before applying for production access.

For updates, use the store's supported staged/phased controls, beginning with its smallest practical release population. For an initial release where a phased control is unavailable, use test tracks first and monitor closely after production release. Confirm actual controls in each console rather than assuming the same percentages exist on both stores.

Advance only after the release lead reviews enough real sessions and completed critical flows to judge behavior. Low usage is not evidence of stability. Do not advance on a zero-event crash graph alone. Keep an observation period covering a normal gym operating cycle between advances and retain the ability to halt.

## Checks during rollout

The support operator and maintainer review the following at the start/end of the working day and before each expansion:

- Store crash/ANR reports and newly reported device/OS regressions.
- Backend readiness, error/timeout patterns and release-startup failures.
- Login/recovery failures and unexpected account/tenant access.
- Checkout/order confirmation, duplicate/incorrect payment or membership state, and webhook-processing failures.
- QR check-in and fitness-log persistence failures.
- Account deletion and support-request failures.
- Reviews and messages in `contact@auraapex.in`, classified by reproducible issue and severity.

Do not log raw health notes, photos, credentials, full request bodies, or payment secrets. Use correlation IDs and minimal operational evidence. Existing provider dashboards can supply initial signals; no automated monitoring integration is represented as installed by this document.

## Halt and recovery

Immediately halt rollout for unauthorized data access, personal-image exposure, unsafe deletion, incorrect/duplicate charging, widespread login failure, or a repeatable critical crash. Escalate privacy/payment incidents to the release lead immediately.

For a backend/website regression, select the previous verified deployment when compatible with the current database. Never undo a data migration or delete records blindly to achieve rollback. Validate readiness and the affected critical flow after recovery.

For a mobile regression, halt further staged distribution and prepare a tested fix with a new build number. Users who already installed the version may retain it; store rollout controls are not a guaranteed downgrade. Communicate the actual workaround or fix through the relevant support/store channel after the release lead approves the message.

Preserve the affected build, timestamps, correlation IDs, scope and corrective actions. Reopen distribution only after the issue is reproduced, fixed, verified and reviewed by the release lead.

## Deletion requests and support

The public deletion-request page can direct users to `contact@auraapex.in`. The operator must monitor it and use a tracked request process:

1. Record receipt and requested action without copying unnecessary personal/health information.
2. Verify account ownership through the account's registered contact or a proportionate recovery process. Do not accept a gym owner or another person as authorization to delete a customer's account.
3. Explain account-access loss and the actual limited retention exceptions; do not require a refund dispute to be settled as a condition of deletion.
4. Use the validated deletion process. Check auth/profile/log/storage results and required provider revocation; do not claim completion from a failed API call or local sign-out.
5. Confirm the result or explain an unresolved failure using the minimum necessary information. Retain an appropriate operational record according to the approved retention schedule.

Never request a password, OTP, full card number, card security code or unnecessary ID scan by email. Response/cleanup periods must be set and met by the operator; this procedure does not invent a published service guarantee. Until the complete deletion/retention workflow is validated, keep the launch gate open and explain current limitations honestly.

## Rejection response

Capture the exact review finding and affected version, reproduce it in a disposable fixture, link a fix to the release record, rerun the affected checks, and prepare concise reviewer instructions. Include screenshots/log references only after removing personal data and secrets. The release lead submits the response through the store console and tracks the outcome.
