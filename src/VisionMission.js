import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PageLayout from './components/PageLayout';
import './styles.css';

const VisionMission = () => {
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
        title: 'Vision & Mission | Construction Operations Portal',
        description: 'Read the vision and mission that shape Construction Operations Portal around execution discipline, client coordination, and long-term delivery quality.',
      }}
    >
      <section className="vision-mission" role="main">
        <div className="container">
          <div className="commitment-hero" data-aos="fade-up">
            <div className="commitment-hero-copy">
              <p className="commitment-kicker">Commitment</p>
              <h1>Vision & Mission</h1>
              <p className="commitment-intro">
                These statements anchor how the portfolio positions the company: execution-minded, client-aware, and disciplined about long-term delivery quality.
              </p>
            </div>
            <div className="commitment-hero-side">
              <div className="commitment-stat">
                <strong>Forward-looking</strong>
                <span>Focused on durable growth, operational credibility, and practical execution.</span>
              </div>
              <div className="commitment-stat">
                <strong>Field-grounded</strong>
                <span>Built around technical competence, client coordination, and responsible project delivery.</span>
              </div>
            </div>
          </div>
          <div className="commitment-grid">
            <div className="vision commitment-card" data-aos="fade-right" data-aos-delay="100">
              <p className="commitment-card-kicker">Direction</p>
              <h2>Our Vision</h2>
              <p>To be the leading construction and industrial solutions provider, recognized for innovation, quality, and sustainability.</p>
            </div>
            <div className="mission commitment-card" data-aos="fade-left" data-aos-delay="200">
              <p className="commitment-card-kicker">Operating promise</p>
              <h2>Our Mission</h2>
              <p>We are committed to delivering exceptional projects through technical expertise, client collaboration, and a focus on safety and environmental responsibility.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default VisionMission;
