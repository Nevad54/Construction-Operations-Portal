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
      <section className="safety" role="main">
        <div className="container">
          <h1 data-aos="fade-up">Commitment to Safety</h1>
          <div className="safety-content" data-aos="fade-up" data-aos-delay="100">
            <p data-aos="fade-up" data-aos-delay="200">The management of Mastertech Intergrouppe Inc. (MTI, Mastertech) holds the highest regard for the health and safety of all employees, subcontractors, partners, and the general public. MTI is equally committed to environmental protection and will not compromise on this principle.</p>
            <p data-aos="fade-up" data-aos-delay="300">Therefore, it is Mastertech's fundamental responsibility to exercise due diligence and take all necessary precautions to prevent accidents and unsafe practices that could endanger employees, the public, the environment, or property. To uphold this commitment, the company will actively and continuously develop Safety, Health, and Environmental (SHE) standards aligned with its methodologies.</p>
            <p data-aos="fade-up" data-aos-delay="400">MTI will also ensure the employment of qualified safety personnel with the necessary authority and responsibility to implement and uphold these objectives. Furthermore, the company recognizes that an effective health and safety program significantly enhances operational efficiency.</p>
          </div>
        </div>
      </section>
      <Footer />
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

export default Safety;