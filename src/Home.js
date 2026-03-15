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
  },
  {
    title: 'Residential',
    alt: 'Residential Projects',
    route: '/solutions/residential',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/residential.jpg`,
    fallbackClass: 'category-card--residential',
    kicker: 'Premium Homes',
    summary: 'Occupied-home renovations and premium fit-outs with cleaner owner updates and finish coordination.',
  },
  {
    title: 'Commercial',
    alt: 'Commercial Projects',
    route: '/solutions/commercial',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/commercial.jpg`,
    fallbackClass: 'category-card--commercial',
    kicker: 'Fit-Out Execution',
    summary: 'Commercial build-outs with milestone visibility and steadier trade coordination.',
  },
  {
    title: 'Renovation',
    alt: 'Renovation Projects',
    route: '/solutions/renovation',
    image: `${process.env.PUBLIC_URL || ''}/Uploads/renovation.jpg`,
    fallbackClass: 'category-card--renovation',
    kicker: 'Live-Site Upgrades',
    summary: 'Renovation work packaged to reduce disruption and keep change decisions visible.',
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
                Construction and industrial delivery with one clearer operating view for active work, client updates, and closeout.
              </h1>
              <p className="hero-subtitle">
                One place to track scope, files, follow-ups, and current project status without chasing updates across threads.
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
              <p>Pick the work type that matches your site, team, and delivery rhythm.</p>
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
              <p>Built around planning, coordination, and field execution.</p>
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
          </div>
        </section>
    </PageLayout>
  );
});

export default Home;
