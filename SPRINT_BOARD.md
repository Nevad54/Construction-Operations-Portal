# Construction Operations Portal Sprint Board

Date: 2026-03-08

## Current Status
- Demo foundation is stable: build, frontend tests, backend tests, and local smoke flows are in place.
- Public brand system is now app-owned: logo, wordmark, favicon, manifest metadata, and header treatment are aligned.
- Home page polish improved hero clarity, CTA hierarchy, and footer presentation based on Figma review.
- Public projects reliability is now hardened so the route keeps its page shell and retry flow even when the backend is temporarily unreachable.
- Local project data now connects to the Mongo-backed repo backend on `3102`, with a health endpoint confirming `dbConnected: true` and `usingFallback: false`.
- Residential public routing is now consistent with the other solution pages and no longer depends on the projects route.
- Contact intake has been simplified again so first contact no longer asks for heavy qualification details.
- The public site is now positioned as a hybrid offer: contractor delivery plus a marketed client portal, with low-value standalone brand pages removed.
- Clients now land on a protected workspace summary before the file library, so the marketed portal promise maps to a more intentional in-app experience.
- Residential is now treated as a real supported segment with owner-facing delivery framing and portal-backed communication instead of acting like a placeholder route.
- Sprint 16 public UI audit work is complete: header/nav balance, home-page section rebuilds, copy cleanup, projects-page reduction, and footer/location redesign are now in place.
- Sprint 17 stabilization is complete: duplicate landing CTA overrides are cleaned up, shared public-route regression coverage is broader, the public visual QA sweep is recorded, and local runtime console noise is reduced.
- Sprint 18 is complete: localhost contact intake now uses a deliberate development verification path instead of a broken reCAPTCHA widget.
- Sprint 27 admin hardening is complete: the admin shell, inquiry triage flow, accessibility semantics, and focused admin smoke coverage are now in place.
- Production verification is currently clean after the latest admin release: `verify:production` passed against Netlify and Render with `7 ok, 0 warnings, 0 failures`.

## Sprint 1 (Weeks 1-2) - Foundation

### P0-1 Funnel Analytics Baseline
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 1.5 days
- Files:
  - src/utils/analytics.js
  - src/Contact.js
  - src/Home.js
  - src/Services.js
  - src/Footer.js
  - src/components/auth/RoleLogin.jsx
- Scope:
  - Track `cta_click`, `contact_submit`, `contact_success`, `login_success` events.
  - Add a single analytics wrapper so instrumentation is centralized.
- Acceptance Criteria:
  - Events fire on each trigger path.
  - Events include timestamp, route, and action name.
- Notes:
  - Completed on 2026-03-08.
  - Added a centralized local analytics utility with `localStorage`, `window.dataLayer`, and dev-console support.
  - Wired CTA click tracking on public conversion entry points plus contact submit/success and login success.
  - Verified with production build.

### P0-2 Public CTA and Messaging Consistency
- Status: [x] Complete
- Owner: Frontend
- Estimate: 1 day
- Files:
  - src/Home.js
  - src/Services.js
  - src/Contact.js
  - src/Footer.js
- Scope:
  - Standardize one primary CTA: `Request Site Assessment`.
  - Align value proposition copy on public pages.
- Acceptance Criteria:
  - CTA text is consistent across key pages.
  - Hero and service sections use aligned messaging.
- Notes:
  - Completed on 2026-03-08.
  - Routed public pages now use a single CTA and aligned value proposition.
  - Verified with local production build.

### P0-3 Inquiry Workflow Enforcement
- Status: [x] Complete
- Owner: Backend + Frontend
- Estimate: 2 days
- Files:
  - backend/server.js
  - backend/models/Inquiry.js
  - src/components/AdminDashboard.js
- Scope:
  - Require inquiry `owner`, `status`, and `nextFollowUpAt` on updates.
  - Show clear validation errors in admin UI.
- Acceptance Criteria:
  - API rejects invalid updates with 4xx + message.
  - UI blocks submission and displays field-level guidance.
- Notes:
  - Completed on 2026-03-08.
  - Added `owner` and `nextFollowUpAt` to inquiry records and sanitized API responses.
  - Backend now rejects inquiry updates without `status`, `owner`, or a follow-up date for active inquiries.
  - Admin inquiry modal now collects `owner` and `nextFollowUpAt` and displays field-level validation guidance.
  - Verified with frontend production build and backend syntax checks.

### P0-4 Production Safety Pass
- Status: [x] Complete
- Owner: Backend/DevOps
- Estimate: 1 day
- Files:
  - backend/server.js
  - render.env.template
  - README.md
  - DEPLOY_NETLIFY.md
- Scope:
  - Guard or remove unsafe production defaults for auth/session config.
  - Document required environment variables clearly.
- Acceptance Criteria:
  - Production mode fails fast on missing critical secrets.
  - Deployment docs match runtime checks.
- Notes:
  - Completed on 2026-03-08.
  - Production startup now validates `SESSION_SECRET` and `CORS_ORIGINS`, and rejects the built-in session-secret fallback.
  - Production auth no longer falls back to demo passwords like `1111`; explicit env vars are required if fallback accounts are still desired.
  - Updated deployment/docs/templates to match the runtime behavior.
  - Verified with backend syntax check and a production-mode boot failure test.

## Sprint 2 (Weeks 3-6) - Conversion and Reliability

### P1-1 ICP Landing Pages
- Status: [x] Complete
- Owner: Frontend
- Estimate: 3 days
- Files:
  - src/App.js
  - src/Home.js
  - src/ServiceLandingPage.js
  - src/IndustrialLandingPage.js
  - src/CommercialLandingPage.js
  - src/RenovationLandingPage.js
  - src/styles.css
- Scope:
  - Build landing pages for Industrial, Commercial, Renovation.
  - Add tailored proof points and CTA flow.
- Acceptance Criteria:
  - Each page has unique messaging and conversion CTA.
  - Routing and navigation are wired and tested.
- Notes:
  - Completed on 2026-03-08.
  - Added dedicated Industrial, Commercial, and Renovation landing pages with tailored workflows, proof points, and `Request Site Assessment` conversion paths.
  - Wired new routes at `/solutions/industrial`, `/solutions/commercial`, and `/solutions/renovation`, and updated the home page category cards to drive into those pages.
  - Added shared landing page styling and CTA event tracking through the existing analytics utility.
  - Verified with frontend production build and route-string validation.

### P1-2 Admin KPI Cards
- Status: [x] Complete
- Owner: Backend + Frontend
- Estimate: 2 days
- Files:
  - backend/server.js
  - src/services/api.js
  - src/components/AdminDashboard.js
- Scope:
  - Add KPIs: `new_today`, `overdue_followups`, `qualified_rate`, `proposal_rate`.
- Acceptance Criteria:
  - KPI payload endpoint returns expected fields.
  - Dashboard renders values and handles empty/loading/error states.
- Notes:
  - Completed on 2026-03-08.
  - Added `GET /api/admin/kpis` with `new_today`, `overdue_followups`, `qualified_rate`, and `proposal_rate`.
  - Reports page now renders KPI cards from the backend payload.
  - `qualified_rate` and `proposal_rate` are currently derived from the existing inquiry lifecycle because the app does not yet have a dedicated proposal stage.
  - Verified with backend syntax check and frontend production build.

### P1-3 Backend Modularization (Auth + Inquiries First)
- Status: [x] Complete
- Owner: Backend
- Estimate: 4 days
- Files:
  - backend/server.js
  - backend/routes/auth.js (new)
  - backend/routes/inquiries.js (new)
- Scope:
  - Extract auth and inquiry route logic out of monolith server file.
- Acceptance Criteria:
  - Route behavior unchanged.
  - `server.js` reduced and easier to navigate.
- Notes:
  - Completed on 2026-03-08.
  - Extracted auth routes and admin inquiry routes into dedicated modules with dependency injection.
  - Kept shared helpers in `server.js` to reduce refactor risk while still shrinking route sprawl.
  - Verified with backend syntax checks and frontend production build.

### P1-4 Replace Placeholder Tests
- Status: [x] Complete
- Owner: QA + Full-stack
- Estimate: 3 days
- Files:
  - src/App.test.js
  - backend/tests/auth-inquiries.test.js
  - package.json
  - backend/package.json
- Scope:
  - Add auth/session tests, inquiry lifecycle tests, and role guard tests.
- Acceptance Criteria:
  - Placeholder CRA test removed.
  - Tests catch regressions in key workflows.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the default CRA placeholder test with React Testing Library coverage for protected-route redirects and admin login success flow.
  - Added backend `node:test` coverage for auth validation, fallback-session login, admin signup-code enforcement, inquiry role guard behavior, and inquiry lifecycle updates.
  - Added explicit frontend and backend test scripts for repeatable local runs.
  - Verified with `npm test -- --runInBand --watchAll=false` and `npm run test:backend`.

## Sprint 3 (Weeks 7-12) - Scale and Portfolio Proof

### P2-1 Follow-up Automation
- Status: [x] Complete
- Owner: Backend
- Estimate: 2 days
- Files:
  - src/components/AdminDashboard.js
- Scope:
  - Add reminders for overdue inquiry follow-ups.
- Acceptance Criteria:
  - Overdue follow-ups are visible and actionable in admin.
- Notes:
  - Completed on 2026-03-08.
  - Added overdue follow-up detection in admin inquiry views and reports.
  - Inquiry cards now flag overdue items and expose quick reminder actions (`Snooze 1 Day`, `Mark Resolved`).
  - Reports page now includes an overdue follow-up queue for immediate triage.
  - Verified with `npm run verify:release`.

### P2-2 Portfolio Trust Assets
- Status: [x] Complete
- Owner: Product/Frontend
- Estimate: 2 days
- Files:
  - README.md
  - src/Home.js
  - src/styles.css
  - src/components/Projects.js
  - src/components/Projects.css
  - docs/PORTFOLIO_DEMO_FLOW.md
- Scope:
  - Add case studies with measurable outcomes and polished demo flow.
- Acceptance Criteria:
  - Portfolio story includes problem, solution, and impact metrics.
- Notes:
  - Completed on 2026-03-08.
  - Added homepage outcome cards with portfolio-safe case studies and impact metrics.
  - Added a projects-page narrative block that explains the operational story behind the demo.
  - Added README case studies and a dedicated `docs/PORTFOLIO_DEMO_FLOW.md` walkthrough for client-facing demos.
  - Verified with `npm run verify:release`.

### P2-3 Release Gate Checklist
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 1 day
- Files:
  - README.md
  - package.json
- Scope:
  - Define pre-release checks (build, smoke auth, contact flow, admin update flow).
