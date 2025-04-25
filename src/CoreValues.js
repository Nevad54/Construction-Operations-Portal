import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const CoreValues = () => {
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
      "coreValues": [
        "Quality Excellence",
        "Safety First",
        "Customer Satisfaction",
        "Innovation",
        "Teamwork",
        "Integrity"
      ]
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
        <section className="core-values" role="main">
          <div className="container">
            <h1>Our Core Values at Mastertech Intergrouppe Inc.</h1>
            <div className="values-grid">
              <div className="value-card">
                <h2>Quality Excellence</h2>
                <p>We are committed to delivering the highest quality in every project we undertake in Silang Cavite and beyond.</p>
              </div>
              <div className="value-card">
                <h2>Safety First</h2>
                <p>Safety is our top priority in all construction and engineering operations.</p>
              </div>
              <div className="value-card">
                <h2>Customer Satisfaction</h2>
                <p>We strive to exceed our clients' expectations through exceptional service and results.</p>
              </div>
              <div className="value-card">
                <h2>Innovation</h2>
                <p>We embrace new technologies and methods to improve our construction processes.</p>
              </div>
              <div className="value-card">
                <h2>Teamwork</h2>
                <p>We believe in the power of collaboration to achieve outstanding results.</p>
              </div>
              <div className="value-card">
                <h2>Integrity</h2>
                <p>We conduct our business with honesty, transparency, and ethical practices.</p>
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

export default CoreValues;