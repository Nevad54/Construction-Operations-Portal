import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Dropdown from './Dropdown';

const Sidebar = ({ isSidebarActive, setIsSidebarActive, setIsNavLinksActive, activePage }) => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  const closeSidebar = () => {
    console.log('Closing sidebar, isSidebarActive:', false);
    setIsSidebarActive(false);
  };
  const closeNavLinks = () => {
    console.log('Closing nav links, isNavLinksActive:', false);
    setIsNavLinksActive(false);
  };

  return (
    <div 
      className={`sidebar ${isSidebarActive ? 'active' : ''}`} 
      id="sidebar" 
      role="navigation" 
      aria-label="Main navigation"
      data-aos="fade-right"
    >
      <ul>
        <li data-aos="fade-right" data-aos-delay="100">
          <Link to="/" onClick={closeSidebar} className={activePage === 'home' ? 'active' : ''}>
            <i className="fas fa-home"></i> Home
          </Link>
        </li>
        <li data-aos="fade-right" data-aos-delay="150">
          <Link to="/about" onClick={closeSidebar} className={activePage === 'about' ? 'active' : ''}>
            <i className="fas fa-info-circle"></i> About
          </Link>
        </li>
        <li data-aos="fade-right" data-aos-delay="200">
          <Link to="/services" onClick={closeSidebar} className={activePage === 'services' ? 'active' : ''}>
            <i className="fas fa-cogs"></i> Services
          </Link>
        </li>
        <div data-aos="fade-right" data-aos-delay="250">
          <Dropdown
            isActive={activePage === 'vision-mission' ? 'vision-mission' : activePage === 'core-values' ? 'core-values' : activePage === 'safety' ? 'safety' : false}
            closeSidebar={closeSidebar}
            closeNavLinks={closeNavLinks}
          />
        </div>
        <li data-aos="fade-right" data-aos-delay="300">
          <Link to="/projects" onClick={closeSidebar} className={activePage === 'projects' ? 'active' : ''}>
            <i className="fas fa-project-diagram"></i> Projects
          </Link>
        </li>
        <li data-aos="fade-right" data-aos-delay="350">
          <Link to="/contact" onClick={closeSidebar} className={activePage === 'contact' ? 'active' : ''}>
            <i className="fas fa-envelope"></i> Contact
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;