# Synthetic review fixture preparation

`provision-review-demo.mjs` prepares an additive fixture for a **separate staging
Supabase project**. No fixture has been provisioned by this change. The only
reviewed project is production; staging access and a staging app/API build are
still required before a reviewer account can be supplied.

From `backend`, preview the plan without credentials or network access:

```sh
node scripts/provision-review-demo.mjs
```

`--dry-run` is optional and equivalent. The script does not read `.env`, reuse the
application's `SUPABASE_*` variables, reset tables, or invoke `seed.ts` / wipe
scripts. Each committed run creates a fresh fixture; it is not an idempotent reset.

For an approved, isolated staging project, load these values into the operator's
environment from a private secret store:

| Variable | Required value |
| --- | --- |
| `DEMO_ENVIRONMENT` | `staging` |
| `DEMO_ALLOWED_PROJECT_REF` | The explicitly approved staging project reference |
| `DEMO_SUPABASE_URL` | Its exact `https://<staging-ref>.supabase.co` origin |
| `DEMO_SUPABASE_SERVICE_ROLE_KEY` | That staging project's service-role credential |
| `DEMO_REVIEW_PASSWORD` | A private, unique password of 20+ characters with uppercase, lowercase, a digit and a symbol |

Do not store passwords or service-role credentials in the repository, review
notes or shell history. Keep reviewer credentials in the team's private vault and
share them through the store's private review fields only when the fixture is
validated. Provisioning requires both an explicit commit and a matching target:

```sh
node scripts/provision-review-demo.mjs --commit --project-ref <staging-ref>
```

The known production project `jodthhltepjoepeaoano` is always refused. Verify any
other supplied reference is actually staging; an allowlist string cannot identify
every future production project. Staging must contain only synthetic data and
must have no production credentials, real payment integration or outbound email
hooks. This script calls Auth's administrative `createUser` with email confirmation
already set; it does not dispatch a signup email. Its generated `example.invalid`
address cannot be a real mailbox. Check any project-specific hooks separately.

The fixture contains a pending gym with no owner, one customer-role Auth user and
profile, one inactive synthetic member and an approved synthetic gym link. It
creates no staff/admin roles, payments, plans, subscriptions, memberships or health
records. The profile trigger and tables in the repository schema must exist first;
the script does not apply migrations. Output includes the created IDs and review
email, but never the password or credential values.

Pending gyms are excluded from the public directory, but pending status is **not
a private tenant security boundary**. Existing authorization gaps still require
fixes. This limited fixture does not demonstrate payments, active check-in or
every store review feature, and must not be presented as a completed store-ready
demo. Confirm staged customer journeys and finish core privacy/tenant fixes before
submitting review credentials.

On a reported failure, the script attempts to remove only the gym and Auth user
IDs returned by this run. Database cascades remove their synthetic linked rows.
It does not search for or modify existing records. A network failure can leave the
outcome of a request unknown, and cleanup can also fail; inspect the staging
fixture marker / created IDs privately before retrying. Clean up only these new
synthetic records. This process cannot run atomically across Auth and Postgres.
