import React, { useEffect, memo } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PageLayout from './components/PageLayout';
import './styles.css';

const Safety = memo(() => {
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
        title: 'Safety | Construction Operations Portal',
        description: 'Review the safety commitment, risk prevention approach, and qualified oversight standards behind Construction Operations Portal delivery work.',
      }}
    >
      <section className="safety" role="main">
        <div className="container">
          <div className="commitment-hero" data-aos="fade-up">
            <div className="commitment-hero-copy">
              <p className="commitment-kicker">Commitment</p>
              <h1>Commitment to Safety</h1>
              <p className="commitment-intro">
                Safety is an operating requirement, not just a compliance statement.
              </p>
            </div>
            <div className="commitment-hero-side">
              <div className="commitment-stat">
                <strong>People first</strong>
                <span>Employees, partners, and the public are all inside the safety perimeter.</span>
              </div>
              <div className="commitment-stat">
                <strong>Execution discipline</strong>
                <span>Safe delivery improves consistency and operational efficiency.</span>
              </div>
            </div>
          </div>
          <div className="safety-content commitment-card" data-aos="fade-up" data-aos-delay="100">
            <p data-aos="fade-up" data-aos-delay="200">
              We prioritize the health and safety of employees, subcontractors, partners, and the public.
            </p>
            <p data-aos="fade-up" data-aos-delay="300">
              We work to prevent unsafe practices that could endanger people, property, or the environment.
            </p>
            <p data-aos="fade-up" data-aos-delay="400">
              Qualified safety personnel are given the authority to uphold these standards on site.
            </p>
          </div>
          <div className="safety-pillars" data-aos="fade-up" data-aos-delay="150">
            <div className="commitment-card">
              <p className="commitment-card-kicker">Control</p>
              <h2>Risk Prevention</h2>
              <p>Unsafe practices are addressed early through planning, supervision, and visible accountability.</p>
            </div>
            <div className="commitment-card">
              <p className="commitment-card-kicker">Oversight</p>
              <h2>Qualified Safety Leadership</h2>
              <p>Safety personnel are positioned with the authority and responsibility to uphold standards in the field.</p>
            </div>
            <div className="commitment-card">
              <p className="commitment-card-kicker">Performance</p>
              <h2>Operational Efficiency</h2>
              <p>Effective safety programs reinforce quality execution, steadier workflows, and better project control.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default Safety;