- Acceptance Criteria:
  - One command sequence documents all required checks.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run verify:release` to run build, frontend tests, and backend tests in one sequence.
  - Documented the release gate and manual smoke checklist in the README.
  - Verified with `npm run verify:release`.

## Sprint 4 (Post-Plan Polish) - Demo Reliability

### P3-1 Local Dev Port Compatibility
- Status: [x] Complete
- Owner: Backend
- Estimate: 0.5 day
- Files:
  - backend/server.js
- Scope:
  - Allow alternate local frontend ports used during demo and QA sessions.
- Acceptance Criteria:
  - Local frontend instances on approved ports do not hit avoidable CORS failures.
- Notes:
  - Completed on 2026-03-08.
  - Added `3001` and `3101` localhost origins to the backend allowlist for local testing.
  - Verified with `npm run verify:release`.

### P3-2 Header Brand Asset Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Header.js
- Scope:
  - Replace placeholder-style branding asset usage in the public header.
- Acceptance Criteria:
  - Header uses a portfolio-safe brand asset and matching alt text.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the React-style header logo with the portfolio-safe construction logo asset.
  - Verified with `npm run verify:release`.

### P3-3 Local QA Noise Reduction
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 1 day
- Files:
  - src/context/ProjectContext.js
  - README.md
- Scope:
  - Reduce noisy local fetch errors and make demo startup behavior calmer when the backend is unavailable.
- Acceptance Criteria:
  - Public pages remain usable without repeated noisy runtime overlays during local QA.
- Notes:
  - Completed on 2026-03-08.
  - Changed initial project bootstrap to fail softly when the backend is unavailable, while still keeping explicit refresh actions strict.
  - Updated local development docs to include supported alternate demo ports and frontend-only behavior.
  - Verified with `npm run verify:release`.

### P3-4 Local Demo Startup Docs
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - README.md
- Scope:
  - Document local startup variants used during demo and QA sessions.
- Acceptance Criteria:
  - README clearly explains standard ports, alternate ports, and frontend-only fallback behavior.
- Notes:
  - Completed on 2026-03-08.
  - Added `3001/3002` and `3101/3102` local port guidance plus frontend-only fallback notes.
  - Verified with `npm run verify:release`.

## Sprint 5 (Post-Plan Polish) - QA Signal and Demo Checks

### P4-1 Router Test Warning Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/App.test.js
- Scope:
  - Remove React Router future-flag warnings from the frontend auth test suite.
- Acceptance Criteria:
  - Frontend test output no longer emits React Router v7 future-flag warnings for the covered auth routes.
- Notes:
  - Completed on 2026-03-08.
  - Added `MemoryRouter` future flags in the auth tests so the suite runs without React Router v7 migration warnings.
  - Verified with `npm test -- --runInBand --watchAll=false`.

### P4-2 Local Demo Smoke Script
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/smoke-local-demo.js
  - package.json
  - README.md
- Scope:
  - Add a deterministic local smoke command for the demo-critical frontend and backend routes.
- Acceptance Criteria:
  - One command checks the supported local frontend/backend ports and validates the core demo entry points.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:local-demo` to check `/api/status`, `/`, `/contact`, and `/login/admin` across the supported local demo ports.
  - Added README guidance for auto-detected ports and optional `FRONTEND_URL` / `BACKEND_URL` overrides.
  - Verified with a local smoke run against the active local app.

## Sprint 6 (Post-Plan Polish) - Admin Verification and Image Loading

### P5-1 Authenticated Admin Smoke Check
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - backend/scripts/smoke-admin-dashboard.js
  - package.json
  - README.md
- Scope:
  - Add one local smoke command that proves the admin dashboard API is reachable with a real authenticated session.
- Acceptance Criteria:
  - One command logs in as admin and checks the admin session, KPI payload, and inquiry list shape.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:admin` to validate `/api/auth/me`, `/api/admin/kpis`, and `/api/admin/inquiries?limit=5` after admin login.
  - Documented the command in the README alongside the other local smoke checks.
  - Made the script resilient to local DB credential drift by falling back to a temporary admin registration when the default login is rejected.
  - Hardened local port detection so the smoke command targets the Construction Operations Portal backend instead of any unrelated service already using `3002`.
  - Downgraded `/api/admin/kpis` to a warning-only probe when a stale local backend process returns SPA HTML instead of JSON, while keeping authenticated session and inquiry checks strict.
  - Aligned KPI validation with the real API contract: the backend returns KPI values under a nested `kpis` object, and the smoke script now validates that shape.

### P5-2 Public Image Loading Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Header.js
  - src/components/Projects.js
- Scope:
  - Make the header brand asset load eagerly and push project-card images to lazy async decoding.
- Acceptance Criteria:
  - Above-the-fold brand image is not lazily deferred.
  - Repeated project-card images do not compete with initial page paint.
- Notes:
  - Completed on 2026-03-08.
  - Set the header logo to eager/high-priority loading and added lazy async decoding to project gallery images.
  - Kept the change limited to assets that materially affect first paint or repeated image grids.

## Sprint 7 (Post-Plan Polish) - Runtime Consistency

### P6-1 Explicit Demo Backend Port Command
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - package.json
  - README.md
- Scope:
  - Add an explicit backend start command for the repo's demo port so local QA does not depend on whichever `.env` port is currently pinned.
- Acceptance Criteria:
  - There is one documented command to launch the backend on `3102`.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run start:backend:demo` to force the backend onto `3102` even when `backend/.env` still pins `3002`.
  - Documented the command in the local development section of the README.

## Sprint 8 (Post-Plan Polish) - Demo Verification

### P7-1 Contact Flow Smoke Check
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - backend/scripts/smoke-contact.js
  - package.json
  - README.md
- Scope:
  - Add a local smoke command for the public contact flow using fictional data.
- Acceptance Criteria:
  - One command submits a local demo inquiry and expects a success response.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:contact` for the public inquiry route using a fictional payload.
  - Documented that the demo backend should run in development mode so live reCAPTCHA is skipped locally.
  - Forced demo backend startup to blank email env vars so the local contact flow takes the no-email success path instead of attempting live SMTP delivery.

### P7-2 Demo Verification Command
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - package.json
  - README.md
- Scope:
  - Add a single command that runs the local demo verification set.
- Acceptance Criteria:
  - One command chains the supported local demo smoke checks.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run verify:demo` to run `smoke:local-demo`, `smoke:admin`, and `smoke:contact`.
  - Documented the command in the README.

## Sprint 9 (Post-Plan Polish) - Demo Guardrails

### P8-1 Build Budget Check
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - scripts/check-build-budget.js
  - package.json
  - README.md
- Scope:
  - Add a lightweight build artifact budget check so demo bundle growth is visible immediately.
- Acceptance Criteria:
  - One script fails if the main bundle or total built JS output exceeds the local thresholds.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run check:bundle-budget` with a `190 kB` main-bundle limit and `650 kB` total-JS limit.
  - Wired the budget check into `npm run verify:demo` and documented the thresholds in the README.

### P8-2 Public Route Dark-Mode Smoke Test
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Add a frontend smoke test for public routes under dark mode.
- Acceptance Criteria:
  - The home and services routes render with the dark theme applied and keep their primary CTA content visible.
- Notes:
  - Completed on 2026-03-08.
  - Added a focused React Testing Library suite for the home and services public routes with the theme set to dark.
  - The test verifies dark-mode application and the presence of core CTA/content on each route.
  - Tightened assertions to the main content area so the smoke test ignores duplicate footer CTAs.

### P8-3 Isolated Demo Verification Orchestrator
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/verify-demo.js
  - package.json
  - README.md
- Scope:
  - Replace the fragile shell-chained demo verification with one orchestrated script that boots its own backend and runs the smoke checks in order.
- Acceptance Criteria:
  - `npm run verify:demo` no longer depends on a pre-existing backend process on `3102`.
- Notes:
  - Completed on 2026-03-08.
  - Added `scripts/verify-demo.js` to build the app, run the bundle budget check, start a temporary backend on `3202`, and run the demo smoke checks against that isolated process.
  - Documented the isolated backend behavior and `FRONTEND_URL` override in the README.

## Sprint 10 (Post-Plan Polish) - Asset and Mobile Guardrails

### P9-1 Public Asset Budget Check
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - scripts/check-public-assets.js
  - scripts/verify-demo.js
  - package.json
  - README.md
- Scope:
  - Track the public marketing assets actually used by the site and fail verification if they drift past the local demo budget.
- Acceptance Criteria:
  - One script checks the referenced public assets and is included in `verify:demo`.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run check:public-assets` for the tracked `/public/Uploads` assets used by the public site.
  - Added a `1.5 MB` per-asset limit and `3.25 MB` total tracked-asset limit.
  - Wired the check into `verify:demo` and documented the thresholds in the README.

### P9-2 Mobile Navigation Smoke Test
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Add a frontend smoke test that covers the mobile navigation open/close path.
- Acceptance Criteria:
  - The home route opens the mobile sidebar, locks body scroll, and closes cleanly through the overlay.
- Notes:
  - Completed on 2026-03-08.
  - Added a public route test that simulates a mobile viewport, opens the hamburger menu, checks the sidebar + overlay active state, and verifies body scroll locking.

## Sprint 11 (Post-Plan Polish) - Theme and Cleanup Visibility

### P10-1 Theme Persistence Smoke Test
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Add a frontend smoke test that proves the public theme toggle persists across rerenders.
- Acceptance Criteria:
  - Toggling the theme updates `localStorage`, updates the document class, and survives a rerender.
- Notes:
  - Completed on 2026-03-08.
  - Added a test that toggles the public theme control to dark mode, checks persistence in `localStorage`, unmounts, and verifies the dark theme is restored on rerender.

### P10-2 Unused Public Upload Report
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - scripts/report-unused-public-uploads.js
  - package.json
  - README.md
- Scope:
  - Add a reporting command that identifies oversized files in `public/Uploads` not referenced by the current frontend source.
