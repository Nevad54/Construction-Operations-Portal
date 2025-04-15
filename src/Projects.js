import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Projects = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [filter, setFilter] = useState('all');

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

  const projects = [
    { id: 1, category: 'industrial', title: 'Factory Expansion', description: 'Expanded a manufacturing facility in Cavite.', image: '/Uploads/industrial-project1.jpg' },
    { id: 2, category: 'industrial', title: 'Warehouse Construction', description: 'Built a state-of-the-art warehouse.', image: '/Uploads/industrial-project2.jpg' },
    { id: 3, category: 'residential', title: 'Family Home', description: 'Constructed a modern family home in Silang.', image: '/Uploads/residential-project1.jpg' },
    { id: 4, category: 'residential', title: 'Apartment Complex', description: 'Developed a multi-unit residential complex.', image: '/Uploads/residential-project2.jpg' },
    { id: 5, category: 'commercial', title: 'Office Building', description: 'Built a commercial office space in Tagaytay.', image: '/Uploads/commercial-project1.jpg' },
    { id: 6, category: 'commercial', title: 'Retail Store', description: 'Constructed a retail store with modern design.', image: '/Uploads/commercial-project2.jpg' },
    { id: 7, category: 'renovation', title: 'Office Renovation', description: 'Renovated an office space for better functionality.', image: '/Uploads/renovation-project1.jpg' },
    { id: 8, category: 'renovation', title: 'Home Remodel', description: 'Remodeled a residential home with modern upgrades.', image: '/Uploads/renovation-project2.jpg' },
  ];

  const filteredProjects = filter === 'all' ? projects : projects.filter(project => project.category === filter);

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
      <section className="projects" role="main">
        <div className="container">
          <h1>Our Projects</h1>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              aria-label="Show all projects"
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'industrial' ? 'active' : ''}`}
              onClick={() => setFilter('industrial')}
              aria-label="Show industrial projects"
            >
              Industrial
            </button>
            <button
              className={`filter-btn ${filter === 'residential' ? 'active' : ''}`}
              onClick={() => setFilter('residential')}
              aria-label="Show residential projects"
            >
              Residential
            </button>
            <button
              className={`filter-btn ${filter === 'commercial' ? 'active' : ''}`}
              onClick={() => setFilter('commercial')}
              aria-label="Show commercial projects"
            >
              Commercial
            </button>
            <button
              className={`filter-btn ${filter === 'renovation' ? 'active' : ''}`}
              onClick={() => setFilter('renovation')}
              aria-label="Show renovation projects"
            >
              Renovation
            </button>
          </div>
          <div className="project-gallery">
            {filteredProjects.map(project => (
              <div key={project.id} className="project-item fade-in">
                <img src={project.image} alt={project.title} loading="lazy" />
                <div className="project-info">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </div>
            ))}
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

export default Projects;