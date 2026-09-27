# Aura Apex Privacy Policy — DRAFT

> Working draft for owner and legal review, not a published policy. Replace every `[CONFIRM: ...]` item and verify the statements against the deployed app, backend and provider settings before publication. This is drafting assistance, not legal advice or a compliance certification.

Effective date: [CONFIRM: publication date]

## 1. Who we are

Aura Apex is a gym membership and fitness-tracking service operated by [CONFIRM: legal name of the individual or business operating Aura Apex], located at [CONFIRM: business/contact address] ("we", "us", "our"). This policy explains how we handle personal information when you use the Aura Apex app and related services.

Privacy contact: **contact@auraapex.in**

Phone: **+91 80109 49460**

## 2. Information we collect

Depending on the features you use, we process:

- **Account and contact details:** name, email address, phone number, account identifier, profile photo and authentication/session information. Password authentication is handled through our authentication provider.
- **Profile and fitness information:** information you enter during setup, such as date of birth, gender, height, weight, fitness goals and experience, training preferences, dietary preferences, city/location text, and any health conditions you disclose.
- **Activity records:** gym associations, membership plans, attendance/check-ins, and fitness entries such as weight, water/protein intake, steps, sleep, workout records and notes. We also process photos when you use an available photo-upload feature.
- **Transaction information:** selected plan, amount, order/payment identifiers and payment status. Razorpay processes checkout information. [CONFIRM: exactly which payment fields Aura Apex receives/stores; do not claim that no payment information is collected.]
- **Support and technical information:** messages you send us and information used to operate and secure the service, including request/audit records and IP addresses. [CONFIRM: other device, diagnostic, SDK and hosting-log fields actually collected.]

Information entered in fitness logs is associated with your account. The current app's manually entered fitness records should not be described as automatic HealthKit or GPS collection.

## 3. How we use information

We use information to create and authenticate accounts, manage gym memberships, process and verify payments, record attendance, display your fitness history, respond to support requests, and maintain service security and reliability. Where required, we also use relevant records to meet legal obligations and resolve payment disputes.

[CONFIRM: any marketing, analytics, automated recommendations or other purposes; add the required consent/opt-out process before using information for those purposes.]

## 4. Who receives information

- **Login providers:** when you choose Google or Apple login, that provider processes the authentication request and supplies account identity information through Supabase. Apple users can choose its private relay email option. [CONFIRM: provider configuration and successful live authentication before publishing this description.]
- **Service providers:** we use Supabase for authentication, database and file-storage functions, and Razorpay for payment processing. Hosting and communications providers also process information necessary to deliver the service. [CONFIRM: current hosting/email providers and processing locations.]
- **Gyms and their authorized personnel:** gym-related records may be accessible to the gym you join for membership administration and attendance. [CONFIRM: the exact information each owner, staff member and trainer can access, especially health conditions and fitness logs; describe only permissions that are actually enforced.]
- **Legal or security recipients:** information may be disclosed where legally required or necessary to address fraud, security incidents or legal claims, subject to applicable law.

[CONFIRM: whether there is any sale, advertising-related sharing or cross-app tracking, including by SDKs. Do not add an unverified "we never share data" or "no tracking" promise.]

## 5. Camera, photos and device storage

We request camera access to scan gym check-in QR codes. When you choose a profile photo, the app uses the device photo picker and uploads the selected image for that feature. You can manage device permissions in system Settings; refusing a permission may prevent the associated feature from working.

The app stores session information and some preferences on your device. Removing the app does not by itself delete your server-side account or records.

## 6. Security and storage locations

We use technical and organizational safeguards appropriate to the service. No storage or transmission method is completely secure. We do not describe the service as end-to-end encrypted.

[CONFIRM: hosting/storage countries, provider safeguards and any applicable international-transfer arrangements.]

## 7. Retention and deletion

We retain information for the periods needed to provide the service and meet applicable obligations. Our specific retention periods are:

- Account/profile and fitness records: [CONFIRM: duration and deletion trigger].
- Payment/accounting records: [CONFIRM: categories, applicable obligation and duration].
- Security/support records: [CONFIRM: duration].
- Uploaded files and backups: [CONFIRM: deletion schedule and backup expiry].

**Account deletion:** [CONFIRM: the implemented in-app steps, identity verification, processing timeframe, records deleted, limited records retained and reasons. This section cannot be finalized while deletion is unimplemented. Do not claim that a button or email instantly deletes an account.]

Deleting an account and cancelling/refunding a gym membership are different actions. [CONFIRM: membership/payment consequences and explain these before deletion confirmation.]

## 8. Your choices and requests

You can update information through the available profile controls and manage camera/photo permissions in device Settings. Contact **contact@auraapex.in** with privacy questions or requests to access, correct or delete information. We may need to verify your identity before responding. Available rights and any exceptions depend on applicable law.

[CONFIRM: consent-withdrawal procedure, response timeframe and complaints/grievance contact where applicable. Email support does not replace the required in-app account-deletion flow.]

## 9. Children

[CONFIRM: minimum user age, whether minors can register, and any parental consent/verification and child-data safeguards actually implemented. Do not publish an adults-only claim unless the product and business enforce it.]

## 10. Changes and contact

We will update this policy when our practices change and display the revised effective date. [CONFIRM: how users will be notified of material changes and when fresh consent is required.]

Questions: **contact@auraapex.in** or **+91 80109 49460**.

---

## Internal publication checks — remove this section before publishing

- Current source generates public URLs for personal image uploads. Verify actual bucket access and photo visibility before promising private images; generating a public URL alone does not establish the live bucket's settings. Review this especially before enabling sensitive progress photos. No backend change has been made.
- Verify actual storage of setup health fields, deployed access controls, logs and all SDK processing. A local-only preference is not an enforced sharing restriction.
- Align the final policy with App Store Connect privacy labels and the archived privacy manifest; neither is a substitute for the policy.
- Publish the approved policy at a stable public HTTPS URL without requiring login, then connect the app link. No URL is assumed to exist by this draft.
- Apple sources checked: [App Review Guidelines, section 5.1](https://developer.apple.com/app-store/review/guidelines/#privacy) and [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).
