import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from './dashboard';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import FileManager from './files/FileManager';
import AccountSettings from './auth/AccountSettings';

const userMenuItems = [
  { path: '/user/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/user/dashboard/projects', label: 'My Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/user/dashboard/files', label: 'My Files', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4' },
  { path: '/user/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function UserDashboard() {
  const location = useLocation();
  const isFilesPage = location.pathname === '/user/dashboard/files';
  const isSettingsPage = location.pathname === '/user/dashboard/settings';

  const pageMeta = useMemo(() => {
    if (location.pathname === '/user/dashboard/projects') {
      return { title: 'My Projects', description: 'Track your assigned work orders and project updates.' };
    }
    if (location.pathname === '/user/dashboard/settings') {
      return { title: 'Settings', description: 'Manage your user preferences and notifications.' };
    }
    return { title: 'User Dashboard', description: 'Employee workspace overview and file activity.' };
  }, [location.pathname]);

  return (
    <DashboardLayout
      sidebarHomePath="/user/dashboard"
      sidebarMenuItems={userMenuItems}
      sidebarProfileName="Employee"
      sidebarProfileEmail="employee@mastertech"
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
            <p className="text-text-secondary dark:text-gray-400">{pageMeta.description}</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