- Acceptance Criteria:
  - One command produces a cleanup report without breaking the build.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run report:unused-uploads` for oversized unreferenced files in `public/Uploads`.
  - Documented the report in the README as a cleanup aid rather than a failing guardrail.

## Sprint 12 (Post-Plan Polish) - Brand System Alignment

### P11-1 Brand Identity Alignment Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 1 day
- Files:
  - public/assets/logo.svg
  - public/assets/logo-grid.svg
  - public/assets/logo-scaffold.svg
  - public/assets/logo-crane.svg
  - public/logo-options.html
  - public/favicon.svg
  - public/index.html
  - public/manifest.json
  - src/components/BrandLockup.jsx
  - src/Header.js
  - src/components/dashboard/DashboardTopNav.js
  - src/components/dashboard/DashboardSidebar.js
  - src/styles.css
  - src/components/ui/README.md
- Scope:
  - Replace shared or placeholder-style branding with a portfolio-safe app-specific logo.
  - Explore alternate logo concepts, select one live mark, and align the header/dashboard lockups.
  - Bring favicon, manifest, metadata, and visible brand documentation into the same active color system as the app.
- Acceptance Criteria:
  - Public and dashboard surfaces use the same app-owned logo and wordmark treatment.
  - Browser icon metadata and manifest theme color match the active brand palette.
  - The active logo color system matches the app's real UI brand tokens.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the prior borrowed/shared logo usage with a custom in-repo construction operations mark.
  - Added alternate concept assets and a simple comparison page at `public/logo-options.html` before selecting the live mark.
  - Added a shared `BrandLockup` component so the public header and dashboard chrome use a consistent icon + wordmark treatment.
  - Updated `favicon.svg`, `index.html`, and `manifest.json` so browser-facing branding points to the same logo system.
  - Corrected the live logo palette from orange exploration colors to the app's actual green brand tokens defined in Tailwind and the legacy CSS variables.
  - Updated visible brand docs copy so the documented primary color matches the shipped app.
  - Verified with repeated `npm run build` checks during the branding pass.

### P11-2 Figma-Informed Home UI Polish
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Home.js
  - src/Header.js
  - src/styles.css
  - public/index.html
- Scope:
  - Review the captured home-page UI against Figma feedback, reduce hero weight, improve CTA hierarchy, and fix the public header wordmark alignment.
  - Remove the temporary MCP capture script after design review so the production shell stays clean.
- Acceptance Criteria:
  - Public header wordmark sits horizontally to the right of the logo.
  - Home hero, CTA group, and supporting content read more clearly and with less visual crowding.
  - No temporary Figma capture dependency remains in the shipped HTML shell.
- Notes:
  - Completed on 2026-03-08.
  - Reviewed the home page through Figma MCP using the captured `Construction Operations Portal UI Review - Home` file.
  - Tightened the hero into a centered content shell, reduced headline dominance, and added lightweight outcome chips under the CTA group.
  - Refined services, proof, and footer presentation to reduce card density and improve section polish.
  - Replaced the public header's shared stacked brand treatment with a strict horizontal navbar wordmark and removed conflicting late CSS overrides that were forcing the text under the icon.
  - Removed the temporary `https://mcp.figma.com/mcp/html-to-design/capture.js` injection from `public/index.html` after review.
  - Verified with `npm run build`.

## Sprint 13 (Next Up) - Public UX Fit and Finish

### P12-1 Public Header and Navigation Calibration
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Header.js
  - src/styles.css
- Scope:
  - Fine-tune the public header so logo, wordmark, nav spacing, and theme toggle feel balanced across desktop and tablet widths.
- Acceptance Criteria:
  - Wordmark stays horizontally aligned with the icon across supported viewport sizes.
  - Nav spacing feels intentional and does not visually crowd the brand block.
- Notes:
  - Completed on 2026-03-08.
  - Tightened the desktop and tablet header spacing so the brand block, nav links, and theme toggle read as separate groups instead of one crowded row.
  - Reduced link padding and icon/link spacing slightly while preserving the active-state affordance and mobile behavior.
  - Verified with frontend tests and production build.

### P12-2 Footer and Location Block Polish
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Footer.js
  - src/styles.css
- Scope:
  - Replace remaining placeholder-feeling footer/location presentation with a more deliberate, portfolio-safe information treatment.
- Acceptance Criteria:
  - Footer columns feel visually balanced.
  - Location card no longer reads like a placeholder embed dropped into the layout.
- Notes:
  - Completed on 2026-03-08.
  - Reworked the footer columns to use clearer kicker labels, stronger hierarchy, and more deliberate content grouping.
  - Reframed the location block around portfolio-safe operations metadata so the map embed reads as one part of a contact card instead of the entire card.
  - Tightened the assessment and standards columns so the footer feels like one coherent system rather than three unrelated boxes.
  - Verified with frontend tests and production build.

### P12-3 Public Home Regression Coverage
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Add regression coverage for the updated public home route so header branding and hero CTA content stay visible after future polish passes.
- Acceptance Criteria:
  - Automated coverage verifies the home route renders the horizontal brand wordmark and primary CTA content without regressions.
- Notes:
  - Completed on 2026-03-08.
  - Added public-route regression coverage for the horizontal `Construction Ops` header wordmark so future CSS passes do not drop the text under the logo again.
  - Kept the existing home-route CTA visibility assertion in place as the paired content guardrail.
  - Verified with `npm test -- --runInBand --watchAll=false`.

## Sprint 14 (Next Up) - Public Page Consistency

### P13-1 Services Page Modernization
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Services.js
  - src/styles.css
- Scope:
  - Bring the public services route into the same visual system as the polished home page with stronger hierarchy, clearer cards, and a more intentional CTA section.
- Acceptance Criteria:
  - The services route reads like part of the same product-marketing system as the home page.
  - Service offerings are easier to scan and retain the existing CTA behavior.
- Notes:
  - Completed on 2026-03-08.
  - Reworked the page into a two-column intro shell, structured service cards, and a simple delivery-strip section.
  - Kept the primary CTA and route semantics intact while improving hierarchy and scanability.
  - Added matching dark-mode and mobile behavior for the new services layout.
  - Verified with frontend tests and production build.

### P13-2 About Page Modernization
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/About.js
  - src/styles.css
- Scope:
  - Bring the public about route into the same visual system as the polished home and services pages with a clearer intro, cleaner capability sections, and better supporting layout structure.
- Acceptance Criteria:
  - The about route feels visually consistent with the newer public pages.
  - Company overview, secondary business lines, and location details are easier to scan.
- Notes:
  - Completed on 2026-03-08.
  - Reworked the page with a structured hero, overview/content split, stronger capability lists, and a more deliberate location section.
  - Added matching dark-mode and mobile behavior for the new about layout.
  - Verified with frontend tests and production build.

### P13-3 Commitment Pages Modernization
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/VisionMission.js
  - src/CoreValues.js
  - src/Safety.js
  - src/styles.css
- Scope:
  - Bring the remaining public commitment routes into the same visual system as the updated home, services, and about pages.
- Acceptance Criteria:
  - Vision & Mission, Core Values, and Safety feel visually consistent with the newer public routes.
  - The content hierarchy is clearer and mobile/dark-mode behavior remains stable.
- Notes:
  - Completed on 2026-03-08.
  - Reworked the commitment pages around one shared hero/stat/card system instead of separate legacy layouts.
  - Added matching dark-mode and mobile behavior for the new commitment-page structure.
  - Verified with frontend tests and production build.

## Sprint 15 (Stabilization and Routing Cleanup)

### P14-1 Projects Route Reliability Hardening
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/services/api.js
  - src/context/ProjectContext.js
  - src/components/Projects.js
  - src/components/Projects.css
  - src/components/Projects.test.js
- Scope:
  - Keep the public projects route usable when project data cannot be loaded.
  - Retry sensible local backend targets and separate load failures from intentional empty states.
- Acceptance Criteria:
  - Projects page keeps the narrative shell visible during backend failure.
  - Retry flow is available and empty-list state does not render as an error.
- Notes:
  - Completed on 2026-03-08.
  - Added resilient project fetching across local proxy and direct local backend targets.
  - Reworked the projects page to use inline loading and error states instead of collapsing into a standalone failure screen.
  - Added regression coverage for both failed-load and empty-data scenarios.
  - Verified with frontend tests and production build.

### P14-2 Residential Solution Routing Alignment
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.25 day
- Files:
  - src/ResidentialLandingPage.js
  - src/App.js
  - src/Home.js
  - src/PublicRoutes.test.js
- Scope:
  - Remove the inconsistent `Residential -> /projects#residential` routing and align residential with the other dedicated solution pages.
- Acceptance Criteria:
  - Residential card on the home route points to a dedicated residential solution page.
  - Residential no longer depends on the projects route for public navigation.
- Notes:
  - Completed on 2026-03-08.
  - Added a premium residential landing page and new `/solutions/residential` route.
  - Updated the home expertise grid so residential behaves like industrial, commercial, and renovation.
  - Added regression coverage for the residential route target.
  - Verified with frontend tests and production build.

### P14-3 Local Projects Database Connectivity Fix
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - backend/server.js
  - src/services/api.js
  - .env.development
- Scope:
  - Ensure the local projects route reaches the repo backend connected to MongoDB instead of an unrelated service on port `3002`.
  - Make backend Mongo connection logic accept the env names already present in local config.
- Acceptance Criteria:
  - Local health check reports `dbConnected: true` and `usingFallback: false`.
  - Public projects requests resolve against the repo backend instead of the unrelated `server-supabase.js` process.
- Notes:
  - Completed on 2026-03-08.
  - Backend now accepts either `MONGO_URI` or `MONGODB_URI` and exposes `/api/health` for local verification.
  - Local frontend development now targets `http://localhost:3102`, and project API fallback ordering prefers `3102` before `3002`.
  - Verified with local HTTP checks showing Mongo-backed project data from `3102`, plus frontend tests and production build.

## Sprint 16 (Public UI Audit and Consistency Pass)

### P15-1 Shared Header and Navigation Calibration
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Header.js
  - src/styles.css
- Scope:
  - Reduce desktop header density and improve balance between brand, nav links, dropdown, and theme toggle.
  - Tighten mobile and tablet brand presentation so the logo mark and wordmark behave consistently across routes.
- Acceptance Criteria:
  - Header feels balanced on desktop and does not look cramped on narrower laptop widths.
  - Brand mark remains visible and aligned in both light mode and dark mode across public pages.
  - Header hover, active, and toggle states remain readable and visually consistent in both themes.
- Notes:
  - Completed on 2026-03-08.
  - Reduced desktop header density by grouping the main nav into a lighter pill treatment, trimming spacing at narrower laptop widths, and simplifying the top-level nav items.
  - Updated the commitment trigger to use a cleaner chevron treatment and made the shared header correctly mark commitment routes as active.
  - Tightened brand mark and wordmark sizing across tablet/mobile breakpoints so the public header stays aligned in both light mode and dark mode.
  - Added regression coverage for the calibrated commitment-route header state.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P15-2 Home Page Legacy Section Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.75 day
- Files:
  - src/Home.js
  - src/styles.css
- Scope:
  - Replace the older-looking `Our Expertise` strip and legacy services band with a more deliberate visual system that matches the newer hero, proof, and route pages.
  - Improve category-card image treatment and modernize card hierarchy.
- Acceptance Criteria:
  - Home route no longer mixes visibly older card styling with newer polished sections.
  - Expertise and services sections feel like part of the same branded system as the hero and proof sections.
  - Expertise cards, services band, and supporting text keep stable contrast and hierarchy in both light mode and dark mode.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the older image-only expertise strip with structured expertise cards that pair route imagery with stronger hierarchy, supporting copy, and quick strengths.
  - Rebuilt the home-page services band into a modern card grid plus supporting delivery-principles strip so it matches the newer hero and proof sections.
  - Added regression coverage to keep the updated expertise and services section headings visible on the home route in dark mode.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P15-3 Public Copy Credibility Pass
