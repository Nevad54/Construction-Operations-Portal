# Construction Operations Portal

A full-stack construction company web app with a public marketing site, role-based dashboards, project tracking, file management, and contact inquiry operations.

![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=222)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Demo

- Live app: `https://mastertech4.netlify.app/`
- API status endpoint: `https://mastertech-app-32jm.onrender.com/api/status`
- Demo video: coming soon

## Screenshots

- `docs/screenshots/home-light.png` - Public homepage (light mode)
- `docs/screenshots/home-dark.png` - Public homepage (dark mode)
- `docs/screenshots/projects-list.png` - Projects listing with filters
- `docs/screenshots/contact-form.png` - Contact + reCAPTCHA flow
- `docs/screenshots/admin-dashboard.png` - Admin overview dashboard
- `docs/screenshots/admin-inquiries.png` - Inquiry status/priority management
- `docs/screenshots/admin-reports.png` - Analytics cards and activity
- `docs/screenshots/mobile-nav.png` - Mobile navigation and responsive layout

### Public Experience

![Home Light](docs/screenshots/home-light.png)
![Home Dark](docs/screenshots/home-dark.png)
![Projects List](docs/screenshots/projects-list.png)
![Contact Form](docs/screenshots/contact-form.png)

### Admin Experience

![Admin Dashboard](docs/screenshots/admin-dashboard.png)
![Admin Inquiries](docs/screenshots/admin-inquiries.png)
![Admin Reports](docs/screenshots/admin-reports.png)

### Mobile

![Mobile Navigation](docs/screenshots/mobile-nav.png)
![Mobile Home Light](docs/screenshots/mobile-home-light.png)
![Mobile Home Dark](docs/screenshots/mobile-home-dark.png)
![Mobile Projects](docs/screenshots/mobile-projects.png)
![Mobile Contact](docs/screenshots/mobile-contact.png)
![Mobile Admin Dashboard](docs/screenshots/mobile-admin-dashboard.png)
![Mobile Sidebar](docs/screenshots/mobile-sidebar.png)
![Mobile Reports](docs/screenshots/mobile-reports.png)

## Highlights

- Public client pages: home, about, services, projects, contact
- Admin dashboard: projects, contacts/inquiries, analytics, account management, settings
- User dashboard: assigned projects and workspace
- Role-based auth: admin, employee (`user`), client
- Project lifecycle: ongoing/completed, CRUD, media support
- File management workspace with visibility controls and activity tracking
- Contact workflow: reCAPTCHA-protected submissions, inquiry status/priority/assignment updates
- Responsive UI with mobile navigation/sidebar improvements

## Tech Stack

- Frontend: React 18, React Router 6, Vite, Vitest, Tailwind CSS, AOS, Font Awesome
- Backend: Node.js, Express, Mongoose, Express Session, CORS, Multer, Nodemailer
- Storage/Services: MongoDB Atlas (or local fallback JSON), optional Cloudinary + CloudConvert
- Deployment targets: Netlify (frontend), Render (backend)

## Architecture

- `src/`: client app (public pages + role dashboards)
- `backend/server.js`: Express API and auth/session logic
- `backend/models/`: Mongo models (`User`, `Project`, `FileItem`, `Inquiry`, `ActivityLog`)
- `backend/scripts/`: utility and smoke scripts
- `render.yaml` / `netlify.toml`: deployment configs

## Main Routes

- Public:
  - `/`
  - `/about`
  - `/services`
  - `/projects`
  - `/contact`
- Auth:
  - `/login/admin`
  - `/login/user`
- Admin:
  - `/admin/dashboard/projects`
  - `/admin/dashboard/files`
  - `/admin/dashboard/clients`
  - `/admin/dashboard/reports`
  - `/admin/dashboard/settings`
- User:
  - `/user/dashboard`

## API Surface (selected)

