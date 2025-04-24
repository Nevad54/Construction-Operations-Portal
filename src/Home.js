import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import useIntersectionObserver from './hooks/useIntersectionObserver';
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

  const heroRef = useIntersectionObserver();
  const aboutRef = useIntersectionObserver();
  const servicesRef = useIntersectionObserver();
  const projectsRef = useIntersectionObserver();
  const contactRef = useIntersectionObserver();

  return (
    <div className="home">
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
      <section className="hero fade-in hero-animation" ref={heroRef}>
        <div className="hero-content">
          <h1>Welcome to MasterTech</h1>
          <p>Your trusted partner in electrical solutions</p>
          <Link to="/contact" className="cta-button">Get Started</Link>
        </div>
      </section>

      <section className="about fade-in about-animation" ref={aboutRef}>
        <div className="about-content">
          <h2>About Us</h2>
          <p>We are a leading electrical solutions provider with years of experience...</p>
        </div>
      </section>

      <section className="services fade-in service-animation" ref={servicesRef}>
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-item fade-in service-item-animation">
            <h3>Electrical Installation</h3>
            <p>Professional electrical installation services...</p>
          </div>
          <div className="service-item fade-in service-item-animation">
            <h3>Maintenance</h3>
            <p>Regular maintenance and repair services...</p>
          </div>
          {/* Add more service items */}
        </div>
      </section>

      <section className="projects fade-in project-animation" ref={projectsRef}>
        <h2>Our Projects</h2>
        <div className="projects-grid">
          <div className="project-item fade-in project-item-animation">
            <h3>Project 1</h3>
            <p>Description of project 1...</p>
          </div>
          <div className="project-item fade-in project-item-animation">
            <h3>Project 2</h3>
            <p>Description of project 2...</p>
          </div>
          {/* Add more project items */}
        </div>
      </section>

      <section className="contact fade-in contact-animation" ref={contactRef}>
        <h2>Contact Us</h2>
        <p>Get in touch with us for your electrical needs</p>
        <Link to="/contact" className="cta-button">Contact Us</Link>
      </section>

      <section className="project-categories" role="main">
        <div className="container">
          <h2>Our Expertise</h2>
          <div className="categories-grid">
            <Link
              to="/projects#industrial"
              className="category-card fade-in"
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
            <Link
              to="/projects#residential"
              className="category-card fade-in"
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
            <Link
              to="/projects#commercial"
              className="category-card fade-in"
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
            <Link
              to="/projects#renovation"
              className="category-card fade-in"
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
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section
        className="services"
        role="region"
        aria-labelledby="services-heading"
      >
        <h2 id="services-heading">Our Services</h2>
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