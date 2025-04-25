import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const VisionMission = () => {
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

  // Add Organization Schema
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Mastertech Intergrouppe Inc.",
      "url": "https://mastertech-app.vercel.app",
      "description": "Leading construction and engineering company in Silang Cavite, Philippines",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sta Rosa Tagaytay Road Purok 4",
        "addressLocality": "Brgy. Pasong Langka",
        "addressRegion": "Silang",
        "postalCode": "4118",
        "addressCountry": "PH"
      },
      "mission": "To deliver exceptional construction and engineering services while maintaining the highest standards of quality, safety, and environmental responsibility.",
      "vision": "To be the leading construction and engineering company in Silang Cavite, recognized for innovation, reliability, and sustainable practices."
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
        <section className="vision-mission" role="main">
          <div className="container">
            <h1>Vision & Mission of Mastertech Intergrouppe Inc.</h1>
            <div className="vision-mission-content">
              <div className="vision-section">
                <h2>Our Vision</h2>
                <p>To be the leading construction and engineering company in Silang Cavite, recognized for innovation, reliability, and sustainable practices.</p>
                <div className="vision-details">
                  <h3>Key Aspirations</h3>
                  <ul>
                    <li>Industry leadership in construction and engineering</li>
                    <li>Innovation in sustainable building practices</li>
                    <li>Excellence in project delivery</li>
                    <li>Strong community partnerships</li>
                  </ul>
                </div>
              </div>
              <div className="mission-section">
                <h2>Our Mission</h2>
                <p>To deliver exceptional construction and engineering services while maintaining the highest standards of quality, safety, and environmental responsibility.</p>
                <div className="mission-details">
                  <h3>Core Commitments</h3>
                  <ul>
                    <li>Quality excellence in every project</li>
                    <li>Safety as our top priority</li>
                    <li>Environmental sustainability</li>
                    <li>Customer satisfaction</li>
                    <li>Employee development</li>
                  </ul>
                </div>
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

export default VisionMission;