import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';
import { usePageMeta } from '../utils/pageMeta';

// derive a simple page key from pathname for nav highlighting
function getActivePage(path) {
  switch (path) {
    case '/':
      return 'home';
    case '/about':
      return 'about';
    case '/client-portal':
      return 'client-portal';
    case '/services':
      return 'services';
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

export default function PageLayout({ children, meta }) {
  const location = useLocation();
  const activePage = getActivePage(location.pathname);

  usePageMeta(meta || {});

  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarActive(false);
        setIsNavLinksActive(false);
      }
    };

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarActive(false);
        setIsNavLinksActive(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsSidebarActive(false);
    setIsNavLinksActive(false);
  }, [location.pathname]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = isSidebarActive ? 'hidden' : '';
    return () => {
      document.body.style.overflow = previous;
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
        {'\u2191'}
      </button>
    </>
  );
}


