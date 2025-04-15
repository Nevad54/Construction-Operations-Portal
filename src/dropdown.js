import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

const Dropdown = ({ isActive, closeSidebar, closeNavLinks }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Dropdown toggle triggered, event type:', e.type); // Debug: Check if click or touch event
      setIsDropdownOpen((prev) => {
        console.log('Sidebar dropdown state updated to:', !prev);
        console.log('Window width:', window.innerWidth);
        return !prev;
      });
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen((prev) => {
          console.log('Sidebar dropdown state updated to (key):', !prev);
          return !prev;
        });
      }
    };

  return (
    <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
      <a
        onClick={handleToggle}
        onTouchStart={handleToggle} // Use the same handler for touch and click
        onKeyDown={handleKeyDown}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        role="button"
      >
        <i className="fas fa-handshake"></i> Commitment
      </a>
      <div className="dropdown-content">
        <Link
          to="/pages/vision-mission"
          onClick={() => {
            closeSidebar();
            closeNavLinks();
            setIsDropdownOpen(false);
          }}
          className={isActive === 'vision-mission' ? 'active' : ''}
        >
          <i className="fas fa-eye"></i> Vision & Mission
        </Link>
        <Link
          to="/pages/core-values"
          onClick={() => {
            closeSidebar();
            closeNavLinks();
            setIsDropdownOpen(false);
          }}
          className={isActive === 'core-values' ? 'active' : ''}
        >
          <i className="fas fa-heart"></i> Core Values
        </Link>
        <Link
          to="/pages/safety"
          onClick={() => {
            closeSidebar();
            closeNavLinks();
            setIsDropdownOpen(false);
          }}
          className={isActive === 'safety' ? 'active' : ''}
        >
          <i className="fas fa-shield-alt"></i> Safety
        </Link>
      </div>
    </li>
  );
};

export default Dropdown;