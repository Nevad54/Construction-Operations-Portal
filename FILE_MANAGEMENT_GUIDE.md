# File Management System (Admin + User + Client)

This app includes a role-based file management system (Google-Drive style UI) with cloud-backed uploads and secure access enforcement.

## Routes

- Admin file management: `/admin/dashboard/files`
- User (employee) file management: `/user/dashboard/files` (and/or `/user/files` depending on navigation)
- Client file viewer: `/client/files` (view-only)

## Roles (RBAC)

- `admin`
  - Full access to all files/folders
  - Can upload, create folders, rename/update metadata, delete
  - Can view activity logs (if enabled in UI)
- `user` (employee)
  - Can upload and manage their own files
  - Can see team/client shared items based on `visibility`
  - Limited delete depending on UI rules
- `client`
  - View/download only
  - Only sees items with `visibility: "client"` (and any future project assignment rules)

## Data Model (FileItem)

Stored fields include:

- `originalName`, `storedName`
- `path` (local `/uploads/...` or cloud URL)
- `mimeType`, `size`
- `ownerId`
- `visibility`: `private | team | client`
- `folder` (string path like `Site-A/Permits`)
- `projectId` (reserved for future project scoping)
- `tags[]`, `notes`
- `cloudProvider`, `cloudPublicId` (when cloud-backed)

Backend model: `backend/models/FileItem.js`

## Backend API (Local Express)

Base URL:

- Local: `http://localhost:3002/api`
- CRA dev proxy: frontend calls `/api/...` (see `package.json` `proxy`)

Key endpoints:

- `POST /auth/login` (creates session)
- `GET /auth/me` (returns current session user)
- `POST /files` (upload)
- `GET /files` (list, role-filtered)
- `PUT /files/:id` (metadata update)
- `DELETE /files/:id` (delete)
- `GET /files/:id/view` (open/preview via signed redirect when needed)
- `GET /folders` (folder list derived from records + standalone folder store)
- `POST /folders` (create folder)
- `POST /folders/move`, `POST /folders/copy`
- `POST /files/bulk-move`, `POST /files/bulk-copy`

Status/health:

- `GET /api/status` returns `{ usingFallback, dbConnected, cloudStorageEnabled, cloudConvertEnabled }`

## Cloud Storage (Cloudinary)

When Cloudinary env vars are present, uploads are stored in Cloudinary (memory upload -> cloud). When absent, uploads are stored on local disk (`backend/uploads/`).

Required env vars (do not commit values):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Implementation: `backend/server.js` (`uploadFileToCloud`)

### Why `/api/files/:id/view` exists

In this project's Cloudinary account settings, direct delivery URLs (`uploaded.secure_url`) can return `401`, which breaks browser preview/iframe usage.

Fix: `GET /api/files/:id/view`

- If the file is Cloudinary-backed, the backend generates a signed `private_download_url(...)` and `302` redirects the browser to the signed URL.
- If the file is local, it serves the file from disk.
- Optional query: `?download=1` forces a download.

Frontend uses this automatically for Cloudinary files via `resolveFileUrl(...)` in `src/components/files/FileManager.jsx`.

## Office Docs Preview (CloudConvert)

For Word/Excel/PowerPoint preview inside the app, the backend can convert Office docs to PDF using CloudConvert.

Required env var (do not commit value):

- `CLOUDCONVERT_API_KEY`

Endpoint:

- `POST /api/files/:id/preview` -> `{ url }`

Notes:

- The returned URL is typically temporary (CloudConvert export URL).
- The backend caches it on the file record (`previewUrl`, `previewExpiresAt`) to avoid reconverting repeatedly.

## Frontend (React + Tailwind)

Core component:

- `src/components/files/FileManager.jsx`

It supports:

- Grid/list views
- Folder navigation (breadcrumb/back)
- Search/filter/sort
- Drag + drop upload and drag-to-folder moves (where enabled)
- Context menu (right-click / 3-dot menu)
- Full-screen Preview modal

### Preview Modal Controls

- Next/Prev buttons in header
- Zoom (PDF/images/text): 50% to 300%
- Details sidebar (desktop): toggle with `Details`

Keyboard shortcuts (while preview open):

- `Left Arrow` / `Right Arrow`: previous/next
- `+` / `-`: zoom in/out
- `0`: reset zoom
- `D`: toggle details panel

## Local Development Setup

Env:

- `.env` (backend secrets and settings)
- `.env.development` (frontend API base)
  - `REACT_APP_API_URL=http://localhost:3002`

Run:

```bash
npm run start:backend
npm start
```

or

```bash
npm run dev
```

## Troubleshooting

- Admin/user can’t login:
  - Confirm backend is up: `http://localhost:3002/api/status`
  - Confirm session: `http://localhost:3002/api/auth/me` after login
- Upload works but preview fails:
  - If the file is Cloudinary-backed, preview must use `/api/files/:id/view`
  - Confirm the file record has `cloudProvider: "cloudinary"` and `cloudPublicId`
- If DB is down:
  - Backend can switch to file-based fallback (`usingFallback: true` in `/api/status`)

## Deployment (Netlify Frontend + Backend Host)

This repo's Netlify Function (`backend/netlify/functions/api.js`) does not implement the full `/api/files` system.
For production, the simplest setup is:

1. Deploy the frontend to Netlify.
2. Deploy the backend (`backend/server.js`) to a Node host (Render is already supported via `render.yaml`).
3. In Netlify environment variables, set:
   - `REACT_APP_API_URL=https://YOUR_BACKEND_HOST` (no trailing `/api`)

Why: the frontend picks the API prefix from `REACT_APP_API_URL`. If it is not set on Netlify, it will call
`/.netlify/functions/api/...` which will not have the file endpoints.
