import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Dropdown = ({ isActive, closeSidebar, closeNavLinks }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="sidebar-dropdown-trigger"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <i className="fas fa-handshake"></i> Commitment
      </button>
      <div className="dropdown-content">
        <Link
          to="/vision-mission"
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
          to="/core-values"
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
          to="/safety"
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
