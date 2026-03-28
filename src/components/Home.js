import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
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
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Construction Operations Portal</h1>
          <p className="hero-subtitle">Your Partner in Engineering Excellence</p>
          <a href="/contact" className="btn">Get Started</a>
        </div>
      </section>

      <section className="services">
        <h2>Our Services</h2>
        <div className="service-list">
          <div className="service-item">
            <h3>Engineering Solutions</h3>
            <p>Comprehensive engineering services tailored to your needs.</p>
          </div>
          <div className="service-item">
            <h3>Construction Management</h3>
            <p>Expert management of construction projects from start to finish.</p>
          </div>
          <div className="service-item">
            <h3>Technical Consulting</h3>
            <p>Professional guidance and technical expertise.</p>
          </div>
        </div>
      </section>

      <section className="about-preview">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Us</h2>
              <p>We are your trusted partner in engineering and construction excellence.</p>
              <a href="/about" className="btn">Learn More</a>
            </div>
            <div className="about-image">
              <img src="/images/about-preview.jpg" alt="About Us" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="projects-preview">
        <h2>Featured Projects</h2>
        <div className="project-gallery">
          {/* Add data-aos attributes to your project items */}
          <div className="project-item">
            {/* Project content */}
          </div>
          <div className="project-item">
            {/* Project content */}
          </div>
          <div className="project-item">
            {/* Project content */}
          </div>
        </div>
      </section>

      <section className="contact-preview">
        <div className="container">
          <h2>Ready to Start Your Project?</h2>
          <p>Contact us today for a consultation</p>
          <a href="/contact" className="btn">Contact Us</a>
        </div>
      </section>
    </div>
  );
};

export default Home; 