- Health: `GET /api/status`
- Auth: `POST /api/login`, `POST /api/register`, `POST /api/logout`, `GET /api/me`
- Projects: `GET/POST/PUT/DELETE /api/projects`
- Admin users:
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PUT /api/admin/users/:id`
  - `POST /api/admin/users/:id/reset-password`
  - `DELETE /api/admin/users/:id`
  - `GET /api/admin/export/users` (CSV download of user list; optional query param `role`)
  - `GET /api/admin/export/inquiries` (CSV download of inquiries; optional `status` filter)
  - `GET /api/admin/export/activity` (CSV download of activity logs; optional `limit`)

- Scheduled exports: when the backend is running it writes daily CSV files to an `exports/` directory adjacent to the project root. The files include `users.csv`, `inquiries.csv`, and `activity_logs.csv`, and are regenerated every 24 hours (first run about 30 seconds after start).
- Inquiries:
  - `POST /api/contact` (public submission)
  - `GET /api/admin/inquiries`
  - `PUT /api/admin/inquiries/:id`
  - `DELETE /api/admin/inquiries/:id`

## Local Development

### 1) Install dependencies

```bash
npm install
cd backend && npm install
cd ..
```

### 2) Configure environment

Create `.env` in repo root (or copy from deployment templates):

Required/important keys:

- `MONGO_URI`
- `SESSION_SECRET`
- `CORS_ORIGINS`
- `ADMIN_USER`, `ADMIN_PASS`
- `EMP_USER`, `EMP_PASS`
- `CLIENT_USER`, `CLIENT_PASS`
- `RECAPTCHA_SECRET_KEY` (for strict contact validation)
- `EMAIL_USER`, `EMAIL_PASS`, `CONTACT_EMAIL` (for email notifications)
- Optional cloud/file features:
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `CLOUDCONVERT_API_KEY`

Frontend optional key:

- `REACT_APP_RECAPTCHA_SITE_KEY`

reCAPTCHA deployment guardrails:

- `RECAPTCHA_SECRET_KEY` and `REACT_APP_RECAPTCHA_SITE_KEY` must come from the same Google reCAPTCHA project.
- The site key must allow every deployed frontend hostname that should render the live widget.
- For Render + Netlify, that usually means the production frontend domain, any preview domain you intend to use for real contact testing, and any custom domain.
- Localhost no longer needs to be added for standard development because the contact page uses a local verification path on `localhost`.
- If the deployed contact page shows a Google domain error inside the widget, verify the allowed domains in Google first, then confirm the frontend site key and backend secret still match.

Deployment env templates:

- `render.env.template`
- `netlify.env.template`

### 3) Run app

Run frontend + backend together:

```bash
npm run dev
```

This starts:

- backend on `http://localhost:3002`
- frontend on `http://localhost:3001`

Alternate local demo ports used in this repo are also supported:

- frontend on `http://localhost:3101`
- backend on `http://localhost:3102`

The local dev proxy now follows the supported port pair:

- frontend `3001` proxies `/api/*` to backend `3002`
- frontend `3101` proxies `/api/*` to backend `3102`

To start the backend explicitly on the demo port without editing env files:

```bash
npm run start:backend:demo
```

This command also forces `NODE_ENV=development` and blanks the email env vars, which keeps the local demo contact flow usable by skipping live reCAPTCHA verification and returning the no-email success path locally.

On localhost, the contact page now swaps the live Google reCAPTCHA widget for a local verification control in development mode. Production and deployed preview environments still use the real widget and require a valid site key.

You can also run frontend only:

```bash
npm start
```

`npm start` now runs the Vite dev server. If you run the frontend without the backend, public pages still render, but project data and admin API features will show fallback messaging until the API is available.

## Build and Verify

Frontend build and test now run through Vite and Vitest.

```bash
npm run build
```

The frontend build now runs directly through Vite; it does not require `cross-env` for production builds.

Other useful scripts:

