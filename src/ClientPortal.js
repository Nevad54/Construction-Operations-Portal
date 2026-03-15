import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import './styles.css';

const portalPillars = [
  {
    title: 'One project record',
    description: 'Keep files, updates, and next actions in one place.',
  },
  {
    title: 'Clearer client decisions',
    description: 'Give clients one clear place to review and respond.',
  },
  {
    title: 'Cleaner staff handoffs',
    description: 'Track follow-ups and shared documents through execution and closeout.',
  },
];

const portalFeatures = [
  'Clients review shared files and current project context',
  'Staff track inquiry ownership and follow-up commitments',
  'Project status stays visible to the teams managing delivery',
  'Admins control access, password recovery, and setup safeguards',
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
                A client-facing workspace for files, updates, and follow-ups once the work is moving.
              </p>
              <div className="hero-actions">
                <Link to="/contact" className="btn" aria-label="Request a site assessment">
                  Request Site Assessment
                </Link>
                <Link to="/projects" className="btn btn-secondary" aria-label="View project proof">
                  View Project Proof
                </Link>
              </div>
              <div className="portal-auth-actions" aria-label="Portal account access">
                <Link to="/signin" className="portal-auth-link">
                  Sign in
                </Link>
                <Link to="/signup" className="portal-auth-link">
                  Create account
                </Link>
                <Link to="/staff/signin" className="portal-auth-link">
                  Staff sign-in
                </Link>
              </div>
              <p className="portal-lead">Clients use the public account path. Staff use staff sign-in.</p>
            </div>
            <div className="portal-hero-panel" aria-label="Client portal value summary">
              <div className="portal-highlight">
                <strong>For clients</strong>
                <span>Shared files, clearer updates, and less status chasing.</span>
              </div>
              <div className="portal-highlight">
                <strong>For teams</strong>
                <span>One accountable place to manage follow-ups, visibility, and handoff materials.</span>
              </div>
            </div>
          </section>

          <section className="portal-section">
            <div className="portal-section-header">
              <p className="portal-kicker">Why it matters</p>
              <h2>A client app only helps if it removes friction from the real job.</h2>
              <p>Fewer missed follow-ups, clearer records, and a better client experience once execution starts.</p>
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
                <p>Best presented as a construction operations offer with a client portal, not as a standalone SaaS pitch.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </PageLayout>
  );
}
