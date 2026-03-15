import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import UserDashboard from './UserDashboard';

vi.mock('./dashboard', () => ({
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('./files/FileManager', () => ({
  default: () => <div>User File Management</div>,
}));

vi.mock('./auth/AccountSettings', () => ({
  default: () => <div>User Account Settings</div>,
}));

const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const renderUserDashboard = (route = '/user/dashboard') =>
  render(
    <MemoryRouter initialEntries={[route]} future={memoryRouterFutureFlags}>
      <UserDashboard />
    </MemoryRouter>
  );

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('overview route shows the two clear next-step links', () => {
    renderUserDashboard('/user/dashboard');

    expect(screen.getByRole('heading', { name: 'Workspace Overview' })).toBeInTheDocument();
    expect(screen.getByText(/this page keeps the employee tools simple/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open my files' })).toHaveAttribute('href', '/user/dashboard/files');
    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/user/dashboard/settings');
  });

  test('files route renders the file manager', () => {
    renderUserDashboard('/user/dashboard/files');
    expect(screen.getByText('User File Management')).toBeInTheDocument();
  });

  test('settings route renders account settings', () => {
    renderUserDashboard('/user/dashboard/settings');
    expect(screen.getByText('User Account Settings')).toBeInTheDocument();
  });
});