- `npm run verify:release` (build + frontend tests + backend tests)
- `npm run smoke:public-ui` (focused public-route smoke coverage for theme toggle, mobile nav, shared layout, and localhost contact verification)
- `npm run verify:public-ui` (build + focused public-route smoke coverage)
- `npm run verify:release:public` (public build, public-route smoke coverage, bundle budget, and tracked public-asset budget)
- `npm run verify:production` (runs the deployed production smoke, deployed contact probe, and production health report in one pass)
- `npm run check:deploy-config` (fails if deployment templates/docs drift away from the supported Netlify + Render and Render-static env expectations)
- `npm run check:bundle-budget` (fails if the built JS output exceeds the local demo budget)
- `npm run check:public-assets` (fails if the tracked public marketing assets exceed the local demo budget)
- `npm run report:production-health` (prints a live deployed health snapshot with status codes and timings for key public and API routes)
- `npm run report:unused-uploads` (lists oversized public upload files that are not referenced by the current frontend source)
- `npm run smoke:local-demo` (checks local frontend + backend demo routes on `3001/3002` or `3101/3102`)
- `npm run smoke:production` (checks a deployed frontend across core public routes plus `/api/status`, `/api/auth/me`, and a production-safe invalid-token contact probe)
- `npm run smoke:deploy-runtime` (checks a frontend origin and its API boundary via `/`, `/api/status`, and anonymous `/api/auth/me`)
- `npm run smoke:deploy-contact` (checks a deployed contact route and sends a production-safe invalid reCAPTCHA probe to `/api/contact`)
- `npm run smoke:admin` (logs in as admin and checks the dashboard API shape locally)
- `npm run smoke:contact` (submits a local demo inquiry to the public contact endpoint)
- `npm run verify:demo` (builds, checks the bundle budget, boots an isolated demo backend, and runs the full local demo smoke set)
- `npm run smoke:rbac` (basic RBAC smoke checks)
- `npm run optimize` (build + bundle analysis)

### Release Gate

Short operator path:

1. Run `npm run verify:release:public`
2. Deploy
3. Run `FRONTEND_URL=... BACKEND_URL=... npm run verify:production`
4. Record the result in [`docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md`](./docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md)
5. Classify the outcome with [`docs/PRODUCTION_ALERT_THRESHOLDS.md`](./docs/PRODUCTION_ALERT_THRESHOLDS.md)

The compressed operator version is documented in [`docs/RELEASE_OPERATOR_CHECKLIST.md`](./docs/RELEASE_OPERATOR_CHECKLIST.md).

Run this sequence before shipping demo or production changes:

```bash
npm run verify:release
```

For public-site-only releases, use the dedicated public release path:

```bash
npm run verify:release:public
```

If the backend is running locally, also run:

```bash
npm run smoke:public-ui
npm run smoke:local-demo
npm run smoke:admin
npm run smoke:contact
npm run smoke:rbac
```

For a deployed preview or production frontend, you can also run:

```bash
FRONTEND_URL=https://your-preview-or-production-site npm run smoke:deploy-runtime
```

If you want the script to validate the backend base URL directly as well:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run smoke:deploy-runtime
```

For a deployed contact-flow check that does not create a real inquiry, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site npm run smoke:deploy-contact
```

For one production-safe deploy smoke command that covers the core public routes and contact path together, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run smoke:production
```

For a non-destructive deployed health snapshot with timings, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run report:production-health
```

