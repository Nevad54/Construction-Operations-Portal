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
                A hybrid offer: execution-focused construction support with a portal that keeps the project record visible.
              </p>
              <p className="about-intro">
                Clients get a cleaner way to follow updates, files, and handoff expectations through the job lifecycle.
              </p>
            </div>
            <div className="about-hero-side fade-in">
              <div className="about-stat">
                <strong>Execution-led</strong>
                <span>Planning, site coordination, and disciplined delivery.</span>
              </div>
              <div className="about-stat">
                <strong>Portal-backed</strong>
                <span>Client visibility and shared files are part of the operating model.</span>
              </div>
              <div className="about-stat">
                <strong>Safety-conscious</strong>
                <span>Qualified oversight, safety discipline, and schedule control.</span>
              </div>
            </div>
          </div>

          <div className="about-content">
            <div className="about-text fade-in">
              <h2>What we actually do</h2>
              <p>Engineering-led execution with a strong focus on safety, schedule reliability, and quality control.</p>
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
              <p>Shared files, status context, and follow-up ownership stay visible instead of getting lost in message chains.</p>
            </div>
            <div className="about-portal-actions">
              <Link to="/client-portal" className="btn btn-secondary">
                Explore Client Portal
              </Link>
            </div>
          </section>
          <div className="about-location fade-in">
            <p className="about-kicker">Office footprint</p>
            <h2>Office Location</h2>
            <p>245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123</p>
            <p>Construction delivery, industrial support, and field coordination from one operating base.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default About;
