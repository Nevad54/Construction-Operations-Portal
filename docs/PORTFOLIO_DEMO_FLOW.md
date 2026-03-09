# Portfolio Demo Flow

## Goal

Show that the app handles both sides of a hybrid construction operations product:

- public contractor positioning and lead capture
- client-facing workspace visibility
- internal admin workflow and operational follow-through

## Demo Sequence

1. Public Homepage
- Show the hero, expertise cards, and selected outcome cards
- Explain that the app is positioned as a contractor-plus-portal offer, not a standalone brochure site
- Screenshot reference: `docs/screenshots/home-light-hero.png`

2. Contact Workflow
- Open the contact page
- Explain the intake path: inquiry creation, role assignment, next follow-up scheduling
- Screenshot reference: `docs/screenshots/contact-form.png`

3. Projects View
- Show that the projects route now behaves like case-study proof, not a generic gallery
- Use the challenge, response, and outcome framing to explain delivery visibility
- Residential proof lives on the dedicated segment page as well
- Screenshot references: `docs/screenshots/projects-case-studies.png`, `docs/screenshots/residential-landing.png`

4. Client Workspace
- Open `/client/workspace`
- Show current project rooms, recent shared files, and next-action guidance
- Explain that clients land on a summary shell before the file library
- Screenshot references: `docs/screenshots/client-portal.png`, `docs/screenshots/client-workspace.png`

5. Admin Dashboard
- Show KPI cards and inquiry management
- Highlight owner, status, priority, and next follow-up date enforcement
- Screenshot references: `docs/screenshots/admin-projects-dashboard.png`, `docs/screenshots/admin-reporting-overview.png`

6. Overdue Follow-up Queue
- Show overdue inquiry visibility
- Demonstrate quick actions: `Snooze 1 Day` and `Mark Resolved`

7. Release Discipline
- Show `npm run verify:release`
- Explain that the demo is backed by build and test verification, not just screenshots

## Talking Points

- This app is suitable for contractors, facilities operators, and project-based service teams.
- The public site, client workspace, and admin side are one operating story, not three separate demos.
- The system demonstrates role-aware access, client visibility, operational accountability, and portfolio-safe demo data.
