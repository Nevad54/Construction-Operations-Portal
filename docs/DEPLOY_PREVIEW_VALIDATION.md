# Deploy Preview Validation

Date baseline: 2026-03-08

Use this workflow after a successful preview deploy and before approving public-site changes for production.

## 1. Local Prerequisites

Run the public release checks before trusting a preview result:

```bash
npm run verify:release:public
```

If the change also touches backend or admin behavior, run:

```bash
npm run verify:release
```

For a live preview/prod runtime check from your machine, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site npm run smoke:deploy-runtime
```

For a production-safe contact-path probe from your machine, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site npm run smoke:deploy-contact
```

For one deployed smoke command that covers the core public routes plus the contact probe, run:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run smoke:production
```

## 2. Confirm Preview Configuration

Record the exact URLs being checked:

- Frontend preview URL
- Backend URL behind the preview
- Preview date/time

For the standard Netlify + Render deploy path:

- Netlify preview uses `BACKEND_API_URL` to proxy `/api/*` through `netlify/functions/api.js`.
- Do not set `BACKEND_API_URL` with a trailing `/api`.
- Use `REACT_APP_API_URL` only if the frontend is intentionally calling the backend directly instead of the Netlify proxy.
- Render must have `RECAPTCHA_SECRET_KEY`.
- Netlify must have `REACT_APP_RECAPTCHA_SITE_KEY`.
- The Google reCAPTCHA site-key allowlist must include the exact preview hostname being checked.

## 3. Preview Smoke Checks

Check these in the deployed preview:

- `/` renders without missing brand assets or broken layout.
- `/services`, `/projects`, `/contact`, and each `/solutions/*` route load without console-breaking errors.
- `npm run smoke:production` passes for the deployed frontend origin.
- Mobile nav opens and closes at a mobile viewport.
- Theme toggle still works in light mode and dark mode.
- `/api/status` resolves from the preview frontend origin and returns JSON.
- Anonymous `/api/auth/me` resolves from the preview frontend origin and returns `401` JSON instead of HTML or proxy failure content.

## 4. Contact and Metadata Checks

On the preview contact route:

- The live Google reCAPTCHA widget renders instead of the localhost verification card.
- The widget does not show a Google domain mismatch error.
- The submit flow is blocked until reCAPTCHA is completed.
- `npm run smoke:deploy-contact` passes for the deployed frontend origin and returns the expected invalid-token `400` JSON payload from `/api/contact`.

On the preview marketing routes:

- Route titles update away from the shared default.
- Description and social metadata reflect the route being viewed.
- Footer CTA, coverage/contact module, and standards card remain visible.

## 5. Sign-off Record

Capture this before approving the deploy:

- frontend preview URL checked:
- backend URL checked:
- API path mode checked: `Netlify proxy` or `direct API`
- theme coverage checked: `light`, `dark`
- viewport coverage checked: `desktop`, `mobile`
- contact widget checked: `preview reCAPTCHA`
- contact smoke command checked: `yes` or `no`
- metadata checked: `yes` or `no`
- production blockers:
