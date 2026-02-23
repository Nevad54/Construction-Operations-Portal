# v0.1.0-ui-stabilization

Tag: `v0.1.0-ui-stabilization`  
Commit: `07df50e`

## Highlights

- Unified public/client page UX and layout consistency.
- Refined mobile navigation interactions and sidebar behavior.
- Fixed Projects page sidebar conflicts caused by legacy CSS overrides.
- Moved `CoreValues` page to shared `PageLayout` shell.
- Improved repository hygiene by ignoring local tooling directories.

## Notable Changes

- Client/public visual and spacing refresh across key pages.
- Hamburger behavior refined for client pages.
- Projects route now cleanly inherits shared sidebar/header behavior.
- Footer and content structure cleanup for consistency.

## Stability

- Production build succeeds (`npm run build`).
- Local runtime dependency audit in this environment shows no high vulnerabilities (`npm audit --omit=dev --audit-level=high`).

## Upgrade Notes

- No breaking API changes included in this UI stabilization release.
- Recommended post-release validation:
  - Mobile nav open/close on `/`, `/projects`, `/contact`
  - Sidebar overlay and close behavior
  - Spacing/readability on 375px and 430px widths