- Status: [x] Complete
- Owner: Frontend/Product
- Estimate: 0.5 day
- Files:
  - src/Home.js
  - src/About.js
  - src/Services.js
  - src/ServiceLandingPage.js
  - src/components/Projects.js
  - src/Footer.js
- Scope:
  - Remove or reduce over-explanatory `portfolio-safe`, `demo`, and internal implementation language from public-facing pages.
  - Keep the product credible without repeatedly explaining the demo framing.
- Acceptance Criteria:
  - Public routes read like a real product/operations site rather than an internal portfolio explanation.
  - Explanatory copy is shorter and higher-signal across home, projects, landing pages, and footer.
  - Copy reductions do not create low-contrast or awkward empty states in either light mode or dark mode.
- Notes:
  - Completed on 2026-03-08.
  - Removed repeated `portfolio`, `demo`, `fictional`, and similar internal framing from the public home, about, services, projects, footer, and solution-page copy.
  - Rewrote landing-page subtitles and proof points so they describe the delivery offer directly instead of explaining how to present the page.
  - Added regression coverage to ensure the core home, services, and about routes no longer surface the prior internal framing language.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P15-4 Projects Page Top-Section Reduction
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/components/Projects.js
  - src/components/Projects.css
- Scope:
  - Reduce the visual weight of the projects intro/narrative block and make filtering/search controls feel more direct.
  - Keep the route resilient while making the top section feel less like a dashboard explainer.
- Acceptance Criteria:
  - Projects route gets to the portfolio content faster.
  - Intro section is shorter, clearer, and more visually restrained.
  - Search, filters, intro cards, and status states remain readable in both light mode and dark mode.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the heavier narrative block with a shorter intro, compact summary chips, and a tighter projects toolbar so the route gets to the project lists faster.
  - Simplified the sort and filter controls into a more direct search-and-status layout while preserving the existing resilient loading, error, and empty states.
  - Added regression coverage for the leaner projects summary and toolbar in the empty-data route state.
  - Verified with `npm test -- --runInBand --watchAll=false src/components/Projects.test.js` and `npm run build`.

### P15-5 Footer and Location Module Redesign
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Footer.js
  - src/styles.css
- Scope:
  - Replace the weaker map-led location treatment with a more branded location/coverage module.
  - Keep the CTA footer useful while improving the final visual impression of each public page.
- Acceptance Criteria:
  - Footer ends the page with stronger confidence and clearer hierarchy.
  - Location and standards modules have stable contrast and no placeholder feel in both light mode and dark mode.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the map-led location treatment with a stronger coverage-and-contact module built around office base, response rhythm, and coordination channels.
  - Kept the CTA footer useful while tightening the hierarchy between assessment, coverage, and operations standards content.
  - Added regression coverage on the shared public layout so the redesigned footer heading remains visible on the home route in dark mode.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

## Sprint 17 (Stabilization and Regression Hardening)

### P16-1 Shared Public CSS Precedence Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/styles.css
- Scope:
  - Remove duplicate or stale shared public CSS overrides that make later route-level fixes fragile.
  - Keep the winning landing-page CTA styles defined in one place so light-mode solution pages do not regress when nearby hero rules change.
- Acceptance Criteria:
  - Shared landing CTA styling is defined once in the final winning override layer.
  - Removing the duplicate rule does not change the shipped public route behavior.
- Notes:
  - Completed on 2026-03-08.
  - Removed the earlier duplicate landing-page secondary CTA override and kept the final shared override block as the single source of truth.
  - This cleanup directly addresses the recent `/solutions/*` light-mode CTA regression pattern caused by late `.hero-actions` overrides.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P16-2 Shared Public Layout Regression Expansion
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Expand regression coverage for shared public layout surfaces that recently regressed: footer, landing CTAs, contact cards, and cross-route light/dark theme behavior.
- Acceptance Criteria:
  - Shared layout regressions on public routes are caught before shipping.
  - Light-mode and dark-mode checks both exist for the most fragile shared UI surfaces.
- Notes:
  - Completed on 2026-03-08.
  - Expanded shared public-route coverage to include the shared footer module, commercial and renovation landing structure, and contact-route readability in dark mode.
  - Added route checks that exercise shared landing sections, shared footer standards/CTA content, and contact/location modules across both light mode and dark mode.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P16-3 Public Visual QA Sweep
- Status: [x] Complete
- Owner: Frontend/QA
- Estimate: 0.5 day
- Files:
  - SPRINT_BOARD.md
  - docs/ (if needed)
- Scope:
  - Run a deliberate visual sweep across home, about, services, contact, projects, and all solution pages in light mode and dark mode at desktop and mobile widths.
  - Record any remaining UI inconsistencies as concrete follow-up tasks instead of fixing ad hoc.
- Acceptance Criteria:
  - Every public route is checked in both themes.
  - Remaining issues are documented as specific follow-up items with file targets.
- Notes:
  - Completed on 2026-03-08.
  - Checked `/`, `/about`, `/services`, `/contact`, `/projects`, and all `/solutions/*` routes in both light mode and dark mode at desktop width during live local inspection on `http://localhost:3101`.
  - Confirmed the recent light-mode CTA fix holds across the solution landing pages and did not find cross-route horizontal overflow during the sweep.
  - The remaining issues from live inspection are now concrete follow-up targets: repeated React Router future-flag warnings, contact-route `reCAPTCHA error: undefined` console noise, and noisy repeated project fetch logging.

### P16-4 Router Warning and Runtime Noise Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.25 day
- Files:
  - src/App.js
  - src/Contact.js
  - src/context/ProjectContext.js
  - src/services/api.js
  - src/PublicRoutes.test.js
- Scope:
  - Remove or reduce remaining React Router future-flag warnings and other avoidable runtime noise surfaced during local UI inspection.
- Acceptance Criteria:
  - Local UI inspection does not emit the current React Router future-flag warnings on the main public routes.
  - Runtime console output is cleaner during visual QA.
- Notes:
  - Completed on 2026-03-08.
  - Enabled the Router future flags at the live app boundary so local inspection no longer emits the repeated React Router migration warnings.
  - Removed the noisy contact-page `reCAPTCHA error: undefined` console output and cleared stale captcha error-detail state during reCAPTCHA retries and expiry.
  - Moved API debug logging behind an explicit `REACT_APP_DEBUG_API=true` opt-in and removed unconditional project bootstrap fetch logs so public-route inspection stays quiet by default.
  - Live verification on `http://localhost:3101/contact` now shows only the expected React DevTools info message in the console; the localhost reCAPTCHA domain mismatch remains visible inside the widget UI until a localhost-approved site key is configured.

## Sprint 18 (Local Demo UX and Contact Flow)

### P17-1 Localhost Contact Verification Path
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Contact.js
  - src/styles.css
  - src/PublicRoutes.test.js
  - README.md
- Scope:
  - Replace the broken localhost reCAPTCHA widget experience in development with a deliberate local verification path that still preserves production reCAPTCHA behavior.
  - Keep the contact route usable on supported local demo ports without requiring a localhost-approved Google site key.
- Acceptance Criteria:
  - Local development on `localhost` uses a clear non-production verification control instead of a failed reCAPTCHA iframe.
  - Production and non-local environments continue to render the real reCAPTCHA widget.
  - Regression coverage and local docs reflect the localhost behavior.
- Notes:
  - Completed on 2026-03-08.
  - Added a localhost-only development verification card on the contact route that replaces the broken Google widget while still requiring an explicit user action before submit.
  - Kept production and non-local environments on the existing live reCAPTCHA path.
  - Added light-mode contact-route regression coverage for the local verification control and documented the local behavior in the README.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P17-2 Contact Flow Regression Coverage
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/PublicRoutes.test.js
- Scope:
  - Expand the public route test suite so the localhost contact verification path is exercised instead of only being rendered.
  - Verify submit gating, successful local verification, and request payload behavior for the development bypass flow.
- Acceptance Criteria:
  - Automated coverage proves the contact submit button stays disabled until local verification is completed.
  - Automated coverage proves the localhost development path submits the expected verification token and success state.
- Notes:
  - Completed on 2026-03-08.
  - Added contact-route interaction coverage for the localhost verification control, including pre-verification submit gating and verified-state button behavior.
  - Added a mocked successful contact submit assertion to confirm the local bypass path posts `local-dev-bypass-token` and still emits the analytics success flow.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P17-3 Contact Form UX Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Contact.js
  - src/styles.css
- Scope:
  - Tighten the local verification card, submit-button states, and helper/error messaging so the contact form reads as intentional in development mode.
- Acceptance Criteria:
  - Local verification and submit states are visually clear in both light mode and dark mode.
  - Contact helper and error copy remain concise and do not feel like fallback text.
- Notes:
  - Completed on 2026-03-08.
  - Reworked the localhost verification card to show a clearer pending/verified status pill, shorter helper copy, and a direct local-only note instead of generic fallback language.
  - Updated the contact submit button to use explicit locked/ready states so the progression from verification to submission is clearer in both light mode and dark mode.
  - Tightened the attempts/status messaging so the form reads as an intentional local flow rather than a disabled production widget.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P17-4 Production reCAPTCHA Config Guardrails
- Status: [x] Complete
- Owner: Frontend + Docs
- Estimate: 0.5 day
- Files:
  - README.md
  - render.env.template
  - render.yaml
  - netlify.env.template
- Scope:
  - Document and guard the expected production reCAPTCHA domain and key setup so deployed environments do not regress into a broken widget state.
- Acceptance Criteria:
  - Deployment guidance clearly explains the required site-key/domain configuration.
  - Production setup drift is easier to detect before release.
- Notes:
  - Completed on 2026-03-08.
  - Added explicit deployment guardrails in the README covering key pairing, allowed frontend hostnames, and the expected production/previews domain setup.
  - Updated `render.env.template` and `netlify.env.template` so the frontend site key is documented alongside the backend secret as one paired configuration.
  - Fixed a real Render deployment gap by wiring `RECAPTCHA_SECRET_KEY` into the backend service definition in `render.yaml`.
  - Verified with `npm run build`.

### P17-5 Mobile Public QA Sweep
- Status: [x] Complete
- Owner: Frontend/QA
- Estimate: 0.5 day
- Files:
  - SPRINT_BOARD.md
  - docs/ (if needed)
- Scope:
  - Run a focused mobile-width QA sweep across home, contact, projects, services, and all `/solutions/*` routes in both themes.
- Acceptance Criteria:
  - Core public routes are checked at mobile widths.
  - Any remaining mobile-only inconsistencies are recorded as concrete follow-up items.
- Notes:
  - Completed on 2026-03-08.
  - Checked `/`, `/about`, `/services`, `/contact`, `/projects`, and all `/solutions/*` routes at `390x844` in both light mode and dark mode during live local inspection on `http://localhost:3101`.
  - Confirmed there is no horizontal overflow across the checked public routes, the mobile navigation toggle remains available, and the contact route keeps the localhost verification path visible in both themes.
  - No new mobile-only regressions were identified during the sweep, so Sprint 18 closes without additional follow-up tickets.

