import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

const Header = ({ isSidebarActive, setIsSidebarActive, isNavLinksActive, setIsNavLinksActive, activePage }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
    setIsNavLinksActive(!isNavLinksActive);
    if (isDropdownOpen) setIsDropdownOpen(false); // Close dropdown when toggling sidebar
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsDropdownOpen(!isDropdownOpen);
    console.log('Header dropdown state:', !isDropdownOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
      console.log('Header dropdown state (key):', !isDropdownOpen);
    }
  };

  return (
    <header role="banner">
      <div className="container">
        <div className="hamburger" onClick={toggleSidebar} aria-label="Toggle navigation">
          <i className="fas fa-bars"></i>
        </div>
        <Link to="/" className="logo-link">
          <img src="/Uploads/logo.png" alt="MASTERTECH INTERGROUPPE INC. Logo" className="logo" loading="lazy" />
        </Link>
        <nav aria-label="Main menu">
          <ul className={`nav-links ${isNavLinksActive ? 'active' : ''}`}>
            <li className={activePage === 'home' ? 'active' : ''}>
              <Link to="/" onClick={() => setIsNavLinksActive(false)}>
                <i className="fas fa-home"></i> Home
              </Link>
            </li>
            <li className={activePage === 'about' ? 'active' : ''}>
              <Link to="/about" onClick={() => setIsNavLinksActive(false)}>
                <i className="fas fa-info-circle"></i> About
              </Link>
            </li>
            <li className={activePage === 'services' ? 'active' : ''}>
              <Link to="/services" onClick={() => setIsNavLinksActive(false)}>
                <i className="fas fa-cogs"></i> Services
              </Link>
            </li>
            <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <a
                href="#"
                onClick={toggleDropdown}
                onKeyDown={handleKeyDown}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                role="button"
              >
                <i className="fas fa-handshake"></i> Commitment
              </a>
              <div className="dropdown-content">
                <Link
                  to="/vision-mission"
                  onClick={() => {
                    setIsNavLinksActive(false);
                    setIsDropdownOpen(false);
                  }}
                  className={activePage === 'vision-mission' ? 'active' : ''}
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
                >
                  <i className="fas fa-shield-alt"></i> Safety
                </Link>
              </div>
            </li>
            <li className={activePage === 'projects' ? 'active' : ''}>
              <Link to="/projects" onClick={() => setIsNavLinksActive(false)}>
                <i className="fas fa-project-diagram"></i> Projects
              </Link>
            </li>
            <li className={activePage === 'contact' ? 'active' : ''}>
              <Link to="/contact" onClick={() => setIsNavLinksActive(false)}>
                <i className="fas fa-envelope"></i> Contact
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;