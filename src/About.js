import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import FadeInSection from './components/FadeInSection';
import StaggerContainer from './components/StaggerContainer';
import './styles.css';

const About = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();

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
          <FadeInSection animationClass="fade-in">
            <h1>About Us</h1>
          </FadeInSection>
          
          <div className="about-content">
            <FadeInSection animationClass="slide-in-left" delay={200}>
              <div className="about-text">
                <h2>Company Overview</h2>
                <p>Mastertech Intergrouppe Inc. was duly incorporated and registered with the Securities and Exchange Commission (SEC) on February 13, 2014, under SEC Certificate No. CS201402904.</p>
                <p>The Company is primarily engaged in General Construction Services, including but not limited to:</p>
                <StaggerContainer className="about-list">
                  <li>Structural, Civil, and Architectural Works</li>
                  <li>Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works</li>
                  <li>Fabrication and Automation for Industrial Plant Process Lines</li>
                  <li>Maintenance Services in Manufacturing Plants</li>
                </StaggerContainer>
              </div>
            </FadeInSection>
            
            <FadeInSection animationClass="slide-in-right" delay={400}>
              <div className="about-image">
                <img src="/Uploads/about-image.png" alt="MASTERTECH Headquarters" loading="lazy" />
              </div>
            </FadeInSection>
          </div>
          
          <FadeInSection animationClass="scale-in" delay={600}>
            <div className="about-services">
              <h2>Secondary Business Lines</h2>
              <p>As a secondary line of business, we supply both imported and locally sourced materials, including:</p>
              <StaggerContainer className="about-list">
                <li>Painting Equipment and Parts</li>
                <li>Industrial Tapes</li>
                <li>Valves, Brass, and Stainless Fittings</li>
                <li>Abrasives and Sealers</li>
                <li>Wiping Rags</li>
                <li>Automation and Control Materials</li>
                <li>Other Productive and Non-productive Materials for Car Manufacturing</li>
              </StaggerContainer>
            </div>
          </FadeInSection>
          
          <FadeInSection animationClass="rotate-in" delay={800}>
            <div className="about-location">
              <h2>Office Location</h2>
              <p>Sta Rosa Tagaytay Road Purok 4, Brgy. Pasong Langka, Silang Cavite 4118</p>
            </div>
          </FadeInSection>
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