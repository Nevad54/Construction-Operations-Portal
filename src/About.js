import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const About = memo(() => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    console.log('Current path:', path); // Debug log
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
          <h1>About Us</h1>
          <div className="about-content">
            <div className="about-text fade-in">
              <h2>Company Overview</h2>
              <p>Mastertech Intergrouppe Inc. was duly incorporated and registered with the Securities and Exchange Commission (SEC) on February 13, 2014, under SEC Certificate No. CS201402904.</p>
              <p>The Company is primarily engaged in General Construction Services, including but not limited to:</p>
              <ul>
                <li>Structural, Civil, and Architectural Works</li>
                <li>Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works</li>
                <li>Fabrication and Automation for Industrial Plant Process Lines</li>
                <li>Maintenance Services in Manufacturing Plants</li>
              </ul>
            </div>
            <div className="about-image fade-in">
              <img src="/Uploads/about-image.png" alt="MASTERTECH Headquarters" loading="lazy" />
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
          </div>
        </div>
      </section>
      <Footer />
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      />
    </div>
  );
});

export default About;