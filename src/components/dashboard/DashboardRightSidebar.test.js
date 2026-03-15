import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DashboardRightSidebar from './DashboardRightSidebar';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getProjects: vi.fn(),
    getActivityLogs: vi.fn(),
    adminSystemStatus: vi.fn(),
  },
}));

describe('DashboardRightSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProjects).mockResolvedValue([
      { _id: 'p-1', title: 'Bridge Retrofit Program', status: 'ongoing' },
      { _id: 'p-2', title: 'School Building Retrofit', status: 'completed' },
    ]);
    vi.mocked(api.getActivityLogs).mockResolvedValue({
      logs: [
        {
          _id: 'a-1',
          action: 'auth.login_failed',
          details: 'Failed sign-in for employee@construction.local',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.mocked(api.adminSystemStatus).mockResolvedValue({
      failedLoginCount: 2,
      inactiveUserCount: 1,
      emailConfigured: false,
      frontendUrlConfigured: true,
    });
  });

  test('replaces placeholder summary cards with live admin signals', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard/projects']}>
        <DashboardRightSidebar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Workspace Snapshot')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('Failed Sign-Ins')).toBeInTheDocument();
    expect(screen.getByText('2 failed sign-ins this week')).toBeInTheDocument();
    expect(screen.getByText('1 inactive account waiting for review')).toBeInTheDocument();
    expect(screen.getByText('Sign-in failed')).toBeInTheDocument();

    expect(screen.queryByText(/Site A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Renovation B/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Commercial C/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No one else online/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Invite Team Members/i)).not.toBeInTheDocument();
  });
});
