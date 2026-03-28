import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { trackEvent } from './utils/analytics';
import './styles.css';

const services = [
  {
    tag: 'Execution',
    title: 'General Contracting',
    description: 'End-to-end execution for civil, architectural, and industrial projects with clear site coordination and disciplined delivery.',
    bullets: ['Site planning and phasing', 'Field execution oversight'],
  },
  {
    tag: 'Integrated',
    title: 'Design-Build',
    description: 'Integrated engineering and construction delivery through a single accountable team from early planning through handoff.',
    bullets: ['Single-team coordination', 'Fewer handoff gaps'],
  },
  {
    tag: 'Systems',
    title: 'MEPF Works',
    description: 'Mechanical, electrical, plumbing, and fire protection systems built for reliability, compliance, and maintainability.',
    bullets: ['MEPF scope alignment', 'Install and quality control'],
  },
  {
    tag: 'Industrial',
    title: 'Industrial Fabrication',
    description: 'Custom fabrication and process-line improvements for manufacturing environments that need precision and operational continuity.',
    bullets: ['Fabrication workflow support', 'Process-line improvements'],
  },
  {
    tag: 'Support',
    title: 'Plant Maintenance Support',
    description: 'Skilled manpower and technical support to keep operations stable, safe, and responsive to production demands.',
    bullets: ['Maintenance manpower', 'Field technical support'],
  },
  {
    tag: 'Planning',
    title: 'Technical Consulting',
    description: 'Practical advisory support for planning, phasing, procurement, and execution risks before they slow the job down.',
    bullets: ['Execution risk review', 'Procurement and planning input'],
  },
];

const Services = () => {
  return (
    <PageLayout
      meta={{
        title: 'Services | Construction Operations Portal',
        description: 'Explore construction, MEPF, industrial fabrication, plant support, and technical consulting services built around disciplined delivery and site coordination.',
      }}
    >
      <section className="services-page" aria-labelledby="services-heading">
        <div className="container">

          {/* Hero */}
          <div className="services-page-hero">
            <div className="services-page-copy">
              <p className="services-page-kicker">Delivery support</p>
              <h1 id="services-heading">Our Services</h1>
              <p className="services-intro">
                Construction and industrial support built around planning, coordination, and dependable execution.
              </p>
              <div className="hero-actions">
                <Link
                  to="/contact"
                  className="btn btn--primary btn--lg"
                  aria-label="Request a site assessment"
                  onClick={() => trackEvent('cta_click', { ctaId: 'services_primary', destination: '/contact' })}
                >
                  Request Site Assessment
                </Link>
                <Link to="/projects" className="btn btn--ghost btn--lg" aria-label="View projects">
                  View Projects
                </Link>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="services-page-grid">
            {services.map((service) => (
              <article key={service.title} className="services-page-card">
                <span className="services-page-tag">{service.tag}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul>
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

        </div>
      </section>
    </PageLayout>
  );
};

export default Services;
