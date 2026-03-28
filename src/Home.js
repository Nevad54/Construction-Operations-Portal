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
    summary: 'Shutdown coordination and plant-support execution built around production constraints.',
    stat: '40+ Sites',
  },
  {
    title: 'Residential',
    alt: 'Residential Projects',
    route: '/solutions/residential',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/residential.jpg`,
    fallbackClass: 'category-card--residential',
    kicker: 'Premium Homes',
    summary: 'Occupied-home renovations and premium fit-outs with cleaner owner updates and finish coordination.',
    stat: 'On-budget delivery',
  },
  {
    title: 'Commercial',
    alt: 'Commercial Projects',
    route: '/solutions/commercial',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/commercial.jpg`,
    fallbackClass: 'category-card--commercial',
    kicker: 'Fit-Out Execution',
    summary: 'Commercial build-outs with milestone visibility and steadier trade coordination.',
    stat: 'Multi-trade',
  },
  {
    title: 'Renovation',
    alt: 'Renovation Projects',
    route: '/solutions/renovation',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/renovation.jpg`,
    fallbackClass: 'category-card--renovation',
    kicker: 'Live-Site Upgrades',
    summary: 'Renovation work packaged to reduce disruption and keep change decisions visible.',
    stat: 'Zero downtime',
  },
];

const serviceCards = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'General construction works',
    description: 'Structural, civil, site-development, and architectural packages managed with clear sequencing and field accountability.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'MEPF systems delivery',
    description: 'Mechanical, electrical, plumbing, and fire-protection scopes aligned early to reduce clashes and commissioning drag.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Industrial retrofit support',
    description: 'Fabrication, clean-room improvements, automation support, and plant-focused upgrades planned around operating constraints.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: 'Technical manpower support',
    description: 'Supplemental field and technical teams for manufacturing and operations-heavy environments that need immediate delivery capacity.',
  },
];

const trustStats = [
  { value: '200+', label: 'Projects delivered' },
  { value: '98%', label: 'On-schedule completion' },
  { value: '4', label: 'Delivery verticals' },
  { value: '10+', label: 'Years field experience' },
];

const Home = memo(() => {
  return (
    <PageLayout
      meta={{
        title: 'Construction Operations Portal | Field-Ready Construction Delivery',
        description: 'Construction and industrial delivery support with clearer project visibility, site coordination, and field-ready execution across active jobs.',
      }}
    >
      {/* ── Hero ── */}
      <section className="hero" role="banner" aria-labelledby="hero-heading">
        <div className="hero-shell">
          <div className="hero-content">
            <p className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true"></span>
              Construction coordination platform
            </p>
            <h1 id="hero-heading">
              One platform for active construction work, client updates, and field closeout.
            </h1>
            <p className="hero-subtitle">
              Track scope, files, follow-ups, and project status without chasing updates across threads.
            </p>
            <div className="hero-actions">
              <Link
                to="/contact"
                className="btn btn--primary btn--lg"
                aria-label="Request a site assessment"
                onClick={() => trackEvent('cta_click', { ctaId: 'home_primary', destination: '/contact' })}
              >
                Request Site Assessment
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{marginLeft:'0.375rem'}}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link to="/projects" className="btn btn--ghost btn--lg" aria-label="View projects">
                View Projects
              </Link>
            </div>
            <ul className="hero-highlights" aria-label="Key platform outcomes">
              <li>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Visible project handoffs
              </li>
              <li>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Faster field follow-ups
              </li>
              <li>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Cleaner reporting rhythm
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="trust-bar" aria-label="Key statistics">
        <div className="container">
          <ul className="trust-bar__list" role="list">
            {trustStats.map((s) => (
              <li key={s.label} className="trust-bar__item">
                <span className="trust-bar__value">{s.value}</span>
                <span className="trust-bar__label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Expertise grid ── */}
      <section className="home-expertise" aria-labelledby="home-expertise-heading">
        <div className="container">
          <div className="home-section-header">
            <div>
              <p className="home-section-kicker">Where We Deliver</p>
              <h2 id="home-expertise-heading">Execution models shaped for four construction environments.</h2>
            </div>
            <p>Pick the work type that matches your site, team, and delivery rhythm.</p>
          </div>
          <div className="home-expertise-grid">
            {expertiseCards.map((card) => (
              <Link
                key={card.title}
                to={card.route}
                className={`home-expertise-card ${card.fallbackClass}`}
                aria-label={`${card.title} projects — ${card.summary}`}
              >
                <div className="home-expertise-media">
                  <img
                    src={card.image}
                    alt={card.alt}
                    loading="lazy"
                    width="400"
                    height="260"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('home-expertise-media--image-fallback');
                    }}
                  />
                </div>
                <div className="home-expertise-content">
                  <p className="home-expertise-kicker">{card.kicker}</p>
                  <h3>{card.title} Projects</h3>
                  <p>{card.summary}</p>
                  <span className="home-expertise-stat">{card.stat}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services band ── */}
      <section className="home-services-band" aria-labelledby="services-heading">
        <div className="container">
          <div className="home-section-header home-section-header--split">
            <div>
              <p className="home-section-kicker">How We Support Delivery</p>
              <h2 id="services-heading">Core service lines built to keep scopes moving from planning through handoff.</h2>
            </div>
            <p>Built around planning, coordination, and field execution.</p>
          </div>
          <div className="home-services-grid">
            {serviceCards.map((service) => (
              <article key={service.title} className="home-service-card">
                <div className="home-service-icon" aria-hidden="true">
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="home-cta-band" aria-labelledby="cta-heading">
        <div className="container">
          <div className="home-cta-inner">
            <div className="home-cta-text">
              <h2 id="cta-heading">Ready to bring your site under one operating view?</h2>
              <p>Connect with the team and we will map the right coordination model for your next project.</p>
            </div>
            <div className="home-cta-actions">
              <Link
                to="/contact"
                className="btn btn--primary btn--lg"
                onClick={() => trackEvent('cta_click', { ctaId: 'home_bottom', destination: '/contact' })}
              >
                Request a Site Assessment
              </Link>
              <Link to="/projects" className="btn btn--ghost-light btn--lg">
                See Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default Home;
