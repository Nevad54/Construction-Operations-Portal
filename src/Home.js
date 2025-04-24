import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import FadeInOnScroll from './components/FadeInOnScroll';
import './styles.css';

const Home = () => {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    console.log('Current path:', path);
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

  useEffect(() => {
    const newActivePage = getActivePage();
    console.log('Updating activePage to:', newActivePage);
    setActivePage(newActivePage);
  }, [location.pathname]); // Recompute activePage when the path changes

  const handleOutsideClick = (event) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const isSmallScreen = window.innerWidth < 768;
    const isClickOutsideSidebar =
      sidebar &&
      hamburger &&
      !sidebar.contains(event.target) &&
      !hamburger.contains(event.target);
    const isClickInsideNavLinks = navLinks && navLinks.contains(event.target);

    if (
      isSmallScreen &&
      isSidebarActive &&
      isClickOutsideSidebar &&
      !isClickInsideNavLinks
    ) {
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
      <section className="hero" role="banner">
        <FadeInOnScroll>
          <div className="hero-content">
            <h1>
              Welcome to MASTERTECH INTERGROUPPE INC.
            </h1>
            <p className="hero-subtitle">
              Your Trusted Partner in Construction and Industrial Solutions
            </p>
            <Link
              to="/contact"
              className="btn"
              aria-label="Contact us"
            >
              Get in Touch
            </Link>
          </div>
        </FadeInOnScroll>
      </section>
      <section className="project-categories" role="main">
        <div className="container">
          <FadeInOnScroll>
            <h2>Our Expertise</h2>
          </FadeInOnScroll>
          <div className="categories-grid">
            <FadeInOnScroll delay={100}>
              <Link
                to="/projects#industrial"
                className="category-card"
              >
                <img
                  src={`${IMAGE_BASE_URL}/uploads/industrial.jpg`}
                  alt="Industrial Projects"
                  loading="lazy"
                />
                <div className="category-overlay">
                  <span>Industrial</span>
                </div>
              </Link>
            </FadeInOnScroll>
            <FadeInOnScroll delay={200}>
              <Link
                to="/projects#residential"
                className="category-card"
              >
                <img
                  src={`${IMAGE_BASE_URL}/uploads/residential.jpg`}
                  alt="Residential Projects"
                  loading="lazy"
                />
                <div className="category-overlay">
                  <span>Residential</span>
                </div>
              </Link>
            </FadeInOnScroll>
            <FadeInOnScroll delay={300}>
              <Link
                to="/projects#commercial"
                className="category-card"
              >
                <img
                  src={`${IMAGE_BASE_URL}/uploads/commercial.jpg`}
                  alt="Commercial Projects"
                  loading="lazy"
                />
                <div className="category-overlay">
                  <span>Commercial</span>
                </div>
              </Link>
            </FadeInOnScroll>
            <FadeInOnScroll delay={400}>
              <Link
                to="/projects#renovation"
                className="category-card"
              >
                <img
                  src={`${IMAGE_BASE_URL}/uploads/renovation.jpg`}
                  alt="Renovation Projects"
                  loading="lazy"
                />
                <div className="category-overlay">
                  <span>Renovation</span>
                </div>
              </Link>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section
        className="services"
        role="region"
        aria-labelledby="services-heading"
      >
        <FadeInOnScroll>
          <h2 id="services-heading">Our Services</h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <ul className="services-list">
            <li>
              <i className="fas fa-hard-hat"></i>
              <span>
                Structural, Civil, Site Development, and Architectural Works
              </span>
            </li>
            <li>
              <i className="fas fa-cogs"></i>
              <span>
                Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works
              </span>
            </li>
            <li>
              <i className="fas fa-wrench"></i>
              <span>
                Fabrication & Industrial Plant Projects (Specialized in Clean Room
                & Painting Processes Improvements, Including Automation)
              </span>
            </li>
            <li>
              <i className="fas fa-users-cog"></i>
              <span>Manpower and Technical Support for Manufacturing Plants</span>
            </li>
            <li>
              <i className="fas fa-tools"></i>
              <span>Supply of Industrial Materials and Equipment</span>
            </li>
          </ul>
        </FadeInOnScroll>
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

export default Home;