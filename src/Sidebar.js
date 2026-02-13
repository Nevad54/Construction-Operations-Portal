import React from 'react';
import { Link } from 'react-router-dom';
import Dropdown from './Dropdown';

const Sidebar = ({ isSidebarActive, setIsSidebarActive, setIsNavLinksActive, activePage }) => {
  const closeSidebar = () => {
    console.log('Closing sidebar, isSidebarActive:', false);
    setIsSidebarActive(false);
  };
  const closeNavLinks = () => {
    console.log('Closing nav links, isNavLinksActive:', false);
    setIsNavLinksActive(false);
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isSidebarActive ? 'active' : ''}`}
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
        aria-hidden="true"
        role="presentation"
      />
      <div className={`sidebar ${isSidebarActive ? 'active' : ''}`} id="sidebar" role="navigation" aria-label="Main navigation">
      <ul>
        <li>
          <Link to="/" onClick={closeSidebar} className={activePage === 'home' ? 'active' : ''}>
            <i className="fas fa-home"></i> Home
          </Link>
        </li>
        <li>
          <Link to="/about" onClick={closeSidebar} className={activePage === 'about' ? 'active' : ''}>
            <i className="fas fa-info-circle"></i> About
          </Link>
        </li>
        <li>
          <Link to="/services" onClick={closeSidebar} className={activePage === 'services' ? 'active' : ''}>
            <i className="fas fa-cogs"></i> Services
          </Link>
        </li>
        <Dropdown
          isActive={activePage === 'vision-mission' ? 'vision-mission' : activePage === 'core-values' ? 'core-values' : activePage === 'safety' ? 'safety' : false}
          closeSidebar={closeSidebar}
          closeNavLinks={closeNavLinks}
        />
        <li>
          <Link to="/projects" onClick={closeSidebar} className={activePage === 'projects' ? 'active' : ''}>
            <i className="fas fa-project-diagram"></i> Projects
          </Link>
        </li>
        <li>
          <Link to="/contact" onClick={closeSidebar} className={activePage === 'contact' ? 'active' : ''}>
            <i className="fas fa-envelope"></i> Contact
          </Link>
        </li>
      </ul>
    </div>
    </>
  );
};

export default Sidebar;