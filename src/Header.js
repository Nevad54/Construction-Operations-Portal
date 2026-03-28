import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles.css';
import { useTheme } from './context/ThemeContext';

const NAV_LINKS = [
  { to: '/',              label: 'Home',         page: 'home' },
  { to: '/about',         label: 'About',        page: 'about' },
  { to: '/services',      label: 'Services',     page: 'services' },
  { to: '/projects',      label: 'Projects',     page: 'projects' },
  { to: '/client-portal', label: 'Client Portal',page: 'client-portal' },
  { to: '/safety',        label: 'Safety',       page: 'safety' },
  { to: '/contact',       label: 'Contact',      page: 'contact' },
];

const Header = ({ isSidebarActive, setIsSidebarActive, isNavLinksActive, setIsNavLinksActive, activePage }) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleSidebar = () => {
    setIsSidebarActive((prev) => !prev);
    setIsNavLinksActive(false);
  };

  const closeNav = () => setIsNavLinksActive(false);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header
        role="banner"
        className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}
      >
        <div className="container site-header__inner">

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className={`hamburger-btn${isSidebarActive ? ' active' : ''}`}
            onClick={toggleSidebar}
            aria-label={isSidebarActive ? 'Close navigation' : 'Open navigation'}
            aria-controls="sidebar"
            aria-expanded={isSidebarActive}
          >
            <svg className="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="logo-link" aria-label="Construction Operations Portal — Home">
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

          {/* Primary nav */}
          <nav className="header-nav" aria-label="Main menu">
            <ul className={`nav-links${isNavLinksActive ? ' active' : ''}`} role="list">
              {NAV_LINKS.map(({ to, label, page }) => (
                <li key={page} className={activePage === page ? 'active' : ''}>
                  <Link
                    to={to}
                    onClick={closeNav}
                    aria-current={activePage === page ? 'page' : undefined}
                    className="nav-link"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Utility group */}
          <div className="header-utility-group">
            <div className="header-auth-links" aria-label="Account access">
              <Link to="/signin" className="header-auth-link">Sign in</Link>
              <Link to="/contact" className="btn btn--sm btn--primary">
                Get Started
              </Link>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light'
                ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
                  </svg>
                )
                : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )
              }
            </button>
          </div>

        </div>
      </header>
    </>
  );
};

export default Header;
