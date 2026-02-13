import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const defaultMenuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/admin/dashboard/projects', label: 'Work Orders', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/admin/dashboard/files', label: 'File Management', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4' },
  { path: '/admin/dashboard/clients', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/admin/dashboard/reports', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/admin/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function Icon({ d, className = '' }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function SidebarItem({ item, collapsed, isActive, onClick }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all duration-200 ease-out
        ${isActive
          ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }
        ${collapsed ? 'lg:justify-center lg:px-3 lg:mx-1' : ''}
      `}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <span className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-500'}>
        <Icon d={item.icon} />
      </span>
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      {isActive && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
      )}
    </Link>
  );
}

export default function DashboardSidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  isMobile,
  menuItems = defaultMenuItems,
  homePath = '/admin/dashboard',
  profileName = 'Admin',
  profileEmail = 'admin@mastertech',
}) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {open && isMobile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} aria-label="Close sidebar" />
      )}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl
          transform transition-all duration-300 ease-in-out flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'w-64'}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link to={homePath} className={`flex items-center gap-3 transition-opacity duration-200 ${collapsed && !isMobile ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center shadow-lg">
              <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white">MasterTech</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Construction</span>
            </div>
          </Link>
          {!isMobile && (
            <button onClick={onToggleCollapse} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200" aria-label="Toggle sidebar">
              <Icon d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} className="w-4 h-4" />
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
              <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Menu
            </div>
          )}
          {menuItems.map((item) => (
            <SidebarItem key={item.label} item={item} collapsed={collapsed} isActive={isActive(item.path)} onClick={onClose} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">A</div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profileEmail}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
