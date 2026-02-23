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
    <PageLayout>
      <section className="core-values" role="main">
        <div className="container">
          <h1 data-aos="fade-up">Our Core Values</h1>
          <div className="values-list">
            <div className="value-item" data-aos="fade-up" data-aos-delay="100">
              <h2>Integrity</h2>
              <p>We uphold the highest standards of honesty and ethics in all our dealings.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="200">
              <h2>Excellence</h2>
              <p>We strive for perfection in every project, delivering superior quality and craftsmanship.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="300">
              <h2>Safety</h2>
              <p>We prioritize the safety of our team, clients, and communities in every endeavor.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="400">
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
