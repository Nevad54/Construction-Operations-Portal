import React, { useEffect, useState } from 'react';
import DashboardTopNav from './DashboardTopNav';
import DashboardSidebar from './DashboardSidebar';
import DashboardRightSidebar from './DashboardRightSidebar';
import { api } from '../../services/api';

export default function DashboardLayout({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  showSearch = true,
  searchPlaceholder = 'Search workspace',
  searchAriaLabel = 'Search workspace',
  sidebarMenuItems,
  sidebarHomePath = '/admin/dashboard/projects',
  sidebarProfileName = 'Admin',
  sidebarProfileEmail = 'admin@construction.local',
  rightSidebar = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isXlUp, setIsXlUp] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsXlUp(window.innerWidth >= 1280);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      } else {
        setDesktopSidebarExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let active = true;
    const loadAuth = async () => {
      try {
        const data = await api.me();
        if (!active) return;
        setAuthUser(data?.user || null);
      } catch (err) {
        if (!active) return;
        setAuthUser(null);
      }
    };
    loadAuth();
    return () => {
      active = false;
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => setSidebarOpen(false);
  const desktopSidebarWidthClass = desktopSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20';
  const desktopTopbarOffsetClass = desktopSidebarExpanded ? 'lg:left-64' : 'lg:left-20';

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 transition-colors duration-fast">
      <DashboardTopNav 
        onMenuClick={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        desktopOffsetClass={desktopTopbarOffsetClass}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        searchAriaLabel={searchAriaLabel}
        currentUser={authUser}
      />
      <DashboardSidebar
        open={sidebarOpen}
        expanded={desktopSidebarExpanded}
        onClose={closeSidebar}
        onExpandChange={setDesktopSidebarExpanded}
        isMobile={isMobile}
        menuItems={sidebarMenuItems}
        homePath={sidebarHomePath}
        profileName={authUser?.username || sidebarProfileName}
        profileEmail={authUser ? `${authUser.role}@construction.local` : sidebarProfileEmail}
      />
      <main 
        className={`
          pt-16 flex transition-all duration-300 ease-out min-h-screen
          ${desktopSidebarWidthClass}
        `}
      >
        <div className="flex-1 min-w-0 w-full flex flex-col">
          <div className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
        {isXlUp && (rightSidebar || <DashboardRightSidebar />)}
      </main>
    </div>
  );
}
