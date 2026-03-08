import React from 'react';
import ServiceLandingPage from './ServiceLandingPage';

const metrics = [
  { value: '24/7', label: 'Plant-aware support mindset' },
  { value: '3-phase', label: 'Plan-build-handover workflow' },
  { value: '1 owner', label: 'Single accountable lead' },
];

const outcomes = [
  {
    title: 'Less downtime pressure',
    description: 'Plan work around production constraints so site activity does not become the blocker.',
  },
  {
    title: 'Clear field coordination',
    description: 'Align engineering, fabrication, site work, and operations around one execution path.',
  },
  {
    title: 'Safer handoffs',
    description: 'Document scope, dependencies, and follow-up actions so operations teams are not left guessing.',
  },
];

const workflow = [
  {
    title: 'Assess site constraints',
    description: 'Capture operating windows, access limitations, shutdown sensitivity, and execution risks.',
  },
  {
    title: 'Sequence the work',
    description: 'Build a practical delivery plan for fabrication, installation, testing, and turnover.',
  },
  {
    title: 'Drive field execution',
    description: 'Coordinate trades, materials, and decision points so site work stays controlled.',
  },
];

const proof = [
  'Built for industrial fabrication, plant improvements, and MEPF-heavy execution.',
  'Structured follow-up ownership keeps plant decisions from drifting between teams.',
  'Reporting rhythm stays visible from initial assessment through handover.',
];

export default function IndustrialLandingPage() {
  return (
    <ServiceLandingPage
      eyebrow="Industrial Delivery"
      title="Industrial project execution for plants that cannot afford coordination drift."
      subtitle="Plant upgrades, fabrication support, maintenance-driven scopes, and field work planned to fit around live operations."
      metaTitle="Industrial Delivery | Construction Operations Portal"
      metaDescription="Industrial project execution for plant upgrades, fabrication support, and maintenance-driven scopes that need tighter coordination around live operations."
      metrics={metrics}
      outcomes={outcomes}
      workflow={workflow}
      proof={proof}
      ctaId="industrial_primary"
    />
  );
}
