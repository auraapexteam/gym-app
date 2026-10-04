# Aura Apex store review notes

Prepared 4 October 2026. This document provides the review instructions and the checks needed before submitting them. Credentials belong in the store's private review-access fields or the team's credential manager, never in this repository.

## Product description

Aura Apex supports gym discovery, physical gym memberships, attendance using gym QR codes, and personal fitness records. Current membership purchases are for services consumed at the participating gym. Describe the specific submitted build accurately; do not present planned digital subscriptions, location detection, translations, reports, or AI features as working features.

The customer app and management portal have different roles. Review access should use a synthetic customer account. Do not give reviewers a platform-administrator account or credentials shared with an employee or real member.

## Review environment and account

Use a separate staging project with synthetic gym/member data while verifying the release. A pending gym status alone is not a security boundary. Existing broad attendance permissions and public personal-photo storage must be addressed before a review account can safely access the intended production environment.

The additive provisioning tool in `backend/scripts` is intended for a designated staging project. Run its dry-run first. It must not use the production Supabase project, existing weak-password seeds, wipe scripts, real card/UPI payments, or real member records.

Before copying account details into the store, verify:

- The final submitted build can sign in without an OTP or staff intervention and restores its session after restarting.
- The account has only customer privileges and access to its synthetic gym/member records.
- A non-chargeable synthetic membership is available for QR/attendance review. Label it as a review fixture; do not manufacture a captured Razorpay transaction.
- A current QR token and steps to display/scan it are supplied in the private review instructions where needed.
- Apple sign-in, password reset, cancellation, deletion, and their expected limitations are accurately described.
- Credentials are strong, stored privately, and valid throughout review; recreate a dedicated account if deletion testing removes it.

The provisioning tool and these notes do not establish that a live review account already exists.

## Reviewer walkthrough

1. Sign in with the dedicated customer credentials provided in the private review-access field.
2. Open Explore to inspect the gym information available in the submitted environment.
3. Open the assigned synthetic gym and its review plan. Do not ask reviewers to make a real payment to access the app's review features.
4. Open Book to scan the supplied gym QR token. Record the expected successful attendance result after testing that exact build and fixture.
5. Open Progress to enter a sample fitness log and confirm it persists after reopening the screen.
6. Open Profile and Settings to view the privacy, support, Terms and deletion-request links.
7. If reviewing deletion, use the dedicated disposable account. Explain any legally justified retained records and the actual verified completion behavior.

Only retain steps that pass against the submitted build. Supply clear alternatives for features requiring physical equipment or camera access. Add the actual test-environment URL, fixture details and private credentials in the store console after validation.

## Submission readiness record

Record the source commit, build number, platform, production/staging API host, tested device/OS, sign-in result, QR result, progress persistence, payment test result, deletion result, legal URLs and reviewer-account verification in the release ticket. The 29 September artifacts are build evidence, not proof of completed store review or production readiness.

## Review questions and responses

For a rejection or information request, preserve the exact guideline/message, build/version and reproducible steps. Reproduce the issue in a disposable account, fix and verify it, then reply through the store console with the change, verification steps and relevant screenshots. Do not change policy declarations to conceal app behavior or promise an unimplemented capability.

Public support contact: `contact@auraapex.in`.
