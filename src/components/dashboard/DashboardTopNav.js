import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import BrandLockup from '../BrandLockup';

export default function DashboardTopNav({
  onMenuClick,
  sidebarOpen,
  isMobile,
  desktopOffsetClass = 'lg:left-20',
  searchQuery = '',
  onSearchChange = () => {},
  showSearch = true,
  searchPlaceholder = 'Search workspace',
  searchAriaLabel = 'Search workspace',
  currentUser = null,
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith('/admin');
  const settingsPath = isAdminArea ? '/admin/dashboard/settings' : '/user/dashboard/settings';
  const loginPath = isAdminArea ? '/login/admin' : '/login/user';
  const profileInitial = String(currentUser?.username || 'A').charAt(0).toUpperCase();
  const showTopBrand = isMobile;

  useEffect(() => {
    if (!isMobile) setMobileSearchOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await api.logout();
    } catch (err) {
      // ignore logout errors, still move to login
    } finally {
      setLoggingOut(false);
      setProfileOpen(false);
      navigate(loginPath, { replace: true });
    }
  };

  return (
    <div
      role="banner"
      className={`fixed top-0 left-0 right-0 min-h-16 bg-surface-card dark:bg-gray-900 border-b border-stroke dark:border-gray-700 z-50 px-3 sm:px-4 shadow-sm transition-[left,color,background-color,border-color] duration-200 ${desktopOffsetClass}`}
    >
      <div className="flex items-center justify-between w-full max-w-[1920px] mx-auto h-16">
        {/* Left: menu + logo + collapse button */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors duration-fast lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          {/* Brand */}
          <BrandLockup
            className={`flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-[opacity,width] duration-fast ${showTopBrand ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none w-0 overflow-hidden'}`}
            iconClassName="h-9 w-auto object-contain flex-shrink-0"
            bodyClassName="hidden min-w-0 sm:flex sm:flex-col"
            titleClassName="text-sm sm:text-[0.95rem] font-bold leading-tight text-text-primary dark:text-gray-100 truncate"
            accentClassName="text-brand dark:text-brand-400"
            subtitle="Project controls and field visibility"
            subtitleClassName="text-[11px] leading-tight text-text-muted dark:text-gray-400 truncate"
            ariaHidden={!showTopBrand}
            tabIndex={showTopBrand ? 0 : -1}
          />
        </div>

        {/* Center: search */}
        <div className={`flex-1 max-w-md mx-4 transition-all duration-fast hidden sm:block ${searchFocused ? 'max-w-lg' : ''}`}>
          {showSearch ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-gray-400 pointer-events-none flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-muted dark:bg-gray-800 border border-transparent dark:border-gray-700 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-400 text-sm transition-all duration-fast
                focus:outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 focus:bg-surface-card dark:focus:bg-gray-900 focus:border-stroke dark:focus:border-gray-600"
              aria-label={searchAriaLabel}
            />
          </div>
          ) : null}
        </div>

        {/* Right: buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search button (mobile) */}
          {showSearch ? (
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="sm:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors duration-fast"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          ) : null}

          {/* Theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors duration-fast"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.415 0l.707.707a1 1 0 01-1.415 1.415l-.707-.707a1 1 0 010-1.415zm11.313 1.414a1 1 0 011.415-1.414l.707.707a1 1 0 11-1.415 1.415l-.707-.707zM10 7a3 3 0 100 6 3 3 0 000-6zm-7 3a1 1 0 11-2 0 1 1 0 012 0zm16 0a1 1 0 11-2 0 1 1 0 012 0zM4.22 15.78a1 1 0 011.415-1.414l.707.707a1 1 0 01-1.415 1.415l-.707-.707a1 1 0 010 1.414zm11.313-1.414a1 1 0 011.415 1.414l-.707.707a1 1 0 11-1.415-1.415l.707-.707zM10 18a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Notifications button */}
          <button
            type="button"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors duration-fast relative"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-feedback-error rounded-full animate-pulse-soft" aria-hidden="true" />
          </button>

          {/* Profile menu button */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="flex-shrink-0 w-10 h-10 rounded-lg hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors duration-fast flex items-center justify-center"
              aria-label="User menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <div className="w-8 h-8 rounded-lg bg-brand dark:bg-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                {profileInitial}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 shadow-lg z-50 p-3 space-y-3">
                <div className="pb-2 border-b border-stroke dark:border-gray-700">
                  <p className="text-sm font-semibold text-text-primary dark:text-gray-100">
                    {currentUser?.username || 'Unknown User'}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400 capitalize">
                    {currentUser?.role || 'unknown'} account
                  </p>
                </div>
                <Link
                  to={settingsPath}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary dark:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800"
                  onClick={() => setProfileOpen(false)}
                >
                  Profile & Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm text-feedback-error hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && mobileSearchOpen && (
        <div className="sm:hidden fixed top-16 left-0 right-0 z-40 px-3 pb-3 bg-surface-card dark:bg-gray-900 border-b border-stroke dark:border-gray-700 shadow-sm">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-gray-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-muted dark:bg-gray-800 border border-transparent dark:border-gray-700 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30"
              aria-label={searchAriaLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
