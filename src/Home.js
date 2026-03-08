import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { trackEvent } from './utils/analytics';
import './styles.css';

const expertiseCards = [
  {
    title: 'Industrial',
    alt: 'Industrial Projects',
    route: '/solutions/industrial',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/industrial.jpg`,
    fallbackClass: 'category-card--industrial',
    kicker: 'Plant Delivery',
    summary: 'Shutdown coordination, fabrication sequencing, and plant-support execution built around production constraints.',
    highlights: ['Shutdown planning', 'Fabrication support']
  },
  {
    title: 'Residential',
    alt: 'Residential Projects',
    route: '/solutions/residential',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/residential.jpg`,
    fallbackClass: 'category-card--residential',
    kicker: 'Premium Homes',
    summary: 'High-touch residential delivery with cleaner owner communication, scope tracking, and handoff discipline.',
    highlights: ['Owner updates', 'Finish coordination']
  },
  {
    title: 'Commercial',
    alt: 'Commercial Projects',
    route: '/solutions/commercial',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/commercial.jpg`,
    fallbackClass: 'category-card--commercial',
    kicker: 'Fit-Out Execution',
    summary: 'Commercial build-outs with milestone visibility, trade coordination, and schedule control for active sites.',
    highlights: ['Trade alignment', 'Opening-readiness']
  },
  {
    title: 'Renovation',
    alt: 'Renovation Projects',
    route: '/solutions/renovation',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/renovation.jpg`,
    fallbackClass: 'category-card--renovation',
    kicker: 'Live-Site Upgrades',
    summary: 'Renovation work packaged to reduce disruption, manage phasing, and keep stakeholders aligned on changes.',
    highlights: ['Phased work', 'Site continuity']
  }
];

const serviceCards = [
  {
    icon: 'fas fa-hard-hat',
    title: 'General construction works',
    description: 'Structural, civil, site-development, and architectural packages managed with clear sequencing and field accountability.',
  },
  {
    icon: 'fas fa-bolt',
    title: 'MEPF systems delivery',
    description: 'Mechanical, electrical, plumbing, and fire-protection scopes aligned early to reduce clashes and commissioning drag.',
  },
  {
    icon: 'fas fa-industry',
    title: 'Industrial retrofit support',
    description: 'Fabrication, clean-room improvements, automation support, and plant-focused upgrades planned around operating constraints.',
  },
  {
    icon: 'fas fa-users-cog',
    title: 'Technical manpower support',
    description: 'Supplemental field and technical teams for manufacturing and operations-heavy environments that need immediate delivery capacity.',
  },
];

const servicePillars = [
  'Delivery plans shaped around site reality',
  'One accountable rhythm for updates and follow-ups',
  'Safer execution with clearer handoffs between teams',
];