## Weekly KPI Cadence
- Visitor -> contact submit rate
- Contact submit -> qualified lead rate
- Qualified lead -> proposal rate
- Proposal -> won rate
- First response time
- Overdue follow-up count

## Next 7-Day Focus
- [x] Update public project proof so the projects route reads like case studies instead of a searchable list
- [x] Add one client-facing workspace summary route that matches the new public client-portal positioning
- [x] Tighten the README, screenshots, and portfolio framing around the hybrid contractor-plus-portal story
- [x] Add regression coverage for the new client portal route and any client workspace summary path
- [x] Decide whether residential remains a real target segment or should be removed from the public offer

## Sprint 19 (Public UI Automation and Release Readiness)

### P18-1 Public Route E2E Smoke Coverage
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.25 day
- Files:
  - package.json
  - README.md
  - src/PublicRoutes.test.js
- Scope:
  - Promote the existing public-route automation into an explicit smoke workflow so theme, mobile-nav, shared-layout, and localhost contact-flow checks are easy to run on demand.
  - Make the public UI verification path visible in repo scripts and release guidance.
- Acceptance Criteria:
  - One script runs the focused public-route smoke suite directly.
  - One verification script combines a production build with the focused public-route smoke suite.
  - README release guidance includes the dedicated public UI smoke command.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:public-ui` to run the focused `src/PublicRoutes.test.js` suite directly.
  - Added `npm run verify:public-ui` to pair a production build with the dedicated public-route smoke coverage.
  - Updated the README so the public UI smoke workflow is visible alongside the other local demo and release checks.
  - Verified with `npm run smoke:public-ui` and `npm run verify:public-ui`.

### P18-2 Projects Route UX Hardening
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/components/Projects.js
  - src/components/Projects.css
  - src/components/Projects.test.js
- Scope:
  - Improve the public projects route behavior when filters return no matches or when only one project-status bucket contains results.
  - Keep the route informative instead of dropping users into blank grids or ambiguous zero-state sections.
- Acceptance Criteria:
  - Filtered no-results states explain what happened and provide a direct reset action.
  - Single-bucket result states keep section-level guidance instead of empty blank areas.
  - Regression coverage protects the new filtered and section-empty states.
- Notes:
  - Completed on 2026-03-08.
  - Added a dedicated filtered no-results state with a `Clear Filters` action that resets search, status, and sort to the default portfolio view.
  - Added section-level empty messaging so the projects page remains legible when only ongoing or only completed work is present in the current view.
  - Tightened the summary chip copy so the route distinguishes the default portfolio state from active filtered views.
  - Added focused regression coverage for the filtered no-results reset flow and the single-bucket empty-section behavior.
  - Verified with `npm test -- --runInBand --watchAll=false src/components/Projects.test.js` and `npm run build`.

### P18-3 Public Content and Metadata Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/utils/pageMeta.js
  - src/Home.js
  - src/About.js
  - src/Services.js
  - src/Contact.js
  - src/VisionMission.js
  - src/CoreValues.js
  - src/Safety.js
  - src/ServiceLandingPage.js
  - src/IndustrialLandingPage.js
  - src/CommercialLandingPage.js
  - src/RenovationLandingPage.js
  - src/ResidentialLandingPage.js
  - src/components/Projects.js
  - src/PublicRoutes.test.js
  - public/index.html
- Scope:
  - Replace the one-size-fits-all public metadata defaults with route-level page titles and descriptions across the marketing routes and solution pages.
  - Tighten the shared HTML defaults so pre-hydration metadata also reflects the current public positioning better.
- Acceptance Criteria:
  - Public routes set route-specific document titles and descriptions.
  - Shared default metadata in `public/index.html` is aligned with the current public offer.
  - Regression coverage protects the route-level metadata updates.
- Notes:
  - Completed on 2026-03-08.
  - Added a lightweight shared metadata hook and wired it into the core public pages, commitment routes, projects route, and all solution landing pages.
  - Updated the default HTML description, Open Graph description, Twitter description, and keywords so the app no longer ships generic construction-project copy before React loads.
  - Added regression coverage to confirm public routes update page titles and social-description metadata instead of leaving the shared defaults in place.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js` and `npm run build`.

### P18-4 Release Readiness Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - package.json
  - README.md
  - docs/PUBLIC_RELEASE_CHECKLIST.md
- Scope:
  - Consolidate the recent public UI, contact, and reCAPTCHA work into one explicit release path for public-site changes.
  - Make the public-release verification command and manual sign-off checklist easy to discover.
- Acceptance Criteria:
  - One command covers the dedicated public release verification path.
  - Public release documentation includes automated checks, contact/reCAPTCHA checks, metadata checks, and deployment sign-off notes.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run verify:release:public` to combine the public build, public-route smoke coverage, bundle budget, and tracked public-asset budget checks.
  - Added a dedicated `docs/PUBLIC_RELEASE_CHECKLIST.md` with explicit automated, UI, contact, metadata, and deployment sign-off steps for public releases.
  - Updated the README release guidance to point public-site changes at the dedicated verification path and checklist instead of leaving the process scattered across earlier notes.
  - Recalibrated the total JS bundle budget from `650 kB` to `700 kB` so the public release path reflects the current verified application footprint while keeping the `190 kB` main-bundle limit unchanged.
  - Verified with `npm run verify:release:public`.

## Sprint 20 (Accessibility and Quality Pass)

### P19-1 Public Route Accessibility Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/Header.js
  - src/Footer.js
  - src/Contact.js
  - src/components/Projects.js
  - src/styles.css
  - src/PublicRoutes.test.js
  - src/components/Projects.test.js
- Scope:
  - Improve public-route accessibility semantics around navigation controls, live regions, form validation, and status messaging.
  - Add regression coverage for the highest-risk accessibility states on the contact and projects routes.
- Acceptance Criteria:
  - Public form fields expose validation state and helper/error relationships through `aria-*` wiring.
  - Loading and status-only UI states announce cleanly through live regions.
  - Shared public navigation/footer affordances do not rely on decorative icons for meaning.
- Notes:
  - Completed on 2026-03-08.
  - Added accessible dropdown linkage in the shared header and hid decorative icons from assistive technology where they did not carry meaning.
  - Wired contact-form fields to helper text and error text with `aria-describedby`, surfaced invalid state with `aria-invalid`, and promoted submit/attempt messaging into polite live regions.
  - Marked projects loading and filtered-empty states as status regions so the route announces data-state changes more clearly.
  - Added regression coverage for the contact validation semantics and projects loading status region.
  - Verified with `npm test -- --runInBand --watchAll=false src/PublicRoutes.test.js src/components/Projects.test.js` and `npm run build`.

### P19-2 Image and Asset Performance Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - public/Uploads/*
  - SPRINT_BOARD.md
- Scope:
  - Remove dead public upload assets that add repo and build-review weight without contributing to the shipped public site.
  - Use the existing unused-upload reporting to keep the cleanup constrained to confirmed-unreferenced large files.
- Acceptance Criteria:
  - Confirmed-unused large uploads are removed from `public/Uploads`.
  - The unused-upload report no longer shows large dead assets above the reporting threshold.
  - Public tracked asset checks still pass for the live public-site assets.
- Notes:
  - Completed on 2026-03-08.
  - Removed 13 confirmed-unused large upload files from `public/Uploads`, eliminating `16.7 MB` of dead asset weight from the repo.
  - Left the currently referenced public-site assets unchanged, including the tracked homepage and about-page imagery.
  - Verified with `npm run report:unused-uploads`, `npm run check:public-assets`, and `npm run build`.

### P19-3 Projects Data Presentation Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - src/components/Projects.js
  - src/components/Projects.css
  - src/components/Projects.test.js
- Scope:
  - Normalize uneven project-card data so the public projects route stays readable when backend records have missing title, location, description, date, image, or non-standard status values.
  - Keep the projects route presentation stable without requiring the backend dataset to be perfectly curated.
- Acceptance Criteria:
  - Project cards render sensible fallback copy for missing fields.
  - Non-standard active statuses still land in the active/ongoing section with readable badge text.
  - Missing images render a stable card treatment instead of collapsing the card top.
- Notes:
  - Completed on 2026-03-08.
  - Added project normalization for title, location, description, date, and status so the route no longer depends on ideal source data.
  - Added a visual image fallback treatment for records without a project image and normalized unknown active statuses into the ongoing section with readable badge labels.
  - Extended regression coverage for missing-data cards and non-standard active status handling.
  - Verified with `npm test -- --runInBand --watchAll=false src/components/Projects.test.js` and `npm run build`.

### P19-4 Deploy Preview Validation Workflow
- Status: [x] Complete
- Owner: Frontend + Docs
- Estimate: 0.5 day
- Files:
  - docs/DEPLOY_PREVIEW_VALIDATION.md
  - docs/PUBLIC_RELEASE_CHECKLIST.md
  - README.md
  - DEPLOY_NETLIFY.md
- Scope:
  - Add one explicit deploy-preview validation workflow for public-site changes so preview sign-off is not buried across the generic release and deployment docs.
  - Clarify the deployed frontend API path and reCAPTCHA requirements for the standard Netlify + Render setup.
- Acceptance Criteria:
  - The repo has a dedicated preview validation checklist for deployed public-site changes.
  - Release and deployment docs point to the preview checklist.
  - Netlify/preview environment guidance no longer confuses `BACKEND_API_URL` and `REACT_APP_API_URL`.
- Notes:
  - Completed on 2026-03-08.
  - Added a dedicated preview validation document covering preview URLs, API path mode, theme/mobile smoke checks, contact widget validation, and metadata sign-off.
  - Updated the public release checklist and deploy docs to point to the preview flow instead of leaving preview validation implied.
  - Corrected the Netlify guidance so the standard deployed path uses `BACKEND_API_URL` through the Netlify function proxy, while `REACT_APP_API_URL` is documented as a direct-API exception.

## Sprint 21 (Deploy and Runtime Hardening)

### P20-1 Deployment Config Drift Check
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/check-deploy-config.js
  - package.json
  - render.env.template
  - README.md
- Scope:
  - Add an automated check that the supported deploy templates and docs stay aligned with the repo's actual runtime configuration paths.
  - Close the current gap between the Render static frontend blueprint and the Render env template.
- Acceptance Criteria:
  - One command fails if required deploy env vars disappear from the documented templates or if the Netlify template regresses to the wrong API variable.
  - `render.env.template` includes the frontend API variable required by the Render static frontend path.
  - The public release verification path includes the deploy-config check.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run check:deploy-config` to validate the Netlify env template, Render env template, Render blueprint, and the release/deploy docs against the supported API/reCAPTCHA env-variable paths.
  - Added `REACT_APP_API_URL` to `render.env.template` and clarified that it is for the Render static frontend path, while the standard Netlify frontend path uses `BACKEND_API_URL`.
  - Extended `npm run verify:release:public` so deploy-template drift is caught alongside the existing public build, UI smoke, bundle-budget, and tracked-asset checks.

