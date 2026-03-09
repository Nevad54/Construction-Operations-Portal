import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { useProjects } from '../context/ProjectContext';
import { api } from '../services/api';

vi.mock('../context/ProjectContext', () => ({
  useProjects: vi.fn(),
}));

vi.mock('../services/api', () => ({
  api: {
    me: vi.fn(),
    logout: vi.fn(),
    adminListUsers: vi.fn(),
    adminCreateUser: vi.fn(),
    adminUpdateUser: vi.fn(),
    adminResetUserPassword: vi.fn(),
    adminDeleteUser: vi.fn(),
    adminListInquiries: vi.fn(),
    adminUpdateInquiry: vi.fn(),
    adminDeleteInquiry: vi.fn(),
    adminGetKpis: vi.fn(),
    getFiles: vi.fn(),
    getActivityLogs: vi.fn(),
    adminExportActivity: vi.fn(),
    adminExportUsers: vi.fn(),
    adminExportInquiries: vi.fn(),
  },
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('aos', () => ({
  default: {
    init: vi.fn(),
    refresh: vi.fn(),
    refreshHard: vi.fn(),
  },
}));

vi.mock('./ProjectCard', () => ({
  default: ({ project }) => <div>{project.title}</div>,
}));

vi.mock('./files/FileManager', () => ({
  default: () => <div>Admin File Management</div>,
}));

vi.mock('./auth/AccountSettings', () => ({
  default: () => <div>Admin Account Settings</div>,
}));

const mockedUseProjects = vi.mocked(useProjects);
const mockedApi = vi.mocked(api);
const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const baseProjects = [
  {
    _id: 'p-1',
    title: 'Boiler Upgrade',
    description: 'Replace aging plant equipment during a planned shutdown.',
    location: 'Plant 1',
    status: 'ongoing',
  },
  {
    _id: 'p-2',
    title: 'Office Fit-Out',
    description: 'Prepare completed tenant space for turnover.',
    location: 'Tower 2',
    status: 'completed',
  },
];

const renderAdminDashboard = (route) =>
  render(
    <MemoryRouter initialEntries={[route]} future={memoryRouterFutureFlags}>
      <AdminDashboard />
    </MemoryRouter>
  );

const setViewportWidth = (width) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

describe('AdminDashboard route shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseProjects.mockReturnValue({
      projects: baseProjects,
      loading: false,
      error: null,
      addProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshProjects: vi.fn(),
    });

    mockedApi.me.mockResolvedValue({ user: { id: 'admin-1', username: 'admin', role: 'admin' } });
    mockedApi.logout.mockResolvedValue({});
    mockedApi.adminListUsers.mockResolvedValue([
      { id: 'u-1', username: 'casey', role: 'admin', projectIds: [] },
      { id: 'u-2', username: 'jamie', role: 'user', projectIds: ['p-1'] },
    ]);
    mockedApi.adminListInquiries.mockResolvedValue({
      items: [
        {
          id: 'i-1',
          name: 'Taylor Client',
          email: 'taylor@example.com',
          message: 'Need support for an active fit-out scope.',
          status: 'new',
          priority: 'high',
          owner: 'casey',
          nextFollowUpAt: '',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
    mockedApi.adminUpdateInquiry.mockResolvedValue({});
    mockedApi.adminGetKpis.mockResolvedValue({
      kpis: {
        new_today: 3,
        overdue_followups: 2,
        qualified_rate: 50,
        proposal_rate: 25,
      },
    });
    mockedApi.getFiles.mockResolvedValue([]);
    mockedApi.getActivityLogs.mockResolvedValue({ logs: [{ _id: 'a-1', action: 'login', details: 'Admin signed in' }] });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ usingFallback: false }),
    });
    window.innerWidth = 1440;
  });

  test('projects route shows the operations hero and route-aware search', async () => {
    renderAdminDashboard('/admin/dashboard/projects');

    expect(await screen.findByRole('heading', { name: 'Keep active work visible and delivery updates current.' })).toBeInTheDocument();
    expect(screen.getByText('Tracked projects')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add New Project' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Search work orders' })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Search work orders, locations, or owners')).toBeInTheDocument();
  });

  test('clients route shows admin triage context and hides the top work-order search', async () => {
    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByRole('heading', { name: 'Triage incoming demand and keep account access aligned.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    expect(screen.getByText('Inquiry queue')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApi.adminListUsers).toHaveBeenCalled();
      expect(mockedApi.adminListInquiries).toHaveBeenCalled();
    });
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('clients route supports quick inquiry triage actions from the queue', async () => {
    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByRole('button', { name: 'Start Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule Follow-up' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Review' }));

    await waitFor(() => {
      expect(mockedApi.adminUpdateInquiry).toHaveBeenCalledWith(
        'i-1',
        expect.objectContaining({
          status: 'in_progress',
          owner: 'casey',
          assignedTo: 'casey',
        })
      );
    });
  });

  test('inquiry modal exposes invalid field state when required triage fields are missing', async () => {
    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByRole('button', { name: 'Open Triage' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Triage' }));

    const ownerSelect = await screen.findByLabelText('Owner');
    const followUpInput = screen.getByLabelText('Next Follow-up');

    fireEvent.change(ownerSelect, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Inquiry' }));

    await waitFor(() => {
      expect(ownerSelect).toHaveAttribute('aria-invalid', 'true');
      expect(followUpInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Owner is required')).toBeInTheDocument();
      expect(screen.getByText('Next follow-up date is required for active inquiries')).toBeInTheDocument();
    });
  });

  test('reports route shows analytics fallback state when report loading fails', async () => {
    mockedApi.adminGetKpis.mockRejectedValueOnce(new Error('Reports unavailable'));

    renderAdminDashboard('/admin/dashboard/reports');

    expect(await screen.findByRole('heading', { name: 'Read operational health before issues compound.' })).toBeInTheDocument();
    expect(await screen.findByText('Reports unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('reports route shows the operator summary before detailed KPI cards', async () => {
    renderAdminDashboard('/admin/dashboard/reports');

    expect(await screen.findByText('Operations Summary')).toBeInTheDocument();
    expect(screen.getByText('Response posture')).toBeInTheDocument();
    expect(screen.getByText('Inquiry pressure')).toBeInTheDocument();
    expect(screen.getByText('Follow-up drift present')).toBeInTheDocument();
  });

  test('files route renders the admin file manager shell without work-order search', async () => {
    renderAdminDashboard('/admin/dashboard/files');

    expect(await screen.findByRole('heading', { name: 'Control shared documentation without losing access discipline.' })).toBeInTheDocument();
    expect(screen.getByText('Admin File Management')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('settings route renders account settings shell without work-order search', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByRole('heading', { name: 'Maintain admin account controls and workspace preferences.' })).toBeInTheDocument();
    expect(screen.getByText('Admin Account Settings')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('projects route preserves retry guidance when project data fails to load', async () => {
    const refreshProjects = vi.fn();
    mockedUseProjects.mockReturnValueOnce({
      projects: [],
      loading: false,
      error: 'Could not load projects.',
      addProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      refreshProjects,
    });

    renderAdminDashboard('/admin/dashboard/projects');

    expect(await screen.findByText('Could not load projects.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refreshProjects).toHaveBeenCalledTimes(1);
  });

  test('projects route supports the mobile menu drawer and mobile search toggle', async () => {
    setViewportWidth(390);
    renderAdminDashboard('/admin/dashboard/projects');

    expect(await screen.findByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close sidebar overlay' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));

    expect(await screen.findByText('Admin portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close sidebar overlay' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar overlay' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close sidebar overlay' })).not.toBeInTheDocument();
    });

    expect(screen.getAllByRole('searchbox', { name: 'Search work orders' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findAllByRole('searchbox', { name: 'Search work orders' })).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('Search work orders, locations, or owners')).toHaveLength(2);
  });

  test('reports route keeps mobile navigation available without exposing project search', async () => {
    setViewportWidth(390);
    renderAdminDashboard('/admin/dashboard/reports');

    expect(await screen.findByRole('heading', { name: 'Read operational health before issues compound.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(await screen.findByText('Analytics')).toBeInTheDocument();
  });
});
