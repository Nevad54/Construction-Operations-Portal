import React, { useEffect, memo } from 'react';
import PageLayout from './components/PageLayout';
import './styles.css';

const About = memo(() => {
  useEffect(() => {
    // page-specific effects (e.g. AOS init) can go here
  }, []);

  return (
    <PageLayout>
      <section className="about" role="main">
        <div className="container">
          <h1>About Us</h1>
          <div className="about-content">
            <div className="about-text fade-in">
              <h2>Company Overview</h2>
              <p>Mastertech Intergrouppe Inc. was duly incorporated and registered with the Securities and Exchange Commission (SEC) on February 13, 2014, under SEC Certificate No. CS201402904.</p>
              <p>The Company is primarily engaged in General Construction Services, including but not limited to:</p>
              <ul>
                <li>Structural, Civil, and Architectural Works</li>
                <li>Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works</li>
                <li>Fabrication and Automation for Industrial Plant Process Lines</li>
                <li>Maintenance Services in Manufacturing Plants</li>
              </ul>
            </div>
            <div className="about-image fade-in">
              <img src="/Uploads/about-image.png" alt="MASTERTECH Headquarters" loading="lazy" />
            </div>
          </div>
          <div className="about-services fade-in">
            <h2>Secondary Business Lines</h2>
            <p>As a secondary line of business, we supply both imported and locally sourced materials, including:</p>
            <ul>
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
            <h2>Office Location</h2>
            <p>Sta Rosa Tagaytay Road Purok 4, Brgy. Pasong Langka, Silang Cavite 4118</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default About;
