import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './dashboard';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import FileManager from './files/FileManager';
import AccountSettings from './auth/AccountSettings';

const userMenuItems = [
  { path: '/user/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/user/dashboard/files', label: 'My Files', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4' },
  { path: '/user/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function UserDashboard() {
  const location = useLocation();
  if (location.pathname === '/user/dashboard/projects') {
    return <Navigate to="/user/dashboard" replace />;
  }

  const isFilesPage = location.pathname === '/user/dashboard/files';
  const isSettingsPage = location.pathname === '/user/dashboard/settings';

  const pageMeta = useMemo(() => {
    if (location.pathname === '/user/dashboard/settings') {
      return { title: 'Settings', description: 'Manage your user preferences and notifications.' };
    }
    return { title: 'Workspace Overview', description: 'Use the employee workspace to review shared files, watch delivery handoffs, and keep your account settings current.' };
  }, [location.pathname]);

  return (
    <DashboardLayout
      sidebarHomePath="/user/dashboard"
      sidebarMenuItems={userMenuItems}
      sidebarProfileName="Employee"
      sidebarProfileEmail="employee@construction.local"
    >
      {isFilesPage ? (
        <FileManager expectedRole="user" title="User File Management" />
      ) : isSettingsPage ? (
        <AccountSettings mode="user" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{pageMeta.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-text-secondary dark:text-gray-400">{pageMeta.description}</p>
              <p className="text-text-secondary dark:text-gray-400">
                This route stays intentionally light until the employee-facing project workspace is mature enough to justify
                its own navigation section. Files and settings are the useful paths today.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
