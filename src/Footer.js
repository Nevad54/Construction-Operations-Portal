import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from './utils/analytics';
import './styles.css';

const officeMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Imus+Cavite';

const NAV_COLUMNS = [
  {
    heading: 'Solutions',
    links: [
      { label: 'Industrial',   to: '/solutions/industrial' },
      { label: 'Commercial',   to: '/solutions/commercial' },
      { label: 'Renovation',   to: '/solutions/renovation' },
      { label: 'Residential',  to: '/solutions/residential' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',        to: '/about' },
      { label: 'Projects',     to: '/projects' },
      { label: 'Services',     to: '/services' },
      { label: 'Safety',       to: '/safety' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Client Portal', to: '/client-portal' },
      { label: 'Sign In',       to: '/signin' },
      { label: 'Create Account',to: '/signup' },
      { label: 'Contact',       to: '/contact' },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <>
      {/* ── Pre-footer info band ── */}
      <section className="footer-info" aria-label="Company contact details">
        <div className="container">
          <div className="footer-item">
            <p className="footer-kicker">Start the conversation</p>
            <h2>Request Site Assessment</h2>
            <p>Share the site, scope, or support need. We will reply with the next step.</p>
            <Link
              to="/contact"
              className="btn btn--primary btn--lg"
              aria-label="Request a site assessment"
              onClick={() => trackEvent('cta_click', { ctaId: 'footer_primary', destination: '/contact' })}
            >
              Request Site Assessment
            </Link>
            <p className="footer-sub-note">Quick first contact, clear next step.</p>
          </div>
          <div className="footer-item">
            <p className="footer-kicker">Coverage and Contact</p>
            <h2>Field coordination from one operating base</h2>
            <p className="footer-location-line">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true" style={{flexShrink:0}}>
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123
            </p>
            <div className="location-card">
              <div className="location-hero">
                <div>
                  <p className="location-hero-kicker">Primary Coverage</p>
                  <h3>Industrial, commercial, renovation, and residential support.</h3>
                </div>
                <a className="btn btn--ghost btn--sm" href={officeMapsUrl} target="_blank" rel="noreferrer noopener">
                  View Office Area
                </a>
              </div>
              <div className="coverage-pills" aria-label="Primary coverage sectors">
                {['Industrial', 'Commercial', 'Renovation', 'Residential'].map((area) => (
                  <span key={area} className="coverage-pill">{area}</span>
                ))}
              </div>
              <div className="location-meta">
                {[
                  { label: 'Response',      value: 'Next-business-day assessment follow-up' },
                  { label: 'Coordination',  value: 'Phone, email, and structured site updates' },
                ].map((item) => (
                  <div key={item.label} className="location-meta-item">
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main footer ── */}
      <footer role="contentinfo" className="site-footer">
        <div className="container site-footer__inner">

          {/* Brand column */}
          <div className="site-footer__brand">
            <Link to="/" className="logo-link" aria-label="Construction Operations Portal — Home">
              <span className="logo-wordmark">
                <span className="logo-wordmark-main">Construction</span>
                <span className="logo-wordmark-accent">Ops</span>
              </span>
            </Link>
            <p className="site-footer__tagline">
              Field-ready construction delivery with one clearer operating view for active work, client updates, and closeout.
            </p>
            <a
              href={officeMapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="site-footer__address"
              aria-label="Our office location on Google Maps"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Imus, Cavite — Philippines
            </a>
          </div>

          {/* Nav columns */}
          <nav className="site-footer__nav" aria-label="Footer navigation">
            {NAV_COLUMNS.map((col) => (
              <div key={col.heading} className="site-footer__col">
                <p className="site-footer__col-heading">{col.heading}</p>
                <ul role="list">
                  {col.links.map(({ label, to }) => (
                    <li key={label}>
                      <Link to={to} className="site-footer__link">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

        </div>

        {/* Legal bar */}
        <div className="site-footer__legal">
          <div className="container site-footer__legal-inner">
            <p>&copy; {year} Construction Operations Portal. All rights reserved.</p>
            <p className="site-footer__legal-right">Built for field-ready construction delivery.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