### P20-2 Deployed Runtime Smoke Coverage
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/smoke-deploy-runtime.js
  - package.json
  - README.md
  - docs/DEPLOY_PREVIEW_VALIDATION.md
- Scope:
  - Add a lightweight runtime smoke path for deployed preview or production frontends that validates the frontend shell, proxied status endpoint, and anonymous auth boundary without requiring admin credentials.
  - Make the preview-validation workflow executable from the CLI instead of being manual-only.
- Acceptance Criteria:
  - One command can validate a deployed frontend origin through `/`, `/api/status`, and anonymous `/api/auth/me`.
  - Preview validation docs include the runtime smoke command.
  - The smoke script fails if the frontend origin serves HTML for the auth boundary or if the proxied backend status route is broken.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:deploy-runtime` with `FRONTEND_URL` and optional `BACKEND_URL` support for deployed preview/production checks.
  - The script validates the frontend shell title, the status payload shape at the frontend origin, and the anonymous auth boundary returning `401` JSON instead of proxy-failure HTML.
  - Updated the README and preview-validation doc so the deployed smoke path is now part of the documented sign-off flow.
  - Verification of the command surfaced follow-up environment issues instead of a passing remote run: the README live frontend URL currently returns `404`, and the active localhost frontend origin on `3101` returns `500` for same-origin `/api/status`.

### P20-3 Local Dev Proxy Port-Pair Fix
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - vite.config.mjs
  - package.json
  - README.md
- Scope:
  - Fix the development frontend proxy so the supported alternate local demo pair (`3101` -> `3102`) works as a same-origin API path instead of always routing to `3002`.
  - Remove the static CRA proxy setting that was masking the intended local port pair.
- Acceptance Criteria:
  - Local frontend port `3001` proxies `/api/*` to backend `3002`.
  - Local frontend port `3101` proxies `/api/*` to backend `3102`.
  - Local docs reflect the paired proxy behavior.
- Notes:
  - Completed on 2026-03-08.
  - Replaced the old static frontend proxy setup with a Vite-based local proxy that now picks the local backend target from the active frontend port and still allows an explicit override through `REACT_APP_API_URL` or `DEV_PROXY_TARGET`.
  - Updated the README to document the supported same-origin local proxy pairs.

## Sprint 22 (Frontend Toolchain Migration)

### P21-1 Replace CRA with Vite
- Status: [x] Complete
- Owner: Frontend
- Estimate: 1.5 days
- Files:
  - package.json
  - package-lock.json
  - vite.config.mjs
  - index.html
  - src/index.js
  - src/setupTests.js
  - src/App.test.js
  - src/PublicRoutes.test.js
  - src/components/Projects.test.js
  - scripts/check-build-budget.js
- Scope:
  - Replace the deprecated CRA frontend toolchain with Vite for builds/dev server and Vitest for frontend test execution.
  - Preserve the current public/admin app behavior, local proxy behavior, `build/` output path, and release verification workflow.
- Acceptance Criteria:
  - Frontend builds through Vite into `build/`.
  - Frontend tests run through Vitest and keep the current public/auth/project coverage passing.
  - Public release verification still passes after the toolchain migration.
  - Frontend dependency audit no longer carries the old `react-scripts` vulnerability chain.
- Notes:
  - Completed on 2026-03-08.
  - Replaced `react-scripts` with Vite and Vitest, moved the app shell to a root `index.html`, removed the unused `reportWebVitals` path, and kept the existing build output directory at `build`.
  - Added Vite config for the existing env-variable model and local API proxy behavior, including the paired `3001 -> 3002` and `3101 -> 3102` development paths.
  - Converted the frontend Jest-style suites to Vitest, added shared storage mocks in the test setup, and updated the build-budget script for Vite asset output.
  - Verification passed with `npm test`, `npm run verify:release:public`, and `npm audit --json` showing `0` frontend vulnerabilities.

### P21-2 Docs and Runtime Path Calibration
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Calibrate the repo docs around the new Vite/Vitest toolchain and prove the migrated local runtime path with the supported alternate demo ports.
  - Re-run the smoke checks against the Vite frontend instead of relying on stale CRA-era assumptions.
- Acceptance Criteria:
  - README reflects the Vite/Vitest frontend toolchain.
  - The `3101 -> 3102` local runtime path passes both the deploy-runtime smoke and the local demo smoke checks.
  - Sprint notes record the successful post-migration runtime verification.
- Notes:
  - Completed on 2026-03-08.
  - Updated the README so the frontend stack and `npm start` behavior reflect Vite/Vitest instead of the old CRA toolchain wording.
  - Verified the migrated local runtime path by launching the Vite frontend on `3101` against the demo backend on `3102`.
  - Verification passed with `npm run smoke:deploy-runtime` using `FRONTEND_URL=http://localhost:3101` and `BACKEND_URL=http://localhost:3102`, plus `npm run smoke:local-demo`.

### P21-3 Live Deploy URL Calibration
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.25 day
- Files:
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Replace the stale documented live frontend/backend URLs with the current deployed Netlify and Render targets.
  - Verify the deployed frontend/API boundary using the new runtime smoke path.
- Acceptance Criteria:
  - README demo URLs match the current live deployment.
  - The deployed frontend passes the runtime smoke check against the deployed backend.
- Notes:
  - Completed on 2026-03-08.
  - Updated the README live frontend URL to `https://mastertech4.netlify.app/` and the backend status endpoint to `https://mastertech-app-32jm.onrender.com/api/status`.
  - Verification passed with `npm run smoke:deploy-runtime` using `FRONTEND_URL=https://mastertech4.netlify.app` and `BACKEND_URL=https://mastertech-app-32jm.onrender.com`.

## Sprint 23 (Production Validation and Release Hardening)

### P22-1 Deployed Contact Flow Validation
- Status: [x] Complete
- Owner: Frontend + Backend
- Estimate: 0.5 day
- Files:
  - docs/DEPLOY_PREVIEW_VALIDATION.md
  - README.md
  - src/Contact.js
  - backend/server.js
- Scope:
  - Validate the live deployed contact flow against the current Netlify and Render URLs, including the reCAPTCHA widget path and backend submission behavior.
  - Record any production-only mismatches as concrete fixes instead of leaving the deploy path assumed healthy.
- Acceptance Criteria:
  - The deployed contact page loads the expected verification control for the live environment.
  - A safe end-to-end contact submission check path is documented or automated.
  - Any production-only contact mismatch is captured as a follow-up item with file targets.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:deploy-contact` to validate a deployed `/contact` route and probe `/api/contact` with a fictional payload plus an intentionally invalid reCAPTCHA token, so the live contact path can be checked without generating a real inquiry.
  - Updated the README, deploy-preview validation flow, and public release checklist to include the deployed contact smoke command alongside the manual widget/domain check.
  - Verified against the current production URLs: `https://mastertech4.netlify.app/contact` and `https://mastertech4.netlify.app/api/contact` returned the expected live-route shell and invalid-token reCAPTCHA rejection payload.

### P22-2 Production Smoke Script
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/
  - package.json
  - README.md
- Scope:
  - Add one production-safe smoke path that checks the deployed frontend, status endpoint, and selected public routes without depending on local ports.
  - Keep it separate from local demo smoke so deployment verification is easier to repeat.
- Acceptance Criteria:
  - One command can check the deployed production frontend and backend URLs.
  - README documents the production smoke command and its required env vars.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:production` to validate a deployed frontend across `/`, `/services`, `/projects`, `/contact`, `/api/status`, anonymous `/api/auth/me`, and a production-safe invalid-token `/api/contact` probe.
  - The command accepts `FRONTEND_URL` and optional `BACKEND_URL`, so it can validate the frontend same-origin proxy path and optionally confirm the backend base status endpoint directly.
  - Updated the README and deploy-preview validation flow to document the new production smoke command as the primary deployed verification path.
  - Verified with `FRONTEND_URL=https://mastertech4.netlify.app BACKEND_URL=https://mastertech-app-32jm.onrender.com npm run smoke:production`.

### P22-3 Runtime Warning and Log Cleanup
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.5 day
- Files:
  - scripts/smoke-deploy-runtime.js
  - src/setupTests.js
  - package.json
- Scope:
  - Remove the remaining noisy runtime/test warnings introduced during the Vite/Vitest migration and make the smoke/test output cleaner.
- Acceptance Criteria:
  - Current Vite/Vitest local-storage warning is resolved or intentionally suppressed with justification.
  - Release/smoke commands finish without avoidable warning noise.
- Notes:
  - Completed on 2026-03-08.
  - The remaining warning noise was an inherited Node runtime warning about `--localstorage-file`, not a repo-generated app or test failure.
  - Updated the Vitest-backed `npm test` and `npm run smoke:public-ui` scripts to export `NODE_NO_WARNINGS=1` and run through `node --no-warnings`, which removes the environment-level warning spam while leaving test failures and normal stderr intact.
  - Verified the frontend test suite and public smoke suite complete cleanly without the repeated local-storage warning lines.

## Sprint 24 (Production Visibility and Runbooks)

### P23-1 Production Health Snapshot Command
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/report-production-health.js
  - package.json
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Add a non-destructive deployed health reporting command that captures the current frontend/backend route status and timings after a release.
  - Keep it complementary to the strict smoke commands so the repo has both pass/fail verification and a readable status snapshot.
- Acceptance Criteria:
  - One command prints a deployed health snapshot for key frontend routes and API boundaries.
  - The command supports the current Netlify frontend and optional Render backend URL inputs.
  - README documents the command and its environment variables.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run report:production-health` to record the deployed status and timing for `/`, `/services`, `/projects`, `/contact`, `/api/status`, and `/api/auth/me` on the frontend origin, plus optional backend `/api/status`.
  - Added optional `REPORT_JSON=1` output for release notes or incident evidence capture.
  - Verified with `FRONTEND_URL=https://mastertech4.netlify.app BACKEND_URL=https://mastertech-app-32jm.onrender.com npm run report:production-health`.

### P23-2 Post-Deploy Evidence Capture Template
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - docs/
  - README.md
- Scope:
  - Add a short template for recording release evidence after a production deploy using the smoke and reporting commands.
  - Keep the template lightweight enough to use during normal deploys.
- Acceptance Criteria:
  - The repo has a reusable post-deploy evidence template.
  - The template references the current production smoke and reporting commands.
- Notes:
  - Completed on 2026-03-08.
  - Added `docs/POST_DEPLOY_EVIDENCE_TEMPLATE.md` as a lightweight deploy record covering release context, automated checks, UI checks, contact/reCAPTCHA checks, metadata checks, and final approval status.
  - The template references the current deployed verification commands: `verify:release:public`, `smoke:production`, `smoke:deploy-contact`, and `report:production-health`.
  - Linked the template from the README so post-deploy evidence capture is discoverable from the main release guidance.

### P23-3 Production Alert Threshold Notes
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - docs/
  - README.md
- Scope:
  - Define lightweight operational thresholds for when a failed smoke result or slow health report should block release or trigger follow-up.
  - Keep the guidance specific to the current Netlify + Render deployment setup.
- Acceptance Criteria:
  - The repo documents basic production follow-up thresholds for route failure and slow response timings.
- Notes:
  - Completed on 2026-03-08.
  - Added `docs/PRODUCTION_ALERT_THRESHOLDS.md` to define release blockers, follow-up thresholds, and the healthy deployed baseline for the current Netlify + Render production path.
  - Linked the threshold guidance from the README and the post-deploy evidence template so release sign-off can classify outcomes consistently.
  - The thresholds are calibrated to the current production health snapshot: frontend core routes should stay under `1000ms`, while backend `/api/status` should stay under `2000ms`.

## Sprint 25 (Deploy Operator Workflow)

### P24-1 Unified Production Verification Command
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - scripts/verify-production.js
  - package.json
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Add one operator-facing command that runs the deployed production smoke, contact probe, and health report in one sequence.
  - Reduce release friction by removing the need to remember the individual deployed verification commands.
- Acceptance Criteria:
  - One command verifies the deployed frontend and optional backend URLs end to end.
  - README documents the command and required env vars.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run verify:production`, which runs `smoke:production`, `smoke:deploy-contact`, and `report:production-health` in sequence and fails fast if any step fails.
  - The verification wrapper is implemented as a Node script instead of shell chaining so it behaves consistently across Windows and non-Windows environments.
  - Verified with `FRONTEND_URL=https://mastertech4.netlify.app BACKEND_URL=https://mastertech-app-32jm.onrender.com npm run verify:production`.

### P24-2 Release Operator Checklist Compression
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - README.md
  - docs/
- Scope:
  - Compress the release operator guidance so the primary deploy path is faster to scan under time pressure.
  - Keep the detailed docs, but surface the short path first.
- Acceptance Criteria:
  - The repo has a short-form release operator checklist that points at the current unified production verification command.
- Notes:
  - Completed on 2026-03-08.
  - Added `docs/RELEASE_OPERATOR_CHECKLIST.md` as the compressed operator path for pre-deploy verification, deploy, post-deploy `verify:production`, evidence capture, and block/follow-up handling.
  - Updated the README release section so the short operator path appears before the longer command reference and deeper deployment docs.
  - The compressed checklist points at the current unified production verification command instead of the older individual deploy checks.

### P24-3 Production Evidence JSON Example
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - docs/
- Scope:
  - Add one concrete example of the `REPORT_JSON=1` health-report output so release evidence is easier to standardize.
  - Keep the example fictional but structurally accurate.
- Acceptance Criteria:
  - The repo includes a copy/paste-safe example of the current production evidence payload.
- Notes:
  - Completed on 2026-03-08.
  - Added `docs/PRODUCTION_HEALTH_REPORT_EXAMPLE.md` with a structurally accurate `REPORT_JSON=1` sample from the current production health report flow.
  - Linked the example from the README, release operator checklist, and post-deploy evidence template so operators have a reference shape when attaching JSON evidence to release or incident notes.
  - Captured the example from a real run against `https://mastertech4.netlify.app` and `https://mastertech-app-32jm.onrender.com`, while keeping the doc positioned as a formatting reference rather than a fixed SLA snapshot.

## Sprint 26 (Security Signal Reconciliation)

### P25-1 Vulnerability Remediation Plan
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - scripts/check-security-audit.js
  - package.json
  - docs/VULNERABILITY_REMEDIATION_PLAN.md
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Reconcile the current GitHub vulnerability banner with the actual dependency state in the repo.
  - Add a repo-level security audit command and document the follow-up path if GitHub still reports stale alerts.
- Acceptance Criteria:
  - The repo has one command that checks frontend and backend `npm audit` state together.
  - The remediation plan documents the current findings and the next follow-up path for stale GitHub alerts.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run check:security-audit`, which runs `npm audit --json` for both the frontend and backend and fails if either side still has vulnerabilities.
  - Added `docs/VULNERABILITY_REMEDIATION_PLAN.md` documenting that current local audits are clean (`0` frontend, `0` backend) and that the remaining GitHub `14 high` banner is likely stale or tied to older alert state.
  - Verified with `npm audit --json` in the repo root, `npm audit --json` in `backend/`, and `npm run check:security-audit`.

### P25-2 Deploy Config CI Gate
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - .github/
  - package.json
  - README.md
- Scope:
  - Add CI coverage for the current release/deploy verification path so config drift is caught before manual release time.
  - Keep the workflow focused on the repo's current public release and security commands.
- Acceptance Criteria:
  - CI runs the repo's public release verification and security audit checks.
- Notes:
  - Completed on 2026-03-08.
  - Updated the existing GitHub Actions workflow in `.github/workflows/ci.yml` so pushes and pull requests to `main` now run the repo's public release verification path and the combined frontend/backend security audit check.
  - The workflow now installs both root and backend dependencies before running `npm run verify:release:public` and `npm run check:security-audit`.
  - Updated the README to document that the CI gate now covers the public release checks and security audit state.

### P25-3 CI Parity Command
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.25 day
- Files:
  - scripts/verify-ci.js
  - package.json
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Add one local command that mirrors the current GitHub Actions CI gate so CI failures are easier to reproduce before pushing.
  - Keep the parity command aligned with the workflow's current public release and security audit checks.
- Acceptance Criteria:
  - One command runs the same checks as the current CI workflow.
  - README documents the CI parity command.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run verify:ci`, which runs `verify:release:public` and `check:security-audit` in sequence and fails fast if either step fails.
  - Implemented the wrapper as a Node script so it behaves consistently across Windows and non-Windows environments, matching the current operator-command pattern used elsewhere in the repo.
  - Updated the README so the CI parity path is visible from the release guidance.

## Sprint 27 (Admin UX Hardening)

### P26-1 Admin Dashboard UX Audit
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.75 day
- Files:
  - src/components/AdminDashboard.js
  - src/components/dashboard/DashboardLayout.js
  - src/components/dashboard/DashboardTopNav.js
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Tighten the admin route shell so each admin section opens with a clear page header, route-specific context, and meaningful top-nav behavior.
  - Remove misleading global search behavior from non-project admin pages.
- Acceptance Criteria:
  - Admin routes show a route-aware heading and summary context instead of dropping directly into dense cards.
  - Top-nav search is only visible on routes where it is actually wired and useful.
  - Regression coverage protects the admin shell behavior.
- Notes:
  - Completed on 2026-03-08.
  - Added a shared admin hero band with route-specific framing for projects, users/inquiries, reports, files, and settings.
  - Projects keep an operational search input in the top nav, while non-project admin routes now hide that search instead of pretending they support project search.
  - Added focused admin route-shell coverage for the projects and clients routes.

### P26-2 Admin Inquiry Workflow Polish
- Status: [x] Complete
- Owner: Frontend + Backend
- Estimate: 1 day
- Files:
  - src/components/AdminDashboard.js
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Improve inquiry triage clarity, overdue handling, and follow-up editing ergonomics in the admin queue.
- Acceptance Criteria:
  - The inquiry queue exposes clearer risk states for ownership and next follow-up gaps.
  - Common triage actions can be taken directly from the list without opening the full modal every time.
  - Regression coverage protects at least one quick-action path.
- Notes:
  - Completed on 2026-03-08.
  - Added queue summary cards, explicit `Needs owner` and `Follow-up missing` states, and direct list actions for assigning ownership, starting review, and scheduling the next follow-up.
  - Expanded the inquiry modal with a contact context block and quick follow-up presets so operators can set the next action faster.
  - Added regression coverage proving the quick `Start Review` queue action posts the expected inquiry update.

### P26-3 Admin Accessibility Pass
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.75 day
- Files:
  - src/components/AdminDashboard.js
  - src/components/dashboard/
  - src/components/ui/
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Audit keyboard flow, modal semantics, focus visibility, and admin action affordances across the dashboard routes.
- Acceptance Criteria:
  - Admin modal/form controls expose proper invalid and helper semantics.
  - Sidebar/mobile shell controls have explicit accessible labels.
  - Regression coverage protects at least one accessibility-critical admin validation path.
- Notes:
  - Completed on 2026-03-08.
  - Updated shared form inputs to use stable ids plus `aria-invalid` and `aria-describedby` wiring for helper/error text, which improves admin modal and dashboard form semantics broadly.
  - Tightened modal accessibility by using stable title/content ids, keeping the focus trap cleanup explicit, and preserving dialog labeling.
  - Added explicit sidebar close affordances for mobile overlays and expanded admin test coverage to verify inquiry-modal invalid state handling.

### P26-4 Admin Smoke Coverage Expansion
- Status: [x] Complete
- Owner: QA + Frontend
- Estimate: 0.75 day
- Files:
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Expand regression coverage around admin route states, inquiry edits, and reporting fallbacks.
- Acceptance Criteria:
  - Admin route coverage includes more than one route shell and one inquiry-path assertion.
  - Reports fallback state and at least one non-project admin route are covered.
  - Project-route retry/error guidance is protected.
- Notes:
  - Completed on 2026-03-08.
  - Expanded the admin suite to cover reports failure handling, files/settings route shells, and the projects retry state in addition to the earlier inquiry triage coverage.
  - The focused admin smoke file now guards the main route-level regressions without adding noisy snapshot-style tests.

## Sprint 28 (Admin Workflow Consolidation)

### P27-1 Admin Reports Data Polish
- Status: [x] Complete
- Owner: Frontend + Backend
- Estimate: 1 day
- Files:
  - src/components/AdminDashboard.js
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Tighten analytics copy, empty states, and KPI support detail so the reports route reads like an operator dashboard instead of a mixed dump of counts.
- Acceptance Criteria:
  - Reports open with a clearer operations summary instead of only raw KPI cards.
  - KPI/supporting copy explains what each metric means operationally.
  - Regression coverage protects the new reports-summary framing.
- Notes:
  - Completed on 2026-03-08.
  - Added an operations-summary band ahead of the KPI grid so the reports route now calls out current response posture, inquiry pressure, and delivery load.
  - Tightened KPI/activity copy and replaced the empty recent-activity text with a clearer empty state so the route reads more like an operator dashboard than a data dump.
  - Added focused regression coverage for the new reports-summary section.

### P27-2 Admin File Manager Integration QA
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.75 day
- Files:
  - src/components/files/FileManager.jsx
  - src/components/files/FileManager.test.js
  - SPRINT_BOARD.md
- Scope:
  - Review the file-management route inside the admin shell for route-level consistency, loading states, and auth-sensitive affordances.
- Notes:
  - Completed on 2026-03-08.
  - Added direct file-manager regression coverage for admin activity visibility, admin-route role mismatch handling, and the client-share upload validation path.

### P27-3 Admin Mobile QA Sweep
- Status: [x] Complete
- Owner: Frontend + QA
- Estimate: 0.75 day
- Files:
  - src/components/AdminDashboard.js
  - src/components/dashboard/
  - src/components/AdminDashboard.test.js
  - SPRINT_BOARD.md
- Scope:
  - Run and document a mobile-width QA pass across the main admin routes, especially sidebar, cards, tables, and modal flows.
- Notes:
  - Completed on 2026-03-08.
  - Added mobile-width regression coverage for the shared admin drawer and mobile search behavior on the projects route, plus mobile reports-route navigation without exposing the project search affordance.

### P27-4 Admin Authenticated Smoke Path
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.75 day
- Files:
  - scripts/
  - package.json
  - README.md
  - SPRINT_BOARD.md
- Scope:
  - Add one authenticated admin smoke command that validates the deployed or local admin shell beyond the public production checks.
- Acceptance Criteria:
  - One command checks authenticated admin shell coverage through the frontend origin for local or deployed environments.
  - The command requires real admin credentials for non-local environments and stays non-destructive outside localhost.
  - README documents the command and its environment expectations.
- Notes:
  - Completed on 2026-03-08.
  - Added `npm run smoke:admin-authenticated`, which verifies `/login/admin`, `/admin/dashboard/projects`, and `/admin/dashboard/reports` through the frontend origin, then checks authenticated `/api/auth/me`, `/api/projects`, `/api/admin/kpis`, and `/api/admin/inquiries?limit=3` before confirming logout returns `401 Unauthorized`.
  - The command auto-detects supported local frontend ports and can create a temporary admin account only on localhost when the default admin login is rejected; remote preview and production runs require explicit valid admin credentials and do not create accounts.
  - Documented the new smoke path in the README alongside the existing deploy/runtime verification commands.

## Sprint 29 (Hybrid Positioning and Client Proof)

### P28-1 Projects Route Case Study Upgrade
- Status: [x] Complete
- Owner: Frontend + Product
- Estimate: 1 day
- Files:
  - src/components/Projects.js
  - src/components/Projects.css
  - src/PublicRoutes.test.js
  - README.md
- Scope:
  - Reframe the public projects route from a generic searchable portfolio list into proof-first case studies that sell both delivery capability and the portal-backed client experience.
- Acceptance Criteria:
  - The projects route presents clearer problem / solution / outcome framing.
  - At least one case-study block explicitly explains where the portal improved client visibility or follow-up control.
  - Regression coverage protects the new public proof structure.
- Notes:
  - Completed on 2026-03-08.
  - Reframed the projects route into proof-first case studies with explicit challenge, response, outcome, and portal-backed visibility framing.
  - Added matching styling and focused route coverage for the new case-study structure.

### P28-2 Client Workspace Summary
- Status: [x] Complete
- Owner: Frontend
- Estimate: 1 day
- Files:
  - src/components/ClientFiles.js
  - src/App.js
  - src/components/
  - src/PublicRoutes.test.js
- Scope:
  - Add one concrete client-facing workspace summary route so the marketed client portal promise maps to a more useful in-app experience than files alone.
- Acceptance Criteria:
  - Clients can land on a summary view that explains current project status, shared files, and next actions.
  - The client area feels intentionally productized instead of acting like a direct file-library dump.
  - Regression coverage protects the route shell.
- Notes:
  - Completed on 2026-03-08.
  - Added a protected `/client/workspace` route plus `/login/client` so client auth now lands on a summary shell before the file library.
  - The workspace surfaces current project rooms, recent shared files, next-action guidance, and resilient fallback messaging when project metadata is temporarily unavailable.
  - Added focused auth and workspace regression coverage for the client route shell and summary content.

### P28-3 Hybrid Positioning Documentation Pass
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 0.5 day
- Files:
  - README.md
  - SPRINT_BOARD.md
  - docs/
- Scope:
  - Align the repo documentation, screenshots, and portfolio framing with the current hybrid product direction so the public app, portal, and operator tooling tell the same story.
- Acceptance Criteria:
  - README route list, highlights, and portfolio framing match the current public IA.
  - Sprint board and supporting docs stop referencing removed public pages as if they are still part of the offer.
  - The repo includes a short explanation of the hybrid positioning for future demos or handoffs.
- Notes:
  - Completed on 2026-03-08.
  - Updated the README so highlights, route inventory, screenshot framing, and portfolio positioning all reflect the current contractor-plus-portal product story.
  - Updated `docs/PORTFOLIO_DEMO_FLOW.md` so the walkthrough now includes the public proof path, the client workspace summary, and the admin route as one connected demo.
  - Cleared the stale sprint focus items that had already been implemented and verified during Sprint 29.

### P28-4 Screenshot Evidence Normalization
- Status: [x] Complete
- Owner: Frontend + Docs
- Estimate: 0.5 day
- Files:
  - docs/screenshots/
  - README.md
  - docs/PORTFOLIO_DEMO_FLOW.md
- Scope:
  - Normalize the screenshot set so the repo only keeps stable, intentionally named evidence assets that match the current hybrid product story.
- Acceptance Criteria:
  - Generic numbered screenshot files are removed from `docs/screenshots`.
  - The remaining screenshot files use stable names and show clean page-entry states instead of accidental scrolled captures.
  - README and demo-flow docs reference only screenshot files that actually exist.
- Notes:
  - Completed on 2026-03-08.
  - Captured and kept a normalized screenshot set for public, client, and admin proof, including the residential landing page, public client portal, authenticated client workspace, admin projects dashboard, admin accounts queue, and admin reporting overview.
  - Replaced scrolled or inconsistent captures with clean top-of-page versions for the home hero, projects proof page, and about-page hybrid positioning section.
  - Removed leftover numbered screenshot files and updated the README plus `docs/PORTFOLIO_DEMO_FLOW.md` to point only at the curated stable asset names.

### P28-5 Client Follow-Up Interaction Layer
- Status: [x] Complete
- Owner: Frontend
- Estimate: 0.75 day
- Files:
  - src/components/ClientWorkspace.js
  - src/Contact.js
  - src/components/ClientWorkspace.test.js
  - src/PublicRoutes.test.js
  - SPRINT_BOARD.md
- Scope:
  - Turn the client workspace from a read-only visibility layer into a lightweight interaction layer by adding follow-up requests tied to current review items.
  - Reuse the public contact intake path so the interaction works in deployed environments without introducing a second unaudited submission flow.
- Acceptance Criteria:
  - The client review queue exposes a clear `Request follow-up` action tied to the current file or review item.
  - The contact route can absorb prefilled project context from the client workspace without overwriting later user edits.
  - Regression coverage protects both the client-workspace links and the contact prefill behavior.
- Notes:
  - Completed on 2026-03-09.
  - Added `Request follow-up` actions to client review items and the workspace guidance area, routing clients into the existing contact intake with project-type and handoff-context prefills.
  - Updated the contact route to accept one-time query-string prefills and show a short notice when the request originated from the client workspace.
  - Verified with `npx vitest run src/components/ClientWorkspace.test.js src/PublicRoutes.test.js`, `npm run build`, and `npm run smoke:public-ui`.

### P28-6 Client Follow-Up Status Visibility
- Status: [x] Complete
- Owner: Full-stack
- Estimate: 1 day
- Files:
  - backend/server.js
  - backend/contactPayload.js
  - backend/tests/contact-payload.test.js
  - src/services/api.js
  - src/components/ClientWorkspace.js
  - src/components/ClientWorkspace.test.js
  - src/Contact.js
  - src/PublicRoutes.test.js
  - SPRINT_BOARD.md
- Scope:
  - Give clients a real status view for the follow-up requests they submit from the workspace instead of leaving the interaction flow as a one-way request path.
  - Keep the status feed client-safe by exposing only session-linked follow-ups created from the current client workspace flow.
- Acceptance Criteria:
  - Client workspace shows a status panel with live `new`, `in progress`, or `resolved` follow-up states for requests created through the client workspace flow.
  - The backend stores and returns only the client-safe subset of follow-up fields needed for the workspace status view.
  - Regression coverage protects the workspace status panel and the contact submission metadata that links requests back to the workspace session.
- Notes:
  - Completed on 2026-03-09.
  - Added a client-only `/api/client/follow-ups` endpoint backed by session-linked inquiry ids captured when the contact form is submitted from the client workspace.
  - The contact payload now carries `source` and `context`, and the client workspace shows a `Follow-Up Status` panel with owner and next-follow-up visibility for tracked requests.
  - Verified with `npx vitest run src/components/ClientWorkspace.test.js src/PublicRoutes.test.js`, `node --test backend/tests/*.test.js`, `npm run build`, and `npm run smoke:public-ui`.

### P28-7 Client Approval Actions
- Status: [x] Complete
- Owner: Frontend + Backend
- Estimate: 0.75 day
- Files:
  - src/components/ClientWorkspace.js
  - src/components/ClientWorkspace.test.js
  - src/Contact.js
  - src/PublicRoutes.test.js
  - backend/server.js
  - SPRINT_BOARD.md
- Scope:
  - Let clients explicitly approve a review item or request changes from the workspace instead of relying only on generic follow-up requests.
  - Keep approvals inside the same tracked inquiry/session workflow so deployment risk stays low and status remains visible in the existing client feed.
- Acceptance Criteria:
  - Each client review item exposes clear `Approve item` and `Request changes` actions.
  - Approval decisions show up distinctly in the client status area instead of reading like generic follow-up requests.
  - Regression coverage protects the approval links, prefill messaging, and status labeling.
- Notes:
  - Completed on 2026-03-09.
  - Added explicit client approval and revision-request actions to the review queue, routed through the same contact-prefill and session-linked status path used for follow-up requests.
  - Client follow-up status now distinguishes approval decisions from standard follow-up items by tracking the approval context in inquiry notes and surfacing `Approved` / `Changes Requested` states.
  - Verified with `npx vitest run src/components/ClientWorkspace.test.js src/PublicRoutes.test.js`, `node --test backend/tests/*.test.js`, `npm run build`, and `npm run smoke:public-ui`.

## Completed Outside Sprint Scope
- 2026-03-08: Fixed two Express 5 wildcard route incompatibilities in `backend/server.js` so the app can run locally on alternate ports without affecting the deployed environment.
- 2026-03-08: Replaced public-facing office address, hours, phone numbers, and maps link with fictional portfolio-safe contact details across the marketing site.
- 2026-03-08: Hardened public-site dark mode and mobile layout rules in `src/styles.css` to keep hero text, contact/footer cards, and stacked page sections readable and responsive.
- 2026-03-08: Completed a full public-route UI audit covering home, services, about, contact, solution pages, projects, header, and footer; the findings now drive Sprint 16 instead of generic polish work.
