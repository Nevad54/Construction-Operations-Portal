import React, { useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import './styles.css';

const About = memo(() => {
  useEffect(() => {
    // page-specific effects (e.g. AOS init) can go here
  }, []);

  return (
    <PageLayout
      meta={{
        title: 'About | Construction Operations Portal',
        description: 'Learn how Construction Operations Portal combines construction delivery expertise with client-facing project visibility, safety discipline, and field coordination.',
      }}
    >
      <section className="about">
        <div className="container">
          <div className="about-hero">
            <div className="about-hero-copy fade-in">
              <p className="about-kicker">Who we are</p>
              <h1>Construction delivery backed by a client-facing operations portal.</h1>
              <p className="about-lead">
                We position this business as a hybrid offer: execution-focused construction support on the ground,
                with a structured portal experience that improves visibility once the work is moving.
              </p>
              <p className="about-intro">
                That means clients are not only buying labor and coordination. They are also buying a cleaner way to
                track updates, files, follow-ups, and handoff expectations through the project lifecycle.
              </p>
            </div>
            <div className="about-hero-side fade-in">
              <div className="about-stat">
                <strong>Execution-led</strong>
                <span>Planning, site coordination, and disciplined delivery across active jobs.</span>
              </div>
              <div className="about-stat">
                <strong>Portal-backed</strong>
                <span>Client visibility, shared files, and follow-up accountability are part of the operating model.</span>
              </div>
              <div className="about-stat">
                <strong>Safety-conscious</strong>
                <span>Industrial and commercial delivery still relies on safety discipline, schedule control, and qualified oversight.</span>
              </div>
            </div>
          </div>

          <div className="about-content">
            <div className="about-text fade-in">
              <h2>What we actually do</h2>
              <p>Our construction group delivers engineering-led project execution with a strong focus on safety, schedule reliability, and quality control.</p>
              <p>The delivery mix is centered on work that benefits from tighter coordination and cleaner reporting:</p>
              <ul className="about-list">
                <li>Structural, Civil, and Architectural Works</li>
                <li>Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works</li>
                <li>Fabrication and Automation for Industrial Plant Process Lines</li>
                <li>Maintenance Services in Manufacturing Plants</li>
              </ul>
            </div>
            <div className="about-image-shell fade-in">
              <img src="/Uploads/about-image.png" alt="Construction team on site" loading="lazy" />
              <div className="about-image-caption">
                <strong>Field visibility matters.</strong>
                <span>Construction and plant-support work both depend on clear handoffs, accountable updates, and stable execution rhythm.</span>
              </div>
            </div>
          </div>
          <section className="about-portal-strip fade-in" aria-labelledby="about-portal-heading">
            <div>
              <p className="about-kicker">Why the portal matters</p>
              <h2 id="about-portal-heading">Clients should not have to guess where the latest project record lives.</h2>
              <p>
                The client portal turns delivery communication into a repeatable process. Shared files, status context,
                and follow-up ownership stay visible instead of getting lost in fragmented message chains.
              </p>
            </div>
            <div className="about-portal-actions">
              <Link to="/client-portal" className="btn btn-secondary">
                Explore Client Portal
              </Link>
            </div>
          </section>
          <section className="about-values fade-in" aria-labelledby="about-values-heading">
            <p className="about-kicker">Working standard</p>
            <h2 id="about-values-heading">What we value in practice</h2>
            <div className="values-list">
              <div className="value-item commitment-card">
                <p className="commitment-card-kicker">Direction</p>
                <h3>Mission</h3>
                <p>Deliver dependable construction work with clearer client coordination and stronger field accountability.</p>
              </div>
              <div className="value-item commitment-card">
                <p className="commitment-card-kicker">Character</p>
                <h3>Integrity</h3>
                <p>Keep commitments realistic, communicate early, and avoid hiding execution risk from clients or teams.</p>
              </div>
              <div className="value-item commitment-card">
                <p className="commitment-card-kicker">Quality</p>
                <h3>Execution Discipline</h3>
                <p>Use planning, sequencing, and documentation to reduce preventable rework and handoff drift.</p>
              </div>
              <div className="value-item commitment-card">
                <p className="commitment-card-kicker">Protection</p>
                <h3>Safety</h3>
                <p>Protect people, property, and delivery continuity through qualified oversight and visible standards.</p>
              </div>
            </div>
          </section>
          <div className="about-location fade-in">
            <p className="about-kicker">Office footprint</p>
            <h2>Office Location</h2>
            <p>245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123</p>
            <div className="about-location-grid">
              <div className="about-location-card">
                <strong>Primary Focus</strong>
                <span>Construction delivery, industrial support, and field coordination workflows.</span>
              </div>
              <div className="about-location-card">
                <strong>Working Approach</strong>
                <span>Process-led delivery with emphasis on quality control, communication, execution discipline, and client visibility.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default About;
