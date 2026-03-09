import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { trackEvent } from './utils/analytics';
import './styles.css';

const Services = () => {
  useEffect(() => {
    // no-op
  }, []);

  const services = [
    { tag: 'Execution', title: 'General Contracting', description: 'End-to-end execution for civil, architectural, and industrial projects with clear site coordination and disciplined delivery.', bullets: ['Site planning and phasing', 'Field execution oversight'] },
    { tag: 'Integrated', title: 'Design-Build', description: 'Integrated engineering and construction delivery through a single accountable team from early planning through handoff.', bullets: ['Single-team coordination', 'Fewer handoff gaps'] },
    { tag: 'Systems', title: 'MEPF Works', description: 'Mechanical, electrical, plumbing, and fire protection systems built for reliability, compliance, and maintainability.', bullets: ['MEPF scope alignment', 'Install and quality control'] },
    { tag: 'Industrial', title: 'Industrial Fabrication', description: 'Custom fabrication and process-line improvements for manufacturing environments that need precision and operational continuity.', bullets: ['Fabrication workflow support', 'Process-line improvements'] },
    { tag: 'Support', title: 'Plant Maintenance Support', description: 'Skilled manpower and technical support to keep operations stable, safe, and responsive to production demands.', bullets: ['Maintenance manpower', 'Field technical support'] },
    { tag: 'Planning', title: 'Technical Consulting', description: 'Practical advisory support for planning, phasing, procurement, and execution risks before they slow the job down.', bullets: ['Execution risk review', 'Procurement and planning input'] },
  ];

  return (
    <PageLayout
      meta={{
        title: 'Services | Construction Operations Portal',
        description: 'Explore construction, MEPF, industrial fabrication, plant support, and technical consulting services built around disciplined delivery and site coordination.',
      }}
    >
      <section className="services-page">
        <div className="container">
          <div className="services-page-hero">
            <div className="services-page-copy">
              <p className="services-page-kicker">Delivery support</p>
              <h1>Our Services</h1>
              <p className="services-intro">
                We support construction and industrial teams that need disciplined planning, dependable field execution, and clearer delivery accountability.
              </p>
              <div className="hero-actions">
                <Link
                  to="/contact"
                  className="btn"
                  aria-label="Request a site assessment"
                  onClick={() => trackEvent('cta_click', { ctaId: 'services_primary', destination: '/contact' })}
                >
                  Request Site Assessment
                </Link>
                <Link to="/projects" className="btn btn-secondary" aria-label="View projects">
                  View Projects
                </Link>
              </div>
            </div>
            <div className="services-page-side">
              <div className="services-page-stat">
                <strong>6 Core Services</strong>
                <span>Built around planning, coordination, and field execution.</span>
              </div>
              <div className="services-page-stat">
                <strong>Construction + Industrial</strong>
                <span>Designed to cover both project delivery and plant support workflows.</span>
              </div>
              <div className="services-page-stat">
                <strong>Commercial + Residential clarity</strong>
                <span>Built to support straightforward owner communication, cleaner site decisions, and better handoffs.</span>
              </div>
            </div>
          </div>

          <div className="services-page-grid">
            {services.map((service) => (
              <article key={service.title} className="services-page-card">
                <span className="services-page-tag">{service.tag}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul>
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="services-page-strip" aria-label="How services are delivered">
            <div>
              <strong>Plan</strong>
              <span>Scope, phasing, and site-readiness alignment before work accelerates.</span>
            </div>
            <div>
              <strong>Coordinate</strong>
              <span>Visible handoffs across field teams, stakeholders, and dependencies.</span>
            </div>
            <div>
              <strong>Execute</strong>
              <span>Delivery rhythm focused on safety, accountability, and clear reporting.</span>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Services;
