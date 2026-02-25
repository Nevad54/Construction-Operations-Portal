import React, { useEffect, useState } from 'react';
import DashboardTopNav from './DashboardTopNav';
import DashboardSidebar from './DashboardSidebar';
import DashboardRightSidebar from './DashboardRightSidebar';
import { api } from '../../services/api';

export default function DashboardLayout({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  sidebarMenuItems,
  sidebarHomePath = '/admin/dashboard',
  sidebarProfileName = 'Admin',
  sidebarProfileEmail = 'admin@construction.local',
  rightSidebar = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const toggleSidebarCollapse = () => setSidebarCollapsed((c) => !c);

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 transition-colors duration-fast">
      <DashboardTopNav 
        onMenuClick={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onToggleSidebarCollapse={toggleSidebarCollapse}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        currentUser={authUser}
      />
      <DashboardSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={closeSidebar}
        onToggleCollapse={toggleSidebarCollapse}
        isMobile={isMobile}
        menuItems={sidebarMenuItems}
        homePath={sidebarHomePath}
        profileName={authUser?.username || sidebarProfileName}
        profileEmail={authUser ? `${authUser.role}@construction.local` : sidebarProfileEmail}
      />
      <main 
        className={`
          pt-16 flex transition-all duration-300 ease-out min-h-screen
          ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
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
