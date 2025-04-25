import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer'; // Add Footer import
import './styles.css';

const Services = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Get the current location
  const location = useLocation();

  // Determine activePage based on the current URL
  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/about') return 'about';
    if (path === '/services') return 'services';
    if (path === '/vision-mission') return 'vision-mission';
    if (path === '/core-values') return 'core-values';
    if (path === '/safety') return 'safety';
    if (path === '/projects') return 'projects';
    if (path === '/contact') return 'contact';
    return 'home';
  };

  const [activePage, setActivePage] = useState(getActivePage());

  // Update activePage when the route changes
  useEffect(() => {
    setActivePage(getActivePage());
  }, [location.pathname]);

  // Close sidebar on outside click for small screens
  const handleOutsideClick = (event) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links'); // Add navLinks for dropdown compatibility
    const isSmallScreen = window.innerWidth < 768;
    const isClickOutside =
      sidebar &&
      hamburger &&
      !sidebar.contains(event.target) &&
      !hamburger.contains(event.target);
    const isClickInsideNavLinks = navLinks && navLinks.contains(event.target);

    if (
      isSmallScreen &&
      isSidebarActive &&
      isClickOutside &&
      !isClickInsideNavLinks
    ) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  // Close sidebar on resize to larger screen
  const handleResize = () => {
    if (window.innerWidth >= 768 && isSidebarActive) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  // Back to top visibility
  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 200);
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSidebarActive]);

  // Services data
  const services = [
    {
      title: 'Structural, Civil, and Architectural Works',
      description: 'Comprehensive construction services for buildings and infrastructure projects.'
    },
    {
      title: 'MEPS Works',
      description: 'Mechanical, Electrical, Plumbing, and Fire Protection systems installation and maintenance.'
    },
    {
      title: 'Fabrication & Industrial Plant Projects',
      description: 'Specialized in Clean Room & Painting Processes Improvements, including Automation.'
    },
    {
      title: 'Maintenance Services',
      description: 'Expert maintenance services for manufacturing plants and industrial facilities.'
    },
    {
      title: 'Manpower and Technical Support',
      description: 'Professional technical support and skilled manpower for manufacturing plants.'
    },
    {
      title: 'Industrial Materials Supply',
      description: 'Supply of high-quality industrial materials and equipment for various applications.'
    }
  ];

  return (
    <div>
      {/* Sidebar */}
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />

      {/* Header */}
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />

      {/* Services Section */}
      <main>
        <section className="services" role="main">
          <div className="container">
            <h1 data-aos="fade-up">Our Services</h1>
            <div className="service-list">
              {services.map((service, index) => (
                <div 
                  key={index} 
                  className="service-item"
                  data-aos="fade-up"
                  data-aos-delay={100 + (index * 100)}
                >
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Info Section */}
        <section className="footer-info" role="contentinfo">
          <div className="container">
            <div 
              className="footer-item"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <h2>Send Us a Message</h2>
              <p>
                If you have any questions or need a quote, feel free to contact
                us!
              </p>
              <a
                href="mailto:inquiry@mastertech.com.ph"
                className="btn"
                aria-label="Send us an email"
              >
                Email Us
              </a>
            </div>
            <div 
              className="footer-item"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h2>Our Location</h2>
              <p>
                <i className="fas fa-map-marker-alt"></i> 320 Sta Rosa Tagaytay
                Road Purok 4 Brgy. Pasong Langka, Silang Cavite 4118
              </p>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                  width="400"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="MASTERTECH Location Map"
                ></iframe>
              </div>
            </div>
            <div 
              className="footer-item"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <h2>Certifications</h2>
              <img
                src="/Uploads/certification1.jpg"
                alt="ISO 9001 Certification"
                className="certification"
                loading="lazy"
              />
              <img
                src="/Uploads/certification2.jpg"
                alt="Safety Compliance Certification"
                className="certification"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Back to Top Button */}
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
        data-aos="fade-up"
      >
        ↑
      </button>
    </div>
  );
};

export default Services;