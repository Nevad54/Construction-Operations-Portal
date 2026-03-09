import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import './styles.css';

const portalPillars = [
  {
    title: 'One project record',
    description: 'Keep files, updates, next actions, and owner visibility in one place instead of spreading them across calls, messages, and ad hoc spreadsheets.',
  },
  {
    title: 'Faster client decisions',
    description: 'Give clients a clear place to review project material, see progress context, and respond without waiting for the next status meeting.',
  },
  {
    title: 'Cleaner handoffs',
    description: 'Track follow-ups, shared documents, and operational ownership through execution and closeout.',
  },
];

const portalFeatures = [
  'Client-shared files with role-based access control',
  'Admin inquiry ownership and follow-up tracking',
  'Project status visibility for internal teams',
  'Activity and reporting signals for operators',
  'Authenticated admin verification and release smoke coverage',
  'Structured contact intake tied to the delivery workflow',
];

const portalScenarios = [
  {
    title: 'During preconstruction',
    description: 'Use the portal to keep intake, clarifications, and next actions visible from the first assessment through scope alignment.',
  },
  {
    title: 'During active work',
    description: 'Share the current project record, documents, and updates so site conversations stay grounded in the same source of truth.',
  },
  {
    title: 'During closeout',
    description: 'Keep client-facing files, final follow-ups, and handoff materials accessible until the work is fully settled.',
  },
];

export default function ClientPortal() {
  return (
    <PageLayout
      meta={{
        title: 'Client Portal | Construction Operations Portal',
        description: 'See how the client portal supports project visibility, shared files, follow-up accountability, and cleaner construction communication.',
      }}
    >
      <section className="portal-page">
        <div className="container">
          <section className="portal-hero">
            <div className="portal-hero-copy">
              <p className="portal-kicker">Client Experience</p>
              <h1>Client visibility built into the delivery workflow, not bolted on after the fact.</h1>
              <p className="portal-lead">
                Construction Operations Portal is not just a public website. It is the client-facing operating layer
                that keeps project files, follow-ups, and status conversations easier to manage once the work starts moving.
              </p>
              <div className="hero-actions">
                <Link to="/contact" className="btn" aria-label="Request a site assessment">
                  Request Site Assessment
                </Link>
                <Link to="/projects" className="btn btn-secondary" aria-label="View project proof">
                  View Project Proof
                </Link>
              </div>
            </div>
            <div className="portal-hero-panel" aria-label="Client portal value summary">
              <div className="portal-highlight">
                <strong>For clients</strong>
                <span>Shared files, clearer updates, and less status chasing.</span>
              </div>
              <div className="portal-highlight">
                <strong>For project teams</strong>
                <span>One accountable place to manage follow-ups, visibility, and handoff materials.</span>
              </div>
              <div className="portal-highlight">
                <strong>For operators</strong>
                <span>Reporting, role controls, and admin workflow guardrails that keep delivery organized.</span>
              </div>
            </div>
          </section>

          <section className="portal-section">
            <div className="portal-section-header">
              <p className="portal-kicker">Why it matters</p>
              <h2>A client app only helps if it removes friction from the real job.</h2>
              <p>
                The portal is positioned here as a delivery advantage: fewer missed follow-ups, clearer project records,
                and a better client experience once execution starts.
              </p>
            </div>
            <div className="portal-card-grid">
              {portalPillars.map((item) => (
                <article key={item.title} className="portal-card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="portal-section portal-section-muted">
            <div className="portal-section-header">
              <p className="portal-kicker">Current capabilities</p>
              <h2>What the portal already supports</h2>
            </div>
            <div className="portal-feature-shell">
              <ul className="portal-feature-list">
                {portalFeatures.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="portal-proof-card">
                <h3>Positioning note</h3>
                <p>
                  This product works best as a hybrid offer: a construction operations partner with a client portal that
                  improves visibility, communication, and accountability.
                </p>
                <p>
                  That is stronger than pretending the app is pure SaaS when the rest of the product clearly depends on
                  delivery expertise and operational trust.
                </p>
              </div>
            </div>
          </section>

          <section className="portal-section">
            <div className="portal-section-header">
              <p className="portal-kicker">Where it shows up</p>
              <h2>How clients experience it across the project lifecycle</h2>
            </div>
            <div className="portal-scenario-grid">
              {portalScenarios.map((item) => (
                <article key={item.title} className="portal-scenario-card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PageLayout>
  );
}
