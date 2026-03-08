import React, { useEffect, memo } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PageLayout from './components/PageLayout';
import './styles.css';

const CoreValues = memo(() => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  return (
    <PageLayout
      meta={{
        title: 'Core Values | Construction Operations Portal',
        description: 'See the core values behind Construction Operations Portal, from integrity and excellence to safety and sustainability in field execution.',
      }}
    >
      <section className="core-values" role="main">
        <div className="container">
          <div className="commitment-hero" data-aos="fade-up">
            <div className="commitment-hero-copy">
              <p className="commitment-kicker">Commitment</p>
              <h1>Our Core Values</h1>
              <p className="commitment-intro">
                These principles describe the working standard behind the portfolio: how teams make decisions, represent the company, and keep projects moving responsibly.
              </p>
            </div>
            <div className="commitment-hero-side">
              <div className="commitment-stat">
                <strong>Client trust</strong>
                <span>Value statements are framed around what makes execution dependable and repeatable.</span>
              </div>
              <div className="commitment-stat">
                <strong>Operational clarity</strong>
                <span>Each value supports decision-making on site, in planning, and in stakeholder communication.</span>
              </div>
            </div>
          </div>
          <div className="values-list">
            <div className="value-item commitment-card" data-aos="fade-up" data-aos-delay="100">
              <p className="commitment-card-kicker">Character</p>
              <h2>Integrity</h2>
              <p>We uphold the highest standards of honesty and ethics in all our dealings.</p>
            </div>
            <div className="value-item commitment-card" data-aos="fade-up" data-aos-delay="200">
              <p className="commitment-card-kicker">Quality</p>
              <h2>Excellence</h2>
              <p>We strive for perfection in every project, delivering superior quality and craftsmanship.</p>
            </div>
            <div className="value-item commitment-card" data-aos="fade-up" data-aos-delay="300">
              <p className="commitment-card-kicker">Protection</p>
              <h2>Safety</h2>
              <p>We prioritize the safety of our team, clients, and communities in every endeavor.</p>
            </div>
            <div className="value-item commitment-card" data-aos="fade-up" data-aos-delay="400">
              <p className="commitment-card-kicker">Responsibility</p>
              <h2>Sustainability</h2>
              <p>We are committed to environmentally responsible practices that benefit future generations.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default CoreValues;
