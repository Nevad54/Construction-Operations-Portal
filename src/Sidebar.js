import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';

const Sidebar = ({ isSidebarActive, setIsSidebarActive, setIsNavLinksActive, activePage }) => {
  const { theme, toggleTheme } = useTheme();

  const closeSidebar = () => {
    setIsSidebarActive(false);
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
        <li className="sidebar-theme-item">
          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </li>
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
        <li>
          <Link to="/projects" onClick={closeSidebar} className={activePage === 'projects' ? 'active' : ''}>
            <i className="fas fa-project-diagram"></i> Projects
          </Link>
        </li>
        <li>
          <Link to="/client-portal" onClick={closeSidebar} className={activePage === 'client-portal' ? 'active' : ''}>
            <i className="fas fa-layer-group"></i> Client Portal
          </Link>
        </li>
        <li>
          <Link to="/safety" onClick={closeSidebar} className={activePage === 'safety' ? 'active' : ''}>
            <i className="fas fa-shield-alt"></i> Safety
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
