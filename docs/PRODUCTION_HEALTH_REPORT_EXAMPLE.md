# Production Health Report JSON Example

Date baseline: 2026-03-08

This is a structurally accurate example of the `REPORT_JSON=1` output from `npm run report:production-health`.

```json
{
  "timestamp": "2026-03-08T11:05:15.514Z",
  "frontendUrl": "https://mastertech4.netlify.app",
  "backendUrl": "https://mastertech-app-32jm.onrender.com",
  "results": [
    {
      "label": "frontend /",
      "url": "https://mastertech4.netlify.app/",
      "ok": true,
      "status": 200,
      "durationMs": 1510,
      "matchesAppShell": true
    },
    {
      "label": "frontend /services",
      "url": "https://mastertech4.netlify.app/services",
      "ok": true,
      "status": 200,
      "durationMs": 1835,
      "matchesAppShell": true
    },
    {
      "label": "frontend /projects",
      "url": "https://mastertech4.netlify.app/projects",
      "ok": true,
      "status": 200,
      "durationMs": 1553,
      "matchesAppShell": true
    },
    {
      "label": "frontend /contact",
      "url": "https://mastertech4.netlify.app/contact",
      "ok": true,
      "status": 200,
      "durationMs": 327,
      "matchesAppShell": true
    },
    {
      "label": "frontend /api/status",
      "url": "https://mastertech4.netlify.app/api/status",
      "ok": true,
      "status": 200,
      "durationMs": 760,
      "json": {
        "usingFallback": false,
        "dbConnected": true,
        "cloudStorageEnabled": true,
        "cloudConvertEnabled": true
      }
    },
    {
      "label": "frontend /api/auth/me",
      "url": "https://mastertech4.netlify.app/api/auth/me",
      "ok": true,
      "status": 401,
      "durationMs": 486,
      "json": {
        "error": "Unauthorized"
      }
    },
    {
      "label": "backend /api/status",
      "url": "https://mastertech-app-32jm.onrender.com/api/status",
      "ok": true,
      "status": 200,
      "durationMs": 509,
      "json": {
        "usingFallback": false,
        "dbConnected": true,
        "cloudStorageEnabled": true,
        "cloudConvertEnabled": true
      }
    }
  ]
}
```

Use this example only as a formatting reference. The exact timings and statuses will change between runs.
