# Mastertech App

A full-stack construction company web app with a public marketing site, role-based dashboards, project tracking, file management, and contact inquiry operations.

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
