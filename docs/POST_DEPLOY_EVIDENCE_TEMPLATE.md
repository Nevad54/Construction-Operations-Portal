# Post-Deploy Evidence Template

Date baseline: 2026-03-08

Use this template right after a production deploy or preview approval. Keep it short and fill in only what you actually checked.

Use [`PRODUCTION_ALERT_THRESHOLDS.md`](./PRODUCTION_ALERT_THRESHOLDS.md) when deciding whether the result is approved, approved with follow-up, or blocked.

## Deploy Context

- deploy date/time:
- deploy environment: `preview` or `production`
- frontend URL:
- backend URL:
- git commit:
- operator:

## Automated Checks

Record the command and whether it passed.

- `npm run verify:release:public`
  - result:
- `FRONTEND_URL=... BACKEND_URL=... npm run smoke:production`
  - result:
- `FRONTEND_URL=... npm run smoke:deploy-contact`
  - result:
- `FRONTEND_URL=... BACKEND_URL=... npm run report:production-health`
  - result:

If useful, paste the health summary lines here:

```text
Summary:
```

## UI Checks

- light mode checked:
- dark mode checked:
- mobile viewport checked:
- desktop viewport checked:
- routes checked:

## Contact and reCAPTCHA

- live widget visible on deployed `/contact`:
- Google domain mismatch visible: `yes` or `no`
- invalid-token contact probe returned expected `400` JSON:
- follow-up notes:

## Metadata and Branding

- route title check:
- meta description check:
- favicon / manifest check:
- footer / header visual check:

## Outcome

- release status: `approved`, `approved with follow-up`, or `blocked`
- blockers:
- follow-up tickets:
- notes:
