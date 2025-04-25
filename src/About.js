import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const About = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();

  // Add LocalBusiness Schema
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Mastertech Intergrouppe Inc.",
      "image": "https://mastertech-app.vercel.app/Uploads/logo.png",
      "description": "Leading construction and engineering company in Silang Cavite, Philippines",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sta Rosa Tagaytay Road Purok 4",
        "addressLocality": "Brgy. Pasong Langka",
        "addressRegion": "Silang",
        "postalCode": "4118",
        "addressCountry": "PH"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "14.160172",
        "longitude": "120.996697"
      },
      "url": "https://mastertech-app.vercel.app",
      "telephone": "+63",
      "priceRange": "$$",
      "openingHours": "Mo-Fr 08:00-17:00",
      "sameAs": [
        "https://www.facebook.com/mastertech",
        "https://www.linkedin.com/company/mastertech"
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
      <section className="about" role="main">
        <div className="container">
          <h1>About Mastertech Intergrouppe Inc.</h1>
          <div className="about-content">
            <div className="about-text fade-in">
              <h2>Company Overview</h2>
              <p>Mastertech Intergrouppe Inc. was duly incorporated and registered with the Securities and Exchange Commission (SEC) on February 13, 2014, under SEC Certificate No. CS201402904.</p>
              <p>Based in Silang Cavite, we are a leading construction company serving clients across the Philippines. Our expertise spans across various sectors, delivering quality projects with a focus on innovation and sustainability.</p>
              <p>The Company is primarily engaged in General Construction Services, including but not limited to:</p>
              <ul>
                <li>Structural, Civil, and Architectural Works</li>
                <li>Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works</li>
                <li>Fabrication and Automation for Industrial Plant Process Lines</li>
                <li>Maintenance Services in Manufacturing Plants</li>
              </ul>
            </div>
            <div className="about-image fade-in">
              <img 
                src="/Uploads/about-image.png" 
                alt="Mastertech Intergrouppe Inc. Headquarters in Silang Cavite" 
                loading="lazy"
                width="600"
                height="400"
              />
            </div>
          </div>
          <div className="about-services fade-in">
            <h2>Secondary Business Lines</h2>
            <p>As a secondary line of business, we supply both imported and locally sourced materials, including:</p>
            <ul>
              <li>Painting Equipment and Parts</li>
              <li>Industrial Tapes</li>
              <li>Valves, Brass, and Stainless Fittings</li>
              <li>Abrasives and Sealers</li>
              <li>Wiping Rags</li>
              <li>Automation and Control Materials</li>
              <li>Other Productive and Non-productive Materials for Car Manufacturing</li>
            </ul>
          </div>
          <div className="about-location fade-in">
            <h2>Office Location</h2>
            <p>Sta Rosa Tagaytay Road Purok 4, Brgy. Pasong Langka, Silang Cavite 4118</p>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mastertech Intergrouppe Inc. Location in Silang Cavite"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
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

export default About;