import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Safety = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  // Add Safety Schema
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Safety Standards at Mastertech Intergrouppe Inc.",
      "description": "Learn about our commitment to safety in construction and engineering projects in Silang Cavite",
      "publisher": {
        "@type": "Organization",
        "name": "Mastertech Intergrouppe Inc.",
        "url": "https://mastertech-app.vercel.app"
      },
      "about": {
        "@type": "Thing",
        "name": "Construction Safety",
        "description": "Safety protocols and standards for construction projects"
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const getActivePage = () => {
    const path = location.pathname;
    console.log('Current path:', path); // Debug log
    if (path === '/') return 'home';
    if (path === '/pages/about') return 'about';
    if (path === '/pages/services') return 'services';
    if (path === '/pages/vision-mission') return 'vision-mission';
    if (path === '/pages/core-values') return 'core-values';
    if (path === '/pages/safety') return 'safety';
    if (path === '/pages/projects') return 'projects';
    if (path === '/pages/contact') return 'contact';
    return 'home';
  };
  const activePage = getActivePage();

  const handleOutsideClick = (event) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const isSmallScreen = window.innerWidth < 768;
    const isClickOutsideSidebar = sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target);
    const isClickInsideNavLinks = navLinks && navLinks.contains(event.target);

    if (isSmallScreen && isSidebarActive && isClickOutsideSidebar && !isClickInsideNavLinks) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768 && isSidebarActive) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

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

  return (
    <div>
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <main>
        <section className="safety" role="main">
          <div className="container">
            <h1>Safety Standards at Mastertech Intergrouppe Inc.</h1>
            <div className="safety-content">
              <div className="safety-section">
                <h2>Our Safety Commitment</h2>
                <p>At Mastertech Intergrouppe Inc., we prioritize safety in all our construction and engineering projects in Silang Cavite. Our comprehensive safety program ensures the well-being of our employees, clients, and the community.</p>
              </div>
              <div className="safety-section">
                <h2>Safety Certifications</h2>
                <div className="certifications-grid">
                  <div className="certification-card">
                    <img
                      src="/Uploads/safety-cert1.jpg"
                      alt="OSHA Safety Certification for Mastertech Intergrouppe Inc."
                      loading="lazy"
                    />
                    <h3>OSHA Compliance</h3>
                    <p>Fully compliant with Occupational Safety and Health Administration standards</p>
                  </div>
                  <div className="certification-card">
                    <img
                      src="/Uploads/safety-cert2.jpg"
                      alt="ISO 45001 Certification for Mastertech Intergrouppe Inc."
                      loading="lazy"
                    />
                    <h3>ISO 45001</h3>
                    <p>Certified in Occupational Health and Safety Management Systems</p>
                  </div>
                </div>
              </div>
              <div className="safety-section">
                <h2>Safety Training Programs</h2>
                <ul>
                  <li>Regular safety orientation for all employees</li>
                  <li>Specialized training for high-risk operations</li>
                  <li>Emergency response and first aid training</li>
                  <li>Equipment safety and operation training</li>
                </ul>
              </div>
              <div className="safety-section">
                <h2>Safety Equipment</h2>
                <p>We provide and maintain state-of-the-art safety equipment for all our projects:</p>
                <ul>
                  <li>Personal Protective Equipment (PPE)</li>
                  <li>Fall protection systems</li>
                  <li>Fire safety equipment</li>
                  <li>Emergency response kits</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      >
        ↑
      </button>
    </div>
  );
};

export default Safety;