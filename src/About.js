import React, { useEffect, memo } from 'react';
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
        description: 'Learn how Construction Operations Portal supports industrial, commercial, and construction teams with execution-focused delivery, planning, and field coordination.',
      }}
    >
      <section className="about">
        <div className="container">
          <div className="about-hero">
            <div className="about-hero-copy fade-in">
              <p className="about-kicker">Who we support</p>
              <h1>About Us</h1>
              <p className="about-lead">
                Built for long-term partnerships, our team combines construction expertise and industrial support
                to help clients deliver critical projects with confidence.
              </p>
              <p className="about-intro">
                We operate as an execution-focused construction and operations partner with emphasis on safety,
                schedule reliability, and practical field coordination.
              </p>
            </div>
            <div className="about-hero-side fade-in">
              <div className="about-stat">
                <strong>Execution-led</strong>
                <span>Planning, site coordination, and disciplined delivery across active jobs.</span>
              </div>
              <div className="about-stat">
                <strong>Industrial support</strong>
                <span>Manufacturing, process-line, and maintenance environments supported alongside construction work.</span>
              </div>
              <div className="about-stat">
                <strong>Client-ready communication</strong>
                <span>Clear updates, accountable follow-through, and a reporting rhythm teams can trust.</span>
              </div>
            </div>
          </div>

          <div className="about-content">
            <div className="about-text fade-in">
              <h2>Company Overview</h2>
              <p>Our construction group delivers engineering-led project execution with a strong focus on safety, schedule reliability, and quality control.</p>
              <p>The company is primarily engaged in general construction services, including:</p>
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
          <div className="about-services fade-in">
            <p className="about-kicker">Supply support</p>
            <h2>Secondary Business Lines</h2>
            <p>As a secondary line of business, we supply both imported and locally sourced materials, including:</p>
            <ul className="about-list about-list--columns">
              <li>Painting Equipment and Parts</li>
              <li>Industrial Tapes</li>
              <li>Valves, Brass, and Stainless Fittings</li>
              <li>Abrasives and Sealers</li>
              <li>Wiping Rags</li>
              <li>Automation and Control Materials</li>
              <li>Other Productive and Non-productive Materials for Car Manufacturing</li>
            </ul>
          </div>
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
                <span>Process-led delivery with emphasis on quality control, communication, and execution discipline.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default About;
