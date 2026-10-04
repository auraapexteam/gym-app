# Render backend deployment

Reviewed on 2026-10-04. Production currently uses the existing Render service
`gym-app` (`srv-d9b1qstaeets73a4r9og`), GitHub branch `main`, root directory
`backend`, Node runtime, Free plan and Ohio region. The reviewed source was
`5e979ce`; the dashboard used `npm i` and `npm run dev;`, which starts TypeScript
with compilation checks disabled. This change prepares the following settings
in [`../render.yaml`](../render.yaml); it does not deploy them.

Use Node 22.12.0 or later for backend development, tests and builds. The locked
Supabase SDK requires Node 22+ for its native WebSocket implementation; the locked
Vite test tooling requires at least 22.12.0 on that release line. GitHub Actions
and Render both select the latest Node 22 release. Node 20 is unsupported.

| Setting | Reviewed value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/ready` |
| Node version | `22` |
| Runtime environment | `production` |
| Automatic deploy | Wait for passing checks |

Render runs these commands relative to the root directory. Do not add another
`cd backend`. The build produces `backend/dist`; `npm start` runs its compiled
`server.js`. Render provides `PORT`, and the application reads it at startup.
The readiness endpoint checks database access and returns a failure when that
dependency is unavailable. The Free plan can sleep when idle; this configuration
preserves the existing plan and does not establish continuous availability.

The explicit browser origin list contains the primary portal
`https://gym-app-web-app.vercel.app`, its verified deployments
`https://gym-app-9iws.vercel.app` and `https://gym-app-pw9a.vercel.app`. The marketing
site uses its own server functions and does not call this API. Add new reviewed clients by exact
origin. Native mobile requests do not need a browser origin. CORS controls browser
access; tenant authorization still needs its own checks.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are declared with `sync: false`.
Keep their existing values in the provider's secret settings. Render does not
replace or provision `sync: false` values during an existing Blueprint update.
Never copy secret values into this file or deployment logs. The storage bucket
name remains `gym-media`.

To apply after the code is integrated:

1. Merge the reviewed backend changes into `main` after its checks pass.
2. Update the existing service with these settings, or explicitly associate it
   with the reviewed Blueprint. Confirm the existing service is selected before
   applying; do not accidentally create a second production service.
3. Confirm required secret variables remain configured, then deploy the reviewed
   commit. This operation does not apply database migrations.
4. Confirm the service shows the intended commit, completes the TypeScript build,
   starts through `npm start`, and returns success from `/ready`.
5. Smoke-test login from the primary portal and the verified clones. Confirm an
   unlisted browser origin receives no CORS access. Verify customer deletion in
   a separate staging fixture before exposing a deletion regression to real users.
6. If the new deployment fails verification, use Render's previous deployment
   rollback and restore the previous reviewed configuration when necessary.

The account deletion fix returns `503 / ACCOUNT_DELETION_FAILED` if the Auth
provider returns an error or the request fails. It preserves the profile instead
of reporting a successful deletion after removing only that profile. This does
not resolve retained member fields, stored image cleanup or Apple token revocation.

Official provider references:
[Blueprint specification](https://render.com/docs/blueprint-spec),
[monorepo root directories](https://render.com/docs/monorepo-support), and
[Node/Express deployments](https://render.com/docs/deploy-node-express-app).
