# Production Alert Thresholds

Date baseline: 2026-03-08

These thresholds are intentionally lightweight for the current Netlify frontend + Render backend setup. Use them to decide whether a deploy is approved, approved with follow-up, or blocked.

## 1. Immediate Blockers

Block release approval immediately if any of these happen:

- `npm run smoke:production` fails on any checked route.
- `npm run smoke:deploy-contact` does not return the expected invalid-token `400` JSON path.
- Frontend `/api/status` or backend `/api/status` returns non-JSON, `5xx`, or a proxy-failure HTML page.
- Anonymous frontend `/api/auth/me` does not return `401` JSON.
- The deployed `/contact` route shows a live Google domain mismatch or a missing reCAPTCHA widget.

## 2. Approve With Follow-Up

The deploy can still pass, but create a follow-up ticket if any of these show up:

- `npm run report:production-health` shows any frontend route above `1000ms`.
- Backend `/api/status` is above `2000ms` but still returns `200` JSON.
- The production health report shows warnings but no outright route failures.
- Visual checks pass, but a non-critical metadata or copy issue is found.

## 3. Healthy Baseline

Treat the deploy as healthy when all of these are true:

- `npm run smoke:production` passes.
- `npm run smoke:deploy-contact` passes.
- `npm run report:production-health` shows `0` failures.
- Core frontend routes (`/`, `/services`, `/projects`, `/contact`) are each under `1000ms`.
- Backend `/api/status` is under `2000ms`.

## 4. Evidence Capture

When a threshold is crossed:

- record the exact command output in `docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md`
- note whether the outcome is `approved`, `approved with follow-up`, or `blocked`
- create a follow-up ticket if the issue is not fixed before release sign-off