const Home = memo(() => {
  return (
    <PageLayout
      meta={{
        title: 'Construction Operations Portal | Field-Ready Construction Delivery',
        description: 'Construction and industrial delivery support with clearer project visibility, site coordination, and field-ready execution across active jobs.',
      }}
    >
        <section className="hero" role="banner">
          <div className="hero-shell">
            <div className="hero-content">
              <p className="hero-eyebrow">Construction coordination platform</p>
              <h1>
                Construction and industrial delivery with clear planning, tight coordination, and field-ready execution.
              </h1>
              <p className="hero-subtitle">
                Construction Operations Portal gives facilities, commercial, and industrial teams one visible place to
                track scope, remove coordination drag, and keep execution moving.
              </p>
              <div className="hero-actions">
                <Link
                  to="/contact"
                  className="btn"
                  aria-label="Request a site assessment"
                  onClick={() => trackEvent('cta_click', { ctaId: 'home_primary', destination: '/contact' })}
                >
                  Request Site Assessment
                </Link>
                <Link to="/projects" className="btn btn-secondary" aria-label="View projects">
                  View Projects
                </Link>
              </div>
              <ul className="hero-highlights" aria-label="Key platform outcomes">
                <li>Visible project handoffs</li>
                <li>Faster field follow-ups</li>
                <li>Cleaner reporting rhythm</li>
              </ul>
            </div>
          </div>
        </section>
        <section className="home-expertise" aria-labelledby="home-expertise-heading">
          <div className="container">
            <div className="home-section-header">
              <div>
                <p className="home-section-kicker">Where We Deliver</p>
                <h2 id="home-expertise-heading">Execution models shaped for four construction environments.</h2>
              </div>
              <p>
                Each route is framed around a different operating rhythm so owners, facilities teams, and field leads
                can move from first assessment to active delivery with less friction.
              </p>
            </div>
            <div className="home-expertise-grid">
              {expertiseCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.route}
                  className={`home-expertise-card ${card.fallbackClass}`}
                >
                  <div className="home-expertise-media">
                    <img
                      src={card.image}
                      alt={card.alt}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        event.currentTarget.parentElement?.classList.add('home-expertise-media--image-fallback');
                      }}
                    />
                  </div>
                  <div className="home-expertise-content">
                    <p className="home-expertise-kicker">{card.kicker}</p>
                    <h3>{card.title} Projects</h3>
                    <p>{card.summary}</p>
                    <ul className="home-expertise-highlights" aria-label={`${card.title} project strengths`}>
                      {card.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="home-services-band" aria-labelledby="services-heading">
          <div className="container">
            <div className="home-section-header home-section-header--split">
              <div>
                <p className="home-section-kicker">How We Support Delivery</p>
                <h2 id="services-heading">Core service lines built to keep scopes moving from planning through handoff.</h2>
              </div>
              <p>
                From site works to plant support, the offer is organized around dependable coordination, practical sequencing,
                and reporting that gives decision-makers a cleaner picture of progress.
              </p>
            </div>
            <div className="home-services-grid">
              {serviceCards.map((service) => (
                <article key={service.title} className="home-service-card">
                  <div className="home-service-icon" aria-hidden="true">
                    <i className={service.icon}></i>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
            <div className="home-services-pillars" aria-label="Service delivery principles">
              {servicePillars.map((pillar) => (
                <div key={pillar} className="home-services-pillar">
                  {pillar}
                </div>
              ))}
            </div>
          </div>
        </section>
      <section className="portfolio-proof" aria-labelledby="proof-heading">
        <div className="container">
          <div className="proof-header">
            <p className="proof-eyebrow">Recent Outcomes</p>
            <h2 id="proof-heading">Selected delivery outcomes</h2>
            <p>
              Representative project stories across industrial, commercial, and operations-driven work where tighter
              coordination improved visibility, follow-through, and delivery control.
            </p>
          </div>
          <div className="proof-grid">
            <article className="proof-case">
              <span className="proof-tag">Industrial Retrofit</span>
              <h3>Plant upgrade coordination with tighter handoffs</h3>
              <p>
                Centralized follow-ups, project milestones, and field reporting so supervisors could track blockers
                without chasing updates across calls and spreadsheets.
              </p>
              <ul>
                <li>Reduced missed handoff items by 32%</li>
                <li>Shortened weekly status prep from 3 hours to 45 minutes</li>
                <li>Created one visible queue for overdue client actions</li>
              </ul>
            </article>
            <article className="proof-case">
              <span className="proof-tag">Commercial Fit-Out</span>
              <h3>Lead-to-project visibility for a growing contractor</h3>
              <p>
                Connected public inquiry capture to an admin pipeline with ownership, due dates, and reporting so
                incoming opportunities did not stall after first contact.
              </p>
              <ul>
                <li>Standardized inquiry stages across admin users</li>
                <li>Added KPI reporting for qualification and proposal flow</li>
                <li>Surfaced overdue follow-ups before they became lost leads</li>
              </ul>
            </article>
            <article className="proof-case">
              <span className="proof-tag">Operations Showcase</span>
              <h3>Operations reporting built for multi-stakeholder delivery</h3>
              <p>
                Unified project intake, follow-up ownership, and reporting so teams could manage delivery rhythm
                and client communication from one operating view.
              </p>
              <ul>
                <li>Stronger visibility across public and admin workflows</li>
                <li>Clear release checks before changes move forward</li>
                <li>Role-aware access for internal teams and client-facing users</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default Home;
