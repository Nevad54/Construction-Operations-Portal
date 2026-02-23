import React, { useEffect, memo } from 'react';
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
    <PageLayout>
      <section className="vision-mission" role="main">
        <div className="container">
          <h1 data-aos="fade-up">Vision & Mission</h1>
          <div className="vision" data-aos="fade-right" data-aos-delay="100">
            <h2>Our Vision</h2>
            <p>To be the leading construction and industrial solutions provider, recognized for innovation, quality, and sustainability.</p>
          </div>
          <div className="mission" data-aos="fade-left" data-aos-delay="200">
            <h2>Our Mission</h2>
            <p>We are committed to delivering exceptional projects through technical expertise, client collaboration, and a focus on safety and environmental responsibility.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default VisionMission;