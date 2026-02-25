import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';
import { useTheme } from './context/ThemeContext';

const Header = ({ isSidebarActive, setIsSidebarActive, isNavLinksActive, setIsNavLinksActive, activePage }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarActive((prev) => !prev);
    setIsNavLinksActive(false);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header role="banner">
        <div className="container">
          <button
            type="button"
            className={`hamburger-btn ${isSidebarActive ? 'active' : ''}`}
            onClick={toggleSidebar}
            aria-label={isSidebarActive ? 'Close navigation' : 'Open navigation'}
            title={isSidebarActive ? 'Close navigation' : 'Open navigation'}
            aria-controls="sidebar"
            aria-expanded={isSidebarActive}
          >
            <svg className="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="logo-link" aria-label="Construction Portal">
            <span className="logo-text">Construction Portal</span>
          </Link>
          <nav aria-label="Main menu">
            <ul className={`nav-links ${isNavLinksActive ? 'active' : ''}`}>
              <li>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                </button>
              </li>

              <li className={activePage === 'home' ? 'active' : ''}>
                <Link to="/" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'home' ? 'page' : undefined}>
                  <i className="fas fa-home"></i> Home
                </Link>
              </li>
              <li className={activePage === 'about' ? 'active' : ''}>
                <Link to="/about" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'about' ? 'page' : undefined}>
                  <i className="fas fa-info-circle"></i> About
                </Link>
              </li>
              <li className={activePage === 'services' ? 'active' : ''}>
                <Link to="/services" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'services' ? 'page' : undefined}>
                  <i className="fas fa-cogs"></i> Services
                </Link>
              </li>

              <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="nav-dropdown-trigger"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <i className="fas fa-handshake"></i> Commitment
                </button>
                <div className="dropdown-content">
                  <Link
                    to="/vision-mission"
                    onClick={() => {
                      setIsNavLinksActive(false);
                      setIsDropdownOpen(false);
                    }}
                    className={activePage === 'vision-mission' ? 'active' : ''}
                    aria-current={activePage === 'vision-mission' ? 'page' : undefined}
                  >
                    <i className="fas fa-eye"></i> Vision & Mission
                  </Link>
                  <Link
                    to="/core-values"
                    onClick={() => {
                      setIsNavLinksActive(false);
                      setIsDropdownOpen(false);
                    }}
                    className={activePage === 'core-values' ? 'active' : ''}
                    aria-current={activePage === 'core-values' ? 'page' : undefined}
                  >
                    <i className="fas fa-heart"></i> Core Values
                  </Link>
                  <Link
                    to="/safety"
                    onClick={() => {
                      setIsNavLinksActive(false);
                      setIsDropdownOpen(false);
                    }}
                    className={activePage === 'safety' ? 'active' : ''}
                    aria-current={activePage === 'safety' ? 'page' : undefined}
                  >
                    <i className="fas fa-shield-alt"></i> Safety
                  </Link>
                </div>
              </li>

              <li className={activePage === 'projects' ? 'active' : ''}>
                <Link to="/projects" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'projects' ? 'page' : undefined}>
                  <i className="fas fa-project-diagram"></i> Projects
                </Link>
              </li>
              <li className={activePage === 'contact' ? 'active' : ''}>
                <Link to="/contact" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'contact' ? 'page' : undefined}>
                  <i className="fas fa-envelope"></i> Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
