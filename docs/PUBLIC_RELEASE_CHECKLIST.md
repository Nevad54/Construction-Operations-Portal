# Public Release Checklist

Date baseline: 2026-03-08

Use this checklist before shipping public-site changes that affect marketing routes, shared layout, projects discovery, contact flow, or deployment metadata.

## 1. Automated Verification

Run these commands first:

```bash
npm run verify:release:public
```

If the change touches the backend or admin workflows, also run:

```bash
npm run verify:release
```

If a local backend is available, run the local smoke set:

```bash
npm run smoke:local-demo
npm run smoke:admin
npm run smoke:contact
npm run smoke:rbac
```

## 2. Public UI Checks

Confirm these still hold:

- Home, about, services, contact, projects, and all `/solutions/*` routes render in light mode and dark mode.
- Mobile nav opens and closes cleanly.
- Shared footer CTA, coverage module, and standards card remain visible.
- Solution landing pages keep the secondary CTA readable in light mode.
- Projects route handles empty, filtered-empty, and single-status-bucket states clearly.
- Contact route shows the localhost verification path only on local development hosts.

## 3. Contact and reCAPTCHA Checks

For local development:

- `localhost` uses the local verification control, not the live Google widget.
- The submit button stays locked until local verification is completed.

For deployed preview or production:

- The frontend has `REACT_APP_RECAPTCHA_SITE_KEY`.
- The backend has `RECAPTCHA_SECRET_KEY`.
- Both keys come from the same Google reCAPTCHA project.
- The Google site-key allowlist includes the deployed frontend hostname being released.
- The deployed contact page does not show a Google domain error inside the widget.
- `FRONTEND_URL=https://your-preview-or-production-site npm run smoke:deploy-contact` passes and returns the expected invalid-token rejection path.

## 4. Metadata and Brand Checks

Confirm these on the released build:

- Route-level page titles update away from the shared default.
- Meta description, `og:title`, `og:description`, `twitter:title`, and `twitter:description` reflect the current route.
- Favicon, manifest, and base branding still resolve correctly.

## 5. Deployment Notes

Render / backend:

- `RECAPTCHA_SECRET_KEY` is present in the backend service env.
- `CORS_ORIGINS` includes the frontend hostname being shipped.

Netlify / frontend:

- `BACKEND_API_URL` points to the intended backend when using the standard Netlify proxy deploy.
- `REACT_APP_API_URL` is set only if the frontend is intentionally calling the backend directly.
- `REACT_APP_RECAPTCHA_SITE_KEY` matches the backend secret project.

## 6. Manual Sign-off

Before release, record:

- frontend URL checked
- backend URL checked
- theme coverage checked: `light`, `dark`
- viewport coverage checked: `desktop`, `mobile`
- contact flow checked: `local`, `preview`, or `production`

For deployed preview sign-off, use [`docs/DEPLOY_PREVIEW_VALIDATION.md`](./DEPLOY_PREVIEW_VALIDATION.md).
