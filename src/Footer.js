import React from 'react';
import { trackEvent } from './utils/analytics';
import './styles.css';

const officeMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Imus+Cavite';

const coverageAreas = ['Industrial', 'Commercial', 'Renovation', 'Residential'];
const contactChannels = [
  { label: 'Response', value: 'Next-business-day assessment follow-up' },
  { label: 'Coordination', value: 'Phone, email, and structured site updates' },
];

const Footer = () => {
  return (
    <>
      <section className="footer-info" aria-label="Company contact details">
        <div className="container">
          <div className="footer-item">
            <p className="footer-kicker">Start the conversation</p>
            <h2>Request Site Assessment</h2>
            <p>Share the site, scope, or support need. We will reply with the next step.</p>
            <a
              href="/contact"
              className="btn"
              aria-label="Request a site assessment"
              onClick={() => trackEvent('cta_click', { ctaId: 'footer_primary', destination: '/contact' })}
            >
              Request Site Assessment
            </a>
            <p>Quick first contact, clear next step.</p>
          </div>
          <div className="footer-item">
            <p className="footer-kicker">Coverage and Contact</p>
            <h2>Field coordination from one operating base</h2>
            <p className="footer-location-line"><i className="fas fa-location-arrow" aria-hidden="true"></i> 245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123</p>
            <div className="location-card">
              <div className="location-hero">
                <div>
                  <p className="location-hero-kicker">Primary Coverage</p>
                  <h3>Industrial, commercial, renovation, and residential support.</h3>
                </div>
                <a className="btn btn-secondary" href={officeMapsUrl} target="_blank" rel="noreferrer">
                  View Office Area
                </a>
              </div>
              <div className="coverage-pills" aria-label="Primary coverage sectors">
                {coverageAreas.map((area) => (
                  <span key={area} className="coverage-pill">{area}</span>
                ))}
              </div>
              <div className="location-meta">
                {contactChannels.map((item) => (
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

      <footer role="contentinfo">
        <div className="container_footer">
          <p>&copy; 2025 Construction Operations Portal. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;

