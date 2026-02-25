import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const About = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="hero-content" data-aos="fade-up">
          <h1>About Construction Operations Group</h1>
          <p>Building Excellence Through Innovation</p>
        </div>
      </section>

      <section className="our-story">
        <div className="container">
          <div className="story-content">
            <div className="story-text" data-aos="fade-right">
              <h2>Our Story</h2>
              <p>Founded with a vision to improve engineering and construction delivery, our team has grown into a reliable execution partner for complex projects.</p>
            </div>
            <div className="story-image" data-aos="fade-left">
              <img src="/images/our-story.jpg" alt="Our Story" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="values">
        <div className="container">
          <h2 data-aos="fade-up">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-item" data-aos="fade-up" data-aos-delay="100">
              <h3>Excellence</h3>
              <p>We strive for excellence in every project we undertake.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="200">
              <h3>Innovation</h3>
              <p>Embracing new technologies and methodologies to deliver better results.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="300">
              <h3>Integrity</h3>
              <p>Maintaining the highest standards of professional integrity.</p>
            </div>
            <div className="value-item" data-aos="fade-up" data-aos-delay="400">
              <h3>Collaboration</h3>
              <p>Working together to achieve exceptional outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="team">
        <div className="container">
          <h2 data-aos="fade-up">Our Leadership Team</h2>
          <div className="team-grid">
            <div className="team-member" data-aos="zoom-in" data-aos-delay="100">
              <img src="/images/team/member1.jpg" alt="Team Member" loading="lazy" />
              <h3>John Doe</h3>
              <p>CEO & Founder</p>
            </div>
            <div className="team-member" data-aos="zoom-in" data-aos-delay="200">
              <img src="/images/team/member2.jpg" alt="Team Member" loading="lazy" />
              <h3>Jane Smith</h3>
              <p>Technical Director</p>
            </div>
            <div className="team-member" data-aos="zoom-in" data-aos-delay="300">
              <img src="/images/team/member3.jpg" alt="Team Member" loading="lazy" />
              <h3>Mike Johnson</h3>
              <p>Operations Manager</p>
            </div>
          </div>
        </div>
      </section>

      <section className="achievements">
        <div className="container" data-aos="fade-up">
          <h2>Our Achievements</h2>
          <div className="achievements-grid">
            <div className="achievement" data-aos="fade-up" data-aos-delay="100">
              <h3>200+</h3>
              <p>Projects Completed</p>
            </div>
            <div className="achievement" data-aos="fade-up" data-aos-delay="200">
              <h3>15+</h3>
              <p>Years of Experience</p>
            </div>
            <div className="achievement" data-aos="fade-up" data-aos-delay="300">
              <h3>50+</h3>
              <p>Expert Team Members</p>
            </div>
            <div className="achievement" data-aos="fade-up" data-aos-delay="400">
              <h3>100%</h3>
              <p>Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 
