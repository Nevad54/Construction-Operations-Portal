# Construction Operations Platform

A full-stack construction company web app with a public marketing site, role-based dashboards, project tracking, file management, and contact inquiry operations.

## Demo

- Live app: `https://mastertech4.netlify.app`
- API status endpoint: `https://mastertech-backend.onrender.com/api/status`
- Demo video (2-3 min): `TBD`

## Screenshots

Place screenshots in `docs/screenshots/` using the exact filenames below.

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

- Frontend: React 18, React Router 6, Tailwind CSS, AOS, Font Awesome
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

* **Scheduled exports**: when the backend is running it writes daily CSV files to an `exports/` directory adjacent to the project root. The files include `users.csv`, `inquiries.csv` and `activity_logs.csv` and are regenerated every 24 hours (first run ~30 seconds after start).- Inquiries:
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

You can also run frontend only:

```bash
npm start
```

## Build and Verify

```bash
npm run build
```

Other useful scripts:

- `npm run smoke:rbac` (basic RBAC smoke checks)
- `npm run optimize` (build + bundle analysis)

## Deployment

- Frontend: Netlify
- Backend: Render web service
- Use:
  - `render.yaml`
  - `netlify.toml`
  - `DEPLOY_NETLIFY.md`

Set `BACKEND_API_URL` in Netlify to your Render backend URL.

## Security Notes

- Do not commit real credentials or API keys.
- Rotate any exposed secrets immediately.
- Use strong `SESSION_SECRET` and production cookie settings.
- Configure strict `CORS_ORIGINS` for your deployed frontend domains only.

## Supporting Docs

- `FILE_MANAGEMENT_GUIDE.md`
- `DARK_MODE_DOCUMENTATION_INDEX.md`
- `UI_IMPROVEMENTS_SUMMARY.md`
- `RELEASE_NOTES_v0.1.0-ui-stabilization.md`

## Suggested Portfolio Positioning

For portfolio presentation, frame this as:

- A production-style SMB web platform
- Practical RBAC + operations dashboard implementation
- Full workflow from lead capture to operational handling
- Emphasis on responsive UX, reliability fallback, and deployment-ready setup

## Engineering Challenges Solved

- Built role-scoped workspaces with route protection and server-side authorization checks.
- Stabilized client and dashboard navigation across desktop/mobile, including hamburger/sidebar behavior.
- Implemented inquiry lifecycle operations (search, paging, update, delete safety checks, reporting rollups).
- Added resilient data strategy with fallback JSON mode and MongoDB mode for demos and unreliable environments.
- Improved visual consistency with full client dark mode tokenization and page-level overrides.

## Release Checklist

- [ ] Live frontend deployed and linked
- [ ] Live backend deployed and linked
- [ ] Demo video uploaded
- [ ] Screenshot set added to `docs/screenshots`
- [ ] Demo credentials verified
- [ ] Final smoke test on production URLs
