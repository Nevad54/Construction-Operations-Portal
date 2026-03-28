import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import './styles.css';

const stats = [
  { label: 'Execution-led', desc: 'Planning, site coordination, and disciplined delivery.' },
  { label: 'Portal-backed', desc: 'Client visibility and shared files are part of the operating model.' },
  { label: 'Safety-conscious', desc: 'Qualified oversight, safety discipline, and schedule control.' },
];

const workItems = [
  'Structural, Civil, and Architectural Works',
  'Mechanical, Electrical, Plumbing, and Fire Protection (MEPF) Works',
  'Fabrication and Automation for Industrial Plant Process Lines',
  'Maintenance Services in Manufacturing Plants',
];

const About = memo(() => {
  return (
    <PageLayout
      meta={{
        title: 'About | Construction Operations Portal',
        description: 'Learn how Construction Operations Portal combines construction delivery expertise with client-facing project visibility, safety discipline, and field coordination.',
      }}
    >
      <section className="about" aria-labelledby="about-heading">
        <div className="container">

          {/* Hero */}
          <div className="about-hero">
            <div className="about-hero-copy">
              <p className="about-kicker">Who we are</p>
              <h1 id="about-heading">Construction delivery backed by a client-facing operations portal.</h1>
              <p className="about-lead">
                A hybrid offer: execution-focused construction support with a portal that keeps the project record visible.
              </p>
              <p className="about-intro">
                Clients get a cleaner way to follow updates, files, and handoff expectations through the job lifecycle.
              </p>
            </div>
            <div className="about-hero-side">
              {stats.map((s) => (
                <div key={s.label} className="about-stat">
                  <strong>{s.label}</strong>
                  <span>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What we do */}
          <div className="about-content">
            <div className="about-text">
              <h2>What we actually do</h2>
              <p>Engineering-led execution with a strong focus on safety, schedule reliability, and quality control.</p>
              <ul className="about-list">
                {workItems.map((item) => (
                  <li key={item}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true" style={{flexShrink:0, marginTop:'2px'}}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="about-image-shell">
              <img src="/Uploads/about-image.png" alt="Construction team on site" loading="lazy" width="560" height="380" />
              <div className="about-image-caption">
                <strong>Field visibility matters.</strong>
                <span>Construction and plant-support work both depend on clear handoffs, accountable updates, and stable execution rhythm.</span>
              </div>
            </div>
          </div>

          {/* Portal strip */}
          <section className="about-portal-strip" aria-labelledby="about-portal-heading">
            <div>
              <p className="about-kicker">Why the portal matters</p>
              <h2 id="about-portal-heading">Clients should not have to guess where the latest project record lives.</h2>
              <p>Shared files, status context, and follow-up ownership stay visible instead of getting lost in message chains.</p>
            </div>
            <div className="about-portal-actions">
              <Link to="/client-portal" className="btn btn--ghost btn--lg">
                Explore Client Portal
              </Link>
            </div>
          </section>

          {/* Location */}
          <div className="about-location">
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
