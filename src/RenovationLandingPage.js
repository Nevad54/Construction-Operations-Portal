import React from 'react';
import ServiceLandingPage from './ServiceLandingPage';

const metrics = [
  { value: 'Scope-first', label: 'Renovation planning' },
  { value: 'Low-friction', label: 'Occupant-aware execution' },
  { value: 'Tracked', label: 'Follow-up accountability' },
];

const outcomes = [
  {
    title: 'Fewer scope surprises',
    description: 'Start with clearer site assessment and reduce hidden work from derailing execution.',
  },
  {
    title: 'Better occupant coordination',
    description: 'Phase work around active use conditions, access restrictions, and stakeholder expectations.',
  },
  {
    title: 'Clear punch-list follow-through',
    description: 'Keep closeout items owned and visible instead of letting them drift after site turnover.',
  },
];

const workflow = [
  {
    title: 'Inspect and clarify',
    description: 'Assess existing conditions, hidden risks, and change-sensitive work before mobilization.',
  },
  {
    title: 'Phase the disruption',
    description: 'Sequence noisy, invasive, or access-limited tasks around real-world site use.',
  },
  {
    title: 'Track closeout',
    description: 'Capture follow-up actions, assigned owner, and next steps through final handover.',
  },
];

const proof = [
  'Closeout items stay owned and visible instead of drifting after field work wraps.',
  'Owners and site teams can align faster when changes, follow-ups, and next steps stay explicit.',
  'Renovation delivery stays grounded in clear phasing, coordination, and accountability.',
];

export default function RenovationLandingPage() {
  return (
    <ServiceLandingPage
      eyebrow="Renovation Delivery"
      title="Renovation support for projects that need tighter planning before the first wall opens up."
      subtitle="Retrofit, interior improvement, and renovation work where existing conditions and stakeholder coordination drive delivery risk."
      metaTitle="Renovation Delivery | Construction Operations Portal"
      metaDescription="Renovation support for retrofit and interior improvement work that needs clear phasing, existing-conditions planning, and accountable closeout."
      metrics={metrics}
      outcomes={outcomes}
      workflow={workflow}
      proof={proof}
      ctaId="renovation_primary"
    />
  );
}
