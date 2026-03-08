# Release Operator Checklist

Date baseline: 2026-03-08

Use this when you need the shortest production release path.

## 1. Pre-Deploy

- run `npm run verify:release:public`
- confirm the intended `FRONTEND_URL` and `BACKEND_URL`

## 2. Post-Deploy

Run the single deployed verification command:

```bash
FRONTEND_URL=https://your-preview-or-production-site BACKEND_URL=https://your-backend-host npm run verify:production
```

## 3. Record Evidence

- paste the command result into [`POST_DEPLOY_EVIDENCE_TEMPLATE.md`](./POST_DEPLOY_EVIDENCE_TEMPLATE.md)
- use [`PRODUCTION_HEALTH_REPORT_EXAMPLE.md`](./PRODUCTION_HEALTH_REPORT_EXAMPLE.md) if you need a reference shape for `REPORT_JSON=1`
- use [`PRODUCTION_ALERT_THRESHOLDS.md`](./PRODUCTION_ALERT_THRESHOLDS.md) to classify the outcome as `approved`, `approved with follow-up`, or `blocked`

## 4. If Blocked

- do not approve the release
- capture the failing command output
- open the follow-up ticket before rerunning

Use the longer docs only when needed:

- [`DEPLOY_PREVIEW_VALIDATION.md`](./DEPLOY_PREVIEW_VALIDATION.md)
- [`PUBLIC_RELEASE_CHECKLIST.md`](./PUBLIC_RELEASE_CHECKLIST.md)
