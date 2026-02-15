# Deploy (Netlify Frontend + Render Backend)

This app is a React SPA + Node/Express backend. Netlify hosts the frontend, and a hosted Node server (Render) runs the backend API + MongoDB + Cloudinary.

Important: the Netlify redirect `"/api/*" -> "/.netlify/functions/api/:splat"` is intentional. The Netlify Function `netlify/functions/api.js` proxies all `/api/...` requests to your backend when `BACKEND_API_URL` is set, which keeps auth cookies first-party (same site).

## 1) Deploy Backend on Render

1. Create a new Render **Web Service** from your repo.
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
3. Environment variables (Render dashboard):
   - `NODE_ENV=production`
   - `MONGO_URI=...` (MongoDB Atlas connection string)
   - `SESSION_SECRET=...` (any long random string)
   - `ADMIN_USER=admin` (optional)
   - `ADMIN_PASS=1111` (optional, change it)
   - `EMP_USER=employee` (optional)
   - `EMP_PASS=1111` (optional, change it)
   - `CLIENT_USER=client` (optional)
   - `CLIENT_PASS=1111` (optional, change it)
   - `CORS_ORIGINS=https://YOUR_NETLIFY_SITE.netlify.app`
   - Cloudinary:
     - `CLOUDINARY_CLOUD_NAME=...`
     - `CLOUDINARY_API_KEY=...`
     - `CLOUDINARY_API_SECRET=...`
   - CloudConvert (Office preview):
     - `CLOUDCONVERT_API_KEY=...`

After deploy, copy your backend base URL, for example:
`https://mastertech-backend.onrender.com`

## 2) Deploy Frontend on Netlify

1. Netlify: **Add new site** -> **Import an existing project**.
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
3. Environment variables (Netlify Site settings -> Environment variables):
   - `BACKEND_API_URL=https://YOUR_RENDER_BACKEND_URL`
     - Example: `https://mastertech-backend.onrender.com`
     - Do not include `/api` at the end.

Deploy the site.

## 3) Verify Production

Open the deployed Netlify site and verify:

1. Login works (admin + user).
2. `GET /api/status` returns JSON (open it in the browser).
3. File management:
   - Upload works
   - Preview works (PDF, images)
   - Office preview conversion works if `CLOUDCONVERT_API_KEY` is set

## Common Issues

- If login works locally but not on Netlify:
  - Confirm Netlify env var `BACKEND_API_URL` is set.
  - Confirm Render env var `CORS_ORIGINS` contains your Netlify site URL.
  - Confirm backend is reachable directly at `https://.../api/status`.

