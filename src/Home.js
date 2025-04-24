import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Home = () => {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

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

  const handleImageError = (imageName) => {
    setImageErrors(prev => ({ ...prev, [imageName]: true }));
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

  const ProjectCategory = ({ title, description, image, onImageError }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
      <div className="project-category">
        <div className="image-container">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className={isLoaded ? 'loaded' : ''}
            onLoad={() => setIsLoaded(true)}
            onError={onImageError}
          />
          {!isLoaded && <div className="placeholder-image" />}
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    );
  };

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
        <div className="hero-content">
          <h1 className="fade-in" style={{ opacity: 1 }}>
            Welcome to MASTERTECH INTERGROUPPE INC.
          </h1>
          <p className="hero-subtitle fade-in" style={{ opacity: 1 }}>
            Your Trusted Partner in Construction and Industrial Solutions
          </p>
          <Link
            to="/contact"
            className="btn fade-in"
            aria-label="Contact us"
            style={{ opacity: 1 }}
          >
            Get in Touch
          </Link>
        </div>
      </section>
      <section className="project-categories" role="main">
        <div className="container">
          <h2>Our Expertise</h2>
          <div className="categories-grid">
            <Link
              to="/projects#industrial"
              className="category-card fade-in"
            >
              <ProjectCategory
                title="Industrial Projects"
                description="Structural, Civil, Site Development, and Architectural Works"
                image={imageErrors['industrial'] ? '/assets/placeholder.jpg' : `${IMAGE_BASE_URL}/uploads/industrial.jpg`}
                onImageError={() => handleImageError('industrial')}
              />
            </Link>
            <Link
              to="/projects#residential"
              className="category-card fade-in"
            >
              <ProjectCategory
                title="Residential Projects"
                description="Structural, Civil, Site Development, and Architectural Works"
                image={imageErrors['residential'] ? '/assets/placeholder.jpg' : `${IMAGE_BASE_URL}/uploads/residential.jpg`}
                onImageError={() => handleImageError('residential')}
              />
            </Link>
            <Link
              to="/projects#commercial"
              className="category-card fade-in"
            >
              <ProjectCategory
                title="Commercial Projects"
                description="Structural, Civil, Site Development, and Architectural Works"
                image={imageErrors['commercial'] ? '/assets/placeholder.jpg' : `${IMAGE_BASE_URL}/uploads/commercial.jpg`}
                onImageError={() => handleImageError('commercial')}
              />
            </Link>
            <Link
              to="/projects#renovation"
              className="category-card fade-in"
            >
              <ProjectCategory
                title="Renovation Projects"
                description="Structural, Civil, Site Development, and Architectural Works"
                image={imageErrors['renovation'] ? '/assets/placeholder.jpg' : `${IMAGE_BASE_URL}/uploads/renovation.jpg`}
                onImageError={() => handleImageError('renovation')}
              />
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