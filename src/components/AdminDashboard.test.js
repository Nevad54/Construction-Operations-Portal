import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    adminSetUserActive: vi.fn(),
    adminResetUserPassword: vi.fn(),
    adminDeleteUser: vi.fn(),
    adminSystemStatus: vi.fn(),
    adminListInquiries: vi.fn(),
    adminUpdateInquiry: vi.fn(),
    adminDeleteInquiry: vi.fn(),
    adminGetKpis: vi.fn(),
    getFiles: vi.fn(),
    updateFile: vi.fn(),
    getActivityLogs: vi.fn(),
    adminExportActivity: vi.fn(),
    adminExportUsers: vi.fn(),
    adminExportInquiries: vi.fn(),
    adminExportAllData: vi.fn(),
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

    mockedApi.me.mockResolvedValue({ user: { id: 'admin-1', username: 'admin', email: 'admin@construction.local', role: 'admin' } });
    mockedApi.logout.mockResolvedValue({});
    mockedApi.adminListUsers.mockResolvedValue([
      { id: 'u-1', username: 'casey', email: 'casey@example.com', role: 'admin', isActive: true, projectIds: [] },
      { id: 'u-2', username: 'jamie', email: 'jamie@example.com', role: 'user', isActive: true, projectIds: ['p-1'] },
      { id: 'u-3', username: 'alex', email: 'alex@example.com', role: 'client', isActive: false, projectIds: [] },
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
        {
          id: 'i-2',
          name: 'Jordan Approver',
          email: 'jordan@example.com',
          message: 'Approving "Permit Set A.pdf" for North Plant Retrofit.',
          source: 'client-workspace',
          notes: 'Context: approval-approved',
          status: 'new',
          priority: 'normal',
          owner: 'casey',
          nextFollowUpAt: '',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'i-3',
          name: 'Riley Reviewer',
          email: 'riley@example.com',
          message: 'Requesting changes on "homeowner-closeout-package.pdf" for Homeowner Condo Fit-Out.',
          source: 'client-workspace',
          notes: 'Context: approval-changes',
          status: 'new',
          priority: 'high',
          owner: 'casey',
          nextFollowUpAt: '',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 3,
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
    mockedApi.getFiles.mockResolvedValue([
      {
        _id: 'file-1',
        originalName: 'handoff-demo.pdf',
        visibility: 'team',
        folder: 'demo-assets',
        projectId: '',
        tags: ['demo'],
        createdAt: '2025-12-01T10:00:00.000Z',
        updatedAt: '2025-12-15T10:00:00.000Z',
      },
      {
        _id: 'file-2',
        originalName: 'client-approval.pdf',
        visibility: 'client',
        folder: 'approvals',
        projectId: '',
        tags: [],
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
      },
      {
        _id: 'file-3',
        originalName: 'site-progress-photo.jpg',
        visibility: 'client',
        folder: 'progress',
        projectId: 'missing-project',
        tags: [],
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
      },
      {
        _id: 'file-4',
        originalName: 'turnover-package.pdf',
        visibility: 'team',
        folder: 'closeout',
        projectId: 'p-1',
        tags: ['closeout'],
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
      },
    ]);
    mockedApi.getActivityLogs.mockResolvedValue({ logs: [
      { _id: 'a-0', action: 'auth.bootstrap_admin', details: 'First admin account created for owner@example.com', createdAt: new Date().toISOString() },
      { _id: 'a-1', action: 'auth.login_failed', details: 'Failed login attempt for jamie@example.com', createdAt: new Date().toISOString() },
      { _id: 'a-2', action: 'admin.user_deactivate', details: 'Admin deactivated user jamie@example.com (user)', createdAt: new Date().toISOString() },
      { _id: 'a-3', action: 'admin.export_all', details: 'Admin exported the full admin data bundle', createdAt: new Date().toISOString() },
      { _id: 'a-4', action: 'admin.inquiry_update', details: 'Inquiry i-1 marked in progress', createdAt: new Date().toISOString() },
    ] });
    mockedApi.adminSystemStatus.mockResolvedValue({
      dbConnected: true,
      usingFallback: false,
      emailConfigured: true,
      frontendUrlConfigured: true,
      cloudStorageEnabled: true,
      cloudConvertEnabled: true,
      isProduction: false,
      demoSeedEnabled: true,
      adminCount: 1,
      inactiveUserCount: 1,
      recentFailedLogins: 3,
      requiresAdminSetup: false,
      setupComplete: true,
      setupTokenConfigured: false,
      passwordPolicy: { minLength: 8, requiresLetter: true, requiresNumber: true },
      lastExports: {
        users: '2026-03-09T03:00:00.000Z',
        inquiries: null,
        activity: '2026-03-09T04:00:00.000Z',
        all: null,
      },
      alerts: [
        { severity: 'info', code: 'demo_seed_enabled', message: 'Demo seed accounts are enabled in this environment for local testing only.' },
      ],
    });
    mockedApi.adminExportAllData.mockResolvedValue(new Blob(['{}'], { type: 'application/json' }));
    mockedApi.updateFile.mockResolvedValue({});
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

    expect((await screen.findAllByRole('button', { name: 'Start Review' })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Schedule Follow-up' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Start Review' })[0]);

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

  test('clients route labels client approval traffic distinctly and supports approval-specific quick actions', async () => {
    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByText('Approval Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
    expect(screen.getByText('Change requests')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge Approval' }));

    await waitFor(() => {
      expect(mockedApi.adminUpdateInquiry).toHaveBeenCalledWith(
        'i-2',
        expect.objectContaining({
          status: 'resolved',
          owner: 'casey',
          assignedTo: 'casey',
          nextFollowUpAt: '',
        })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start Change Review' }));

    await waitFor(() => {
      expect(mockedApi.adminUpdateInquiry).toHaveBeenCalledWith(
        'i-3',
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

    expect((await screen.findAllByRole('button', { name: 'Open Triage' })).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open Triage' })[0]);

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

  test('user edit modal assigns project access by project name instead of raw ids', async () => {
    mockedApi.adminUpdateUser.mockResolvedValueOnce({});
    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByText('casey@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]);

    expect(await screen.findByText('Project Access')).toBeInTheDocument();
    expect(screen.getByText('Boiler Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Office Fit-Out')).toBeInTheDocument();
    expect(screen.queryByLabelText('Assigned Project IDs')).not.toBeInTheDocument();

    const officeFitOutCheckbox = screen.getByRole('checkbox', { name: /Office Fit-Out/i });
    await userEvent.click(officeFitOutCheckbox);
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    });

    await waitFor(() => {
      expect(mockedApi.adminUpdateUser).toHaveBeenCalledWith(
        'u-2',
        expect.objectContaining({
          email: 'jamie@example.com',
          role: 'user',
          projectIds: ['p-1', 'p-2'],
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Project Access')).not.toBeInTheDocument();
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
    expect(screen.getByText('Auth Events')).toBeInTheDocument();
    expect(screen.getByText(/failed sign-ins .* reset requests .* deactivations/i)).toBeInTheDocument();
    expect(screen.getByText(/first-admin setup event/i)).toBeInTheDocument();
    expect(screen.getByText('First admin bootstrap completed')).toBeInTheDocument();
    expect(screen.getByText('Sign-in failed')).toBeInTheDocument();
    expect(screen.getByText('File Hygiene Watch')).toBeInTheDocument();
    expect(screen.getAllByText('client-approval.pdf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('handoff-demo.pdf').length).toBeGreaterThan(0);
  });

  test('reports route filters recent activity by category', async () => {
    renderAdminDashboard('/admin/dashboard/reports');

    expect(await screen.findByText('Activity Filters')).toBeInTheDocument();
    expect(screen.getByText(/Showing 5 of 5 activity logs/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Activity category'), { target: { value: 'exports' } });

    expect(await screen.findByText(/Showing 1 of 5 activity logs/i)).toBeInTheDocument();
    expect(screen.getByText('Admin exported the full admin data bundle')).toBeInTheDocument();
    expect(screen.queryByText('Failed login attempt for jamie@example.com')).not.toBeInTheDocument();
  });

  test('reports route exports activity using the active category filter', async () => {
    mockedApi.adminExportActivity.mockResolvedValue(new Blob(['activity'], { type: 'text/csv' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:activity-export');
    global.URL.revokeObjectURL = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderAdminDashboard('/admin/dashboard/reports');

    expect(await screen.findByText('Activity Filters')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Activity category'), { target: { value: 'auth' } });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Export Activity CSV' }));
    });

    await waitFor(() => {
      expect(mockedApi.adminExportActivity).toHaveBeenCalledWith({ limit: 0, category: 'auth' });
    });

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  test('files route renders the admin file manager shell without work-order search', async () => {
    renderAdminDashboard('/admin/dashboard/files');

    expect(await screen.findByRole('heading', { name: 'Control shared documentation without losing access discipline.' })).toBeInTheDocument();
    expect(screen.getByText('File Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Stale Files')).toBeInTheDocument();
    expect(screen.getByText('Client Visibility Issues')).toBeInTheDocument();
    expect(screen.getByText('Demo/Test Clutter')).toBeInTheDocument();
    expect(screen.getAllByText('client-approval.pdf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('handoff-demo.pdf').length).toBeGreaterThan(0);
    expect(screen.getByText('Admin File Management')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('files route lets the owner mark stale files as reviewed', async () => {
    renderAdminDashboard('/admin/dashboard/files');

    expect(await screen.findByText('File Hygiene')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Mark Reviewed' }));
    });

    await waitFor(() => {
      expect(mockedApi.updateFile).toHaveBeenCalledWith(
        'file-1',
        expect.objectContaining({
          tags: expect.arrayContaining(['reviewed']),
        })
      );
    });
    expect(mockedApi.getFiles).toHaveBeenCalledTimes(2);
  });

  test('files route lets the owner hide weak client-visible records from clients', async () => {
    renderAdminDashboard('/admin/dashboard/files');

    expect(await screen.findByText('File Hygiene')).toBeInTheDocument();
    const hideButtons = screen.getAllByRole('button', { name: 'Hide From Clients' });

    await act(async () => {
      await userEvent.click(hideButtons[0]);
    });

    await waitFor(() => {
      expect(mockedApi.updateFile).toHaveBeenCalledWith(
        'file-2',
        expect.objectContaining({
          visibility: 'private',
          tags: expect.arrayContaining(['client-hidden']),
        })
      );
    });
  });

  test('files route lets the owner archive demo clutter safely', async () => {
    renderAdminDashboard('/admin/dashboard/files');

    expect(await screen.findByText('File Hygiene')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Archive Record' }));
    });

    await waitFor(() => {
      expect(mockedApi.updateFile).toHaveBeenCalledWith(
        'file-1',
        expect.objectContaining({
          folder: 'archive/demo-assets',
          tags: expect.arrayContaining(['archived', 'reviewed-cleanup']),
        })
      );
    });
  });

  test('settings route renders account settings shell without work-order search', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByRole('heading', { name: 'Maintain admin account controls and workspace preferences.' })).toBeInTheDocument();
    expect(await screen.findByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getAllByText('Configured').length).toBeGreaterThan(0);
    expect(screen.getByText('Password Policy')).toBeInTheDocument();
    expect(screen.getByText('Setup State')).toBeInTheDocument();
    expect(screen.getByText('Inactive Users')).toBeInTheDocument();
    expect(screen.getByText('Failed Sign-Ins (7d)')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/First-run admin setup is complete/i)).toBeInTheDocument();
    expect(screen.getByText(/No bootstrap setup token is currently configured/i)).toBeInTheDocument();
    expect(screen.getByText('Last Exports')).toBeInTheDocument();
    expect(screen.getByText('Users CSV')).toBeInTheDocument();
    expect(screen.getByText('Activity CSV')).toBeInTheDocument();
    expect(screen.getAllByText('Not exported yet').length).toBeGreaterThan(0);
    expect(screen.getByText('Demo seed accounts are enabled in this environment for local testing only.')).toBeInTheDocument();
    expect(screen.getByText('Admin Account Settings')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search work orders' })).not.toBeInTheDocument();
  });

  test('settings route exports the full admin bundle and refreshes status', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:admin-export');
    global.URL.revokeObjectURL = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderAdminDashboard('/admin/dashboard/settings');

    await screen.findByText('System Status');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Export All Admin Data' }));
    });

    await waitFor(() => {
      expect(mockedApi.adminExportAllData).toHaveBeenCalled();
      expect(mockedApi.adminSystemStatus).toHaveBeenCalledTimes(2);
    });

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  test('settings route exposes quick actions for reports and people workflows', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByText('System Status')).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Open Reports' }));
    });
    expect(await screen.findByRole('heading', { name: 'Read operational health before issues compound.' })).toBeInTheDocument();
  });

  test('settings route links operators back to people and request management', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByText('System Status')).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Open People & Requests' }));
    });
    expect(await screen.findByRole('heading', { name: 'Triage incoming demand and keep account access aligned.' })).toBeInTheDocument();
  });

  test('settings route deep-links to inactive users', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByText('System Status')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Review Inactive Users' }));
    });

    expect(await screen.findByText('alex@example.com')).toBeInTheDocument();
    expect(screen.queryByText('casey@example.com')).not.toBeInTheDocument();
  });

  test('settings route deep-links to auth activity review', async () => {
    renderAdminDashboard('/admin/dashboard/settings');

    expect(await screen.findByText('System Status')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Review Failed Sign-Ins' }));
    });

    expect(await screen.findByRole('heading', { name: 'Read operational health before issues compound.' })).toBeInTheDocument();
    expect(screen.getByLabelText('Activity category')).toHaveValue('auth');
    expect(screen.getByText('Failed login attempt for jamie@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Admin exported the full admin data bundle')).not.toBeInTheDocument();
  });

  test('clients route filters to inactive users and exports the matching access state', async () => {
    mockedApi.adminExportUsers.mockResolvedValue(new Blob(['users'], { type: 'text/csv' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:users-export');
    global.URL.revokeObjectURL = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderAdminDashboard('/admin/dashboard/clients');

    expect(await screen.findByText('casey@example.com')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('User status filter'), { target: { value: 'inactive' } });

    expect(await screen.findByText('alex@example.com')).toBeInTheDocument();
    expect(screen.queryByText('casey@example.com')).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Export Users' }));
    });

    await waitFor(() => {
      expect(mockedApi.adminExportUsers).toHaveBeenCalledWith({ active: 'inactive' });
    });

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    clickSpy.mockRestore();
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
    expect(screen.getByText('Projects')).toBeInTheDocument();
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
    expect(await screen.findByText('Reports')).toBeInTheDocument();
  });
});