For one operator-facing production verification pass, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run verify:production
```

Before releasing a deployed contact-flow change, also confirm:

- the backend service has `RECAPTCHA_SECRET_KEY`
- the frontend build has `REACT_APP_RECAPTCHA_SITE_KEY`
- both values come from the same Google reCAPTCHA project
- the Google site key allowlist includes the deployed frontend hostname you are shipping

`smoke:deploy-contact` validates the deployed `/contact` route and then posts a fictional inquiry with an intentionally invalid reCAPTCHA token. The expected result is a `400` JSON response with the reCAPTCHA failure payload, which proves the deployed contact path is wired up without generating a real inquiry.

`smoke:production` combines the deployed public-route shell check with the same-origin API boundary checks and the invalid-token contact probe. It verifies `/`, `/services`, `/projects`, `/contact`, `/api/status`, `/api/auth/me`, and `/api/contact` from the deployed frontend origin, and optionally checks the backend base `/api/status` directly when `BACKEND_URL` is provided.

`report:production-health` is the lighter companion to `smoke:production`: it records status codes and timings for the deployed frontend shell, key public routes, and API boundary. Set `REPORT_JSON=1` if you want the command to also print a JSON payload that can be attached to release notes or incident notes.

`verify:production` runs `smoke:production`, `smoke:deploy-contact`, and `report:production-health` in sequence, so deployed verification can be repeated with one command during release sign-off.

Detailed public release sign-off is documented in [`docs/PUBLIC_RELEASE_CHECKLIST.md`](./docs/PUBLIC_RELEASE_CHECKLIST.md).
Deployed preview sign-off is documented in [`docs/DEPLOY_PREVIEW_VALIDATION.md`](./docs/DEPLOY_PREVIEW_VALIDATION.md).
Use [`docs/RELEASE_OPERATOR_CHECKLIST.md`](./docs/RELEASE_OPERATOR_CHECKLIST.md) for the fastest operator path during deploys.
Use [`docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md`](./docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md) to capture the actual evidence after a preview or production deploy.
Use [`docs/PRODUCTION_HEALTH_REPORT_EXAMPLE.md`](./docs/PRODUCTION_HEALTH_REPORT_EXAMPLE.md) if you need a concrete `REPORT_JSON=1` example for release notes or incident notes.
Use [`docs/PRODUCTION_ALERT_THRESHOLDS.md`](./docs/PRODUCTION_ALERT_THRESHOLDS.md) to decide whether the current smoke/report results should block release or just create follow-up work.

`smoke:local-demo` checks:

- backend `GET /api/status`
- frontend `/`
- frontend `/contact`
- frontend `/login/admin`

It auto-detects the supported local demo ports by app signature and currently prefers the repo's alternate pair (`3101/3102`) before falling back to `3001/3002`. You can override detection with `FRONTEND_URL` and `BACKEND_URL`.

`smoke:admin` logs into the backend using the configured admin credentials and checks:

- authenticated `GET /api/auth/me`
- authenticated `GET /api/admin/kpis`
- authenticated `GET /api/admin/inquiries?limit=5`

`smoke:contact` submits a fictional inquiry payload to `/api/contact` and expects the local demo backend to return a success message.

For a single local demo verification command, run:

```bash
npm run verify:demo
```

The demo verification command now includes a lightweight bundle budget check before the smoke tests:

- main JS bundle must stay at or under `190 kB`
- total built JS output must stay at or under `700 kB`

It also includes a tracked public-asset budget for the files used by the public site:

- no single tracked marketing asset may exceed `1.5 MB`
- tracked public assets total must stay at or under `3.25 MB`

The public release path also checks deployment template/doc consistency for the supported deploy targets:

- Netlify frontend uses `BACKEND_API_URL` plus `REACT_APP_RECAPTCHA_SITE_KEY`
- Render backend uses `RECAPTCHA_SECRET_KEY`, `CORS_ORIGINS`, and the normal server secrets
- Render static frontend uses `REACT_APP_API_URL` plus `REACT_APP_RECAPTCHA_SITE_KEY`

For cleanup work, you can also run:

```bash
npm run report:unused-uploads
```

That report flags large files in `public/Uploads` that are not referenced by the current frontend source, so dead demo assets can be reviewed before they bloat the repo further.

`verify:demo` now starts its own temporary backend on port `3202`, so it does not depend on whichever local backend process is already running. It still expects the frontend demo app to be available on `http://localhost:3101` unless you override `FRONTEND_URL`.

