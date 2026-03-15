import React from 'react';
import ServiceLandingPage from './ServiceLandingPage';

const metrics = [
  { value: '4-Phase', label: 'Owner-facing delivery rhythm' },
  { value: 'Weekly', label: 'Portal-backed update cadence' },
  { value: 'Finish-first', label: 'Premium fit-out control' },
];

const outcomes = [
  {
    title: 'Clearer owner decisions',
    description: 'Align selections, allowances, milestones, and next approvals so residential work does not drift after kickoff.',
  },
  {
    title: 'Better finish coordination',
    description: 'Sequence trades, materials, site protection, and room-by-room turnover so premium finishes are not compromised by avoidable rework.',
  },
  {
    title: 'Smoother homeowner closeout',
    description: 'Keep punch items, touch-ups, manuals, and final handover actions visible through completion.',
  },
];

const workflow = [
  {
    title: 'Assess the home, scope, and living conditions',
    description: 'Review existing conditions, access constraints, homeowner priorities, and whether the property stays occupied during the work.',
  },
  {
    title: 'Lock selections, trades, and room sequencing',
    description: 'Coordinate architectural, civil, and MEPF activity around finish-sensitive milestones and a realistic residential delivery sequence.',
  },
  {
    title: 'Track owner updates through turnover',
    description: 'Keep progress notes, approvals, punch-list actions, and handoff files visible until the home is ready for final turnover.',
  },
];

const clientExperience = [
  {
    title: 'Selection and approval visibility',
    description: 'Use the portal to keep finish decisions, change-sensitive approvals, and the next owner action visible before work moves into the next room or phase.',
  },
  {
    title: 'Cleaner weekly updates',
    description: 'Residential clients get one place to review current files, recent updates, and the next handoff item instead of piecing it together from calls and chat threads.',
  },
  {
    title: 'Closeout without loose ends',
    description: 'Warranty notes, punch-list follow-ups, and handover documents stay available in the workspace instead of disappearing after final walkthroughs.',
  },
];

const proof = [
  'Best fit for occupied-home renovations, premium fit-outs, and custom residential improvement scopes that need disciplined owner communication.',
  'The residential route now treats the client portal as part of the offer: current files, update cadence, and next decisions stay visible in one workspace.',
  'Scope, approvals, room sequencing, and finish-sensitive work stay visible through turnover instead of being managed as disconnected follow-ups.',
];

export default function ResidentialLandingPage() {
  return (
    <ServiceLandingPage
      eyebrow="Residential Delivery"
      title="Premium residential execution for renovations and fit-outs that need finish quality, owner clarity, and disciplined turnover."
      subtitle="Built for occupied-home renovations and premium residential scopes where homeowner communication matters."
      heroImage={`${process.env.PUBLIC_URL || ''}/Uploads/residential-hero.jpg`}
      heroImageAlt="Bright premium residential interior with a renovated living room and minimalist finishes"
      metaTitle="Residential Delivery | Construction Operations Portal"
      metaDescription="Premium residential execution for occupied-home renovations, custom improvements, and fit-outs that need clearer owner communication, finish-sensitive coordination, and a client-ready handoff rhythm."
      metrics={metrics}
      outcomes={outcomes}
      workflow={workflow}
      clientExperience={clientExperience}
      clientExperienceTitle="How residential clients stay aligned"
      clientExperienceIntro="The portal keeps owner decisions, finish changes, and handoff files in one visible place."
      proof={proof}
      ctaId="residential_primary"
    />
  );
}
