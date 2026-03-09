import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';
import { useTheme } from './context/ThemeContext';

const Header = ({ isSidebarActive, setIsSidebarActive, isNavLinksActive, setIsNavLinksActive, activePage }) => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
  }, [activePage, isSidebarActive]);

  const toggleSidebar = () => {
    setIsSidebarActive((prev) => !prev);
    setIsNavLinksActive(false);
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
          <Link to="/" className="logo-link" aria-label="Construction Operations Portal">
            <span className="logo-mark" aria-hidden="true">
              <img
                src={`${process.env.PUBLIC_URL || ''}/assets/logo.svg`}
                alt=""
                aria-hidden="true"
                className="logo"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </span>
            <span className="logo-wordmark">
              <span className="logo-wordmark-main">Construction</span>
              <span className="logo-wordmark-accent">Ops</span>
            </span>
          </Link>
          <div className="header-actions">
            <nav className="header-nav" aria-label="Main menu">
              <ul className={`nav-links ${isNavLinksActive ? 'active' : ''}`}>
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
              <li className={activePage === 'projects' ? 'active' : ''}>
                <Link to="/projects" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'projects' ? 'page' : undefined}>
                  <i className="fas fa-project-diagram"></i> Projects
                </Link>
              </li>
              <li className={activePage === 'client-portal' ? 'active' : ''}>
                <Link to="/client-portal" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'client-portal' ? 'page' : undefined}>
                  <i className="fas fa-layer-group"></i> Client Portal
                </Link>
              </li>
              <li className={activePage === 'safety' ? 'active' : ''}>
                <Link to="/safety" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'safety' ? 'page' : undefined}>
                  <i className="fas fa-shield-alt"></i> Safety
                </Link>
              </li>
              <li className={activePage === 'contact' ? 'active' : ''}>
                <Link to="/contact" onClick={() => setIsNavLinksActive(false)} aria-current={activePage === 'contact' ? 'page' : undefined}>
                  <i className="fas fa-envelope"></i> Contact
                </Link>
              </li>
              </ul>
            </nav>
            <div className="header-utility-group">
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
