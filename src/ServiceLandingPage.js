import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { trackEvent } from './utils/analytics';
import './styles.css';

export default function ServiceLandingPage({
  eyebrow,
  title,
  subtitle,
  heroImage,
  heroImageAlt = '',
  metrics,
  outcomes,
  workflow,
  proof,
  clientExperience,
  clientExperienceTitle = 'How clients stay aligned',
  clientExperienceIntro = 'A visible communication rhythm that keeps active work, shared documents, and next decisions from drifting.',
  ctaId,
  metaTitle,
  metaDescription,
}) {
  return (
    <PageLayout
      meta={{
        title: metaTitle,
        description: metaDescription,
      }}
    >
      <section className="landing-hero">
        <div className="container landing-grid">
          <div className="landing-copy">
            <p className="landing-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="landing-subtitle">{subtitle}</p>
            <div className="hero-actions landing-hero-actions">
              <Link
                to="/contact"
                className="btn"
                aria-label="Request a site assessment"
                onClick={() => trackEvent('cta_click', { ctaId, destination: '/contact' })}
              >
                Request Site Assessment
              </Link>
              <Link to="/projects" className="btn btn-secondary" aria-label="View projects">
                View Projects
              </Link>
            </div>
          </div>
          <div className="landing-aside">
            {heroImage ? (
              <div className="landing-hero-media">
                <img src={heroImage} alt={heroImageAlt} loading="eager" decoding="async" />
              </div>
            ) : null}
            <div className="landing-metrics" aria-label="Delivery metrics">
              {metrics.map((metric) => (
                <div key={metric.label} className="landing-metric-card">
                  <p className="landing-metric-value">{metric.value}</p>
                  <p className="landing-metric-label">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <h2>What this offer solves</h2>
            <p>Built for teams that need delivery certainty and cleaner handoffs.</p>
          </div>
          <div className="landing-card-grid">
            {outcomes.map((item) => (
              <article key={item.title} className="landing-info-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-muted">
        <div className="container">
          <div className="landing-section-header">
            <h2>How we execute</h2>
            <p>A practical workflow from pre-work through handoff.</p>
          </div>
          <div className="landing-workflow">
            {workflow.map((step, index) => (
              <div key={step.title} className="landing-step">
                <span className="landing-step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {Array.isArray(clientExperience) && clientExperience.length > 0 && (
        <section className="landing-section">
          <div className="container">
            <div className="landing-section-header">
              <h2>{clientExperienceTitle}</h2>
              <p>{clientExperienceIntro}</p>
            </div>
            <div className="landing-card-grid">
              {clientExperience.map((item) => (
                <article key={item.title} className="landing-info-card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="landing-section">
        <div className="container landing-proof-shell">
          <div className="landing-proof-card">
            <h2>Proof points</h2>
            <ul className="landing-proof-list">
              {proof.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="landing-cta-card">
            <h2>Need a delivery plan that holds up on site?</h2>
            <p>Share your constraints, timeline, and scope. We will respond with the next step.</p>
            <Link
              to="/contact"
              className="btn"
              aria-label="Request a site assessment"
              onClick={() => trackEvent('cta_click', { ctaId: `${ctaId}_footer`, destination: '/contact' })}
            >
              Request Site Assessment
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
