import React from 'react';
import ServiceLandingPage from './ServiceLandingPage';

const metrics = [
  { value: 'Premium', label: 'Residential fit-out focus' },
  { value: 'Client-ready', label: 'Progress visibility' },
  { value: 'Phased', label: 'Occupant-aware execution' },
];

const outcomes = [
  {
    title: 'Clearer homeowner expectations',
    description: 'Align scope, milestones, and next decisions so residential work does not drift after kickoff.',
  },
  {
    title: 'Better finish coordination',
    description: 'Sequence trades, materials, and site decisions so premium finishes are not compromised by avoidable rework.',
  },
  {
    title: 'Smoother closeout',
    description: 'Keep final adjustments, touch-ups, and handover actions visible through completion.',
  },
];

const workflow = [
  {
    title: 'Assess the home and scope',
    description: 'Review existing conditions, access constraints, and homeowner priorities before work is phased.',
  },
  {
    title: 'Plan trades and finishes',
    description: 'Coordinate civil, architectural, and MEPF activities around a realistic residential delivery sequence.',
  },
  {
    title: 'Track progress through turnover',
    description: 'Keep approvals, punch-list actions, and finish-sensitive work visible until final handoff.',
  },
];

const proof = [
  'Best fit for high-trust renovation, fit-out, and custom residential execution.',
  'Built around cleaner client updates, tighter field coordination, and more deliberate closeout.',
  'Scope, approvals, and finish-sensitive work stay visible through turnover.',
];

export default function ResidentialLandingPage() {
  return (
    <ServiceLandingPage
      eyebrow="Residential Delivery"
      title="Premium residential execution for projects that need finish quality and cleaner coordination."
      subtitle="High-trust residential work such as fit-outs, custom improvements, and renovation scopes where communication and execution discipline matter."
      metaTitle="Residential Delivery | Construction Operations Portal"
      metaDescription="Premium residential execution for fit-outs, custom improvements, and renovation scopes that need cleaner client communication and finish-sensitive coordination."
      metrics={metrics}
      outcomes={outcomes}
      workflow={workflow}
      proof={proof}
      ctaId="residential_primary"
    />
  );
}
