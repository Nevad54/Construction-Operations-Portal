import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles.css';

const Home = () => {
  const [heroRef, isHeroVisible] = useIntersectionObserver();
  const [aboutRef, isAboutVisible] = useIntersectionObserver();
  const [servicesRef, isServicesVisible] = useIntersectionObserver();
  const [projectsRef, isProjectsVisible] = useIntersectionObserver();
  const [contactRef, isContactVisible] = useIntersectionObserver();

  return (
    <div className="home">
      <section 
        ref={heroRef} 
        className={`hero-section ${isHeroVisible ? 'fade-in visible' : ''}`}
      >
        <div className="hero-content">
          <h1>Welcome to MasterTech</h1>
          <p>Your trusted partner in technology solutions</p>
        </div>
      </section>

      <section 
        ref={aboutRef}
        className={`about-section ${isAboutVisible ? 'fade-in visible' : ''}`}
      >
        <h2>About Us</h2>
        <p>We are a team of experts dedicated to delivering innovative technology solutions.</p>
      </section>

      <section 
        ref={servicesRef}
        className={`services-section ${isServicesVisible ? 'fade-in visible' : ''}`}
      >
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-item">
            <h3>Web Development</h3>
            <p>Custom web solutions for your business</p>
          </div>
          <div className="service-item">
            <h3>Mobile Apps</h3>
            <p>Native and cross-platform applications</p>
          </div>
          <div className="service-item">
            <h3>Cloud Solutions</h3>
            <p>Scalable cloud infrastructure</p>
          </div>
        </div>
      </section>

      <section 
        ref={projectsRef}
        className={`projects-section ${isProjectsVisible ? 'fade-in visible' : ''}`}
      >
        <h2>Our Projects</h2>
        <div className="projects-grid">
          <div className="project-item">
            <h3>E-commerce Platform</h3>
            <p>Online shopping solution</p>
          </div>
          <div className="project-item">
            <h3>Healthcare App</h3>
            <p>Patient management system</p>
          </div>
          <div className="project-item">
            <h3>Education Portal</h3>
            <p>Learning management system</p>
          </div>
        </div>
      </section>

      <section 
        ref={contactRef}
        className={`contact-section ${isContactVisible ? 'fade-in visible' : ''}`}
      >
        <h2>Contact Us</h2>
        <p>Get in touch with our team</p>
        <button className="cta-button">Contact Now</button>
      </section>
    </div>
  );
};

export default Home; 