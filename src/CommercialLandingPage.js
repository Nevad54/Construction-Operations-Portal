import React from 'react';
import ServiceLandingPage from './ServiceLandingPage';

const metrics = [
  { value: 'Multi-trade', label: 'Commercial coordination' },
  { value: 'Fast-turn', label: 'Client-facing response cadence' },
  { value: 'Visible', label: 'Delivery status checkpoints' },
];

const outcomes = [
  {
    title: 'Cleaner stakeholder updates',
    description: 'Give owners, facilities teams, and decision-makers a simple execution picture.',
  },
  {
    title: 'Better trade alignment',
    description: 'Reduce avoidable clashes between civil, architectural, and MEPF work streams.',
  },
  {
    title: 'Tighter delivery confidence',
    description: 'Use planning and field coordination to keep commitments realistic and visible.',
  },
];

const workflow = [
  {
    title: 'Define scope and milestones',
    description: 'Set expectations early around timeline, approvals, procurement, and site readiness.',
  },
  {
    title: 'Coordinate execution windows',
    description: 'Sequence work so active commercial operations face fewer disruptions.',
  },
  {
    title: 'Close with accountability',
    description: 'Track issues, follow-up items, and operational handoff actions through completion.',
  },
];

const proof = [
  'Lead capture and project follow-through stay visible from first conversation through execution.',
  'Stakeholder updates are easier to manage when status, ownership, and next actions stay in one flow.',
  'Reporting highlights new inquiries, overdue follow-ups, and delivery momentum.',
];

export default function CommercialLandingPage() {
  return (
    <ServiceLandingPage
      eyebrow="Commercial Execution"
      title="Commercial construction support for teams that need coordination without chaos."
      subtitle="Office, retail, facility, and mixed-use work for teams that care about communication, speed, and delivery control."
      metaTitle="Commercial Delivery | Construction Operations Portal"
      metaDescription="Commercial construction support for office, retail, facility, and mixed-use work that needs clear coordination, stakeholder updates, and delivery control."
      metrics={metrics}
      outcomes={outcomes}
      workflow={workflow}
      proof={proof}
      ctaId="commercial_primary"
    />
  );
}
