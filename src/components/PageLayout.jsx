import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';

// derive a simple page key from pathname for nav highlighting
function getActivePage(path) {
  switch (path) {
    case '/':
      return 'home';
    case '/about':
      return 'about';
    case '/services':
      return 'services';
    case '/vision-mission':
      return 'vision-mission';
    case '/core-values':
      return 'core-values';
    case '/safety':
      return 'safety';
    case '/projects':
      return 'projects';
    case '/contact':
      return 'contact';
    default:
      return 'home';
  }
}

export default function PageLayout({ children }) {
  const location = useLocation();
  const activePage = getActivePage(location.pathname);

  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleOutsideClick = (event) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const isSmallScreen = window.innerWidth < 768;
    const isClickOutsideSidebar =
      sidebar &&
      hamburger &&
      !sidebar.contains(event.target) &&
      !hamburger.contains(event.target);
    const isClickInsideNavLinks = navLinks && navLinks.contains(event.target);

    if (
      isSmallScreen &&
      isSidebarActive &&
      isClickOutsideSidebar &&
      !isClickInsideNavLinks
    ) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768 && isSidebarActive) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 200);
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSidebarActive]);

  return (
    <>
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <main id="main">{children}</main>
      <Footer />
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      >
        ↑
      </button>
    </>
  );
}