If the default admin login is rejected locally, the smoke script falls back to creating a temporary admin user through the existing admin signup-code flow.
If the local backend process returns non-JSON content for `/api/admin/kpis`, the script logs a warning and still completes the auth + inquiry smoke path.

Manual smoke checklist:

- Admin login succeeds and lands on dashboard
- Public contact form submits successfully
- Inquiry update requires owner and next follow-up date
- Overdue follow-up queue renders and quick actions work
- Mobile nav and dark mode remain readable on public pages

## Deployment

- Frontend: Netlify
- Backend: Render web service
- Use:
  - `render.yaml`
  - `netlify.toml`
  - `DEPLOY_NETLIFY.md`

Set `BACKEND_API_URL` in Netlify to your Render backend URL.
For deployed preview checks, use [`docs/DEPLOY_PREVIEW_VALIDATION.md`](./docs/DEPLOY_PREVIEW_VALIDATION.md).
The Netlify and Render static-frontend builds install devDependencies during the build step because the Vite toolchain lives in the frontend build dependency set.

## Security Notes

- Do not commit real credentials or API keys.
- Rotate any exposed secrets immediately.
- Use strong `SESSION_SECRET` and production cookie settings.
- Configure strict `CORS_ORIGINS` for your deployed frontend domains only.
- Production startup now fails fast if `MONGO_URI`, `SESSION_SECRET`, or `CORS_ORIGINS` are missing.
- Production auth no longer falls back to demo passwords like `1111`; set explicit credential env vars if you still need demo accounts.

## Supporting Docs

- `FILE_MANAGEMENT_GUIDE.md`
- `DARK_MODE_DOCUMENTATION_INDEX.md`
- `UI_IMPROVEMENTS_SUMMARY.md`
- `RELEASE_NOTES_v0.1.0-ui-stabilization.md`
- `SECURITY.md`
- `CONTRIBUTING.md`

## Suggested Portfolio Positioning

For portfolio presentation, frame this as:

- A production-style SMB web platform
- Practical RBAC + operations dashboard implementation
- Full workflow from lead capture to operational handling
- Emphasis on responsive UX, reliability fallback, and deployment-ready setup

## Portfolio Case Studies

Use these sample narratives when presenting the app to future clients:

### 1. Industrial Retrofit Coordination

- Problem: field teams were tracking handoffs and blockers in scattered chats and spreadsheets
- Solution: centralized inquiry ownership, project visibility, and admin follow-up controls
- Impact: faster weekly reporting, fewer missed handoffs, clearer overdue action tracking

### 2. Commercial Contractor Lead Handling

- Problem: inbound opportunities were captured but not consistently qualified or reassigned
- Solution: public contact funnel connected to admin inquiry workflow with owner, priority, and next follow-up date
- Impact: visible qualification pipeline, fewer stale leads, stronger accountability on response timing

### 3. Portfolio-Ready Operations Demo

- Problem: many showcase apps stop at visuals and do not demonstrate operating discipline
- Solution: responsive public pages, role-aware dashboards, inquiry lifecycle controls, KPI cards, and release verification
- Impact: stronger client confidence that the product thinking covers both marketing and internal operations

## Engineering Challenges Solved

- Built role-scoped workspaces with route protection and server-side authorization checks.
- Stabilized client and dashboard navigation across desktop/mobile, including hamburger/sidebar behavior.
- Implemented inquiry lifecycle operations (search, paging, update, delete safety checks, reporting rollups).
- Added resilient data strategy with fallback JSON mode and MongoDB mode for demos and unreliable environments.
- Improved visual consistency with full client dark mode tokenization and page-level overrides.

## Release Checklist

- [x] Live frontend deployed and linked
- [x] Live backend deployed and linked
- [ ] Demo video uploaded
- [x] Screenshot set added to `docs/screenshots`
- [ ] Demo credentials verified
- [ ] Final smoke test on production URLs



