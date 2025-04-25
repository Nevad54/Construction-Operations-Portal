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
      {/* Add Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Mastertech Intergrouppe Inc.",
          "url": "https://mastertech-app.vercel.app",
          "logo": "https://mastertech-app.vercel.app/Uploads/logo.png",
          "description": "Leading construction and engineering company in Silang Cavite, Philippines",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Sta Rosa Tagaytay Road Purok 4",
            "addressLocality": "Brgy. Pasong Langka",
            "addressRegion": "Silang",
            "postalCode": "4118",
            "addressCountry": "PH"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+63",
            "contactType": "customer service",
            "email": "inquiry@mastertech.com.ph",
            "areaServed": "PH",
            "availableLanguage": ["English", "Filipino"]
          }
        })}
      </script>

      <section className="hero">
        <div className="hero-content" data-aos="fade-up">
          <h1>Welcome to Mastertech Intergrouppe Inc.</h1>
          <p className="hero-subtitle">Your Trusted Construction Partner in Silang Cavite</p>
          <p className="hero-description">With over 15 years of experience, we specialize in industrial, commercial, and residential construction projects across the Philippines.</p>
          <a href="/contact" className="btn">Get Started</a>
        </div>
      </section>

      <section className="services">
        <h2 data-aos="fade-up">Our Services</h2>
        <div className="service-list">
          <div className="service-item" data-aos="fade-up" data-aos-delay="100">
            <h3>Industrial Construction</h3>
            <p>Specialized in clean room & painting processes improvements, including automation for manufacturing plants.</p>
          </div>
          <div className="service-item" data-aos="fade-up" data-aos-delay="200">
            <h3>Commercial Projects</h3>
            <p>Expert management of commercial construction projects with focus on quality and efficiency.</p>
          </div>
          <div className="service-item" data-aos="fade-up" data-aos-delay="300">
            <h3>Residential Development</h3>
            <p>Building quality homes and residential complexes with attention to detail and customer satisfaction.</p>
          </div>
        </div>
      </section>

      <section className="about-preview">
        <div className="container">
          <div className="about-content">
            <div className="about-text" data-aos="fade-right">
              <h2>About Mastertech Intergrouppe Inc.</h2>
              <p>Established in 2014, we are a leading construction company based in Silang Cavite, serving clients across the Philippines. Our expertise spans across industrial, commercial, and residential projects.</p>
              <a href="/about" className="btn">Learn More</a>
            </div>
            <div className="about-image" data-aos="fade-left">
              <img src="/Uploads/about-image.png" alt="Mastertech Intergrouppe Inc. Headquarters in Silang Cavite" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="projects-preview">
        <h2 data-aos="fade-up">Featured Projects</h2>
        <div className="project-gallery">
          <div className="project-item" data-aos="zoom-in" data-aos-delay="100">
            <img src="/Uploads/industrial.jpg" alt="Industrial Project in Silang Cavite" loading="lazy" />
            <h3>Industrial Projects</h3>
            <p>Specialized manufacturing facilities and clean rooms</p>
          </div>
          <div className="project-item" data-aos="zoom-in" data-aos-delay="200">
            <img src="/Uploads/commercial.jpg" alt="Commercial Project in Silang Cavite" loading="lazy" />
            <h3>Commercial Projects</h3>
            <p>Office buildings and commercial spaces</p>
          </div>
          <div className="project-item" data-aos="zoom-in" data-aos-delay="300">
            <img src="/Uploads/residential.jpg" alt="Residential Project in Silang Cavite" loading="lazy" />
            <h3>Residential Projects</h3>
            <p>Quality homes and residential complexes</p>
          </div>
        </div>
      </section>

      <section className="contact-preview">
        <div className="container" data-aos="fade-up">
          <h2>Ready to Start Your Project?</h2>
          <p>Contact us today for a consultation in Silang Cavite</p>
          <a href="/contact" className="btn">Contact Us</a>
        </div>
      </section>
    </div>
  );
};

export default Home; 