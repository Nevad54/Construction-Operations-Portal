import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleLogin from './components/auth/RoleLogin';
import AdminBootstrap from './components/auth/AdminBootstrap';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getSetupStatus: vi.fn(),
    bootstrapAdmin: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('./utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe('auth flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getSetupStatus.mockResolvedValue({ ok: true, requiresAdminSetup: false, adminCount: 1, demoSeedEnabled: true, isProduction: false });
  });

  test('ProtectedRoute redirects unauthenticated admins to staff sign-in', async () => {
    api.me.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute role="admin">
                <div>Admin dashboard</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/staff/signin" element={<div>Staff Sign-In Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Staff Sign-In Screen')).toBeInTheDocument();
  });

  test('ProtectedRoute redirects signed-in users away from the wrong role route', async () => {
    api.me.mockResolvedValueOnce({ user: { id: 'user-1', username: 'employee', email: 'employee@construction.local', role: 'user' } });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute role="admin">
                <div>Admin dashboard</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/user/dashboard" element={<div>User dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('User dashboard')).toBeInTheDocument();
  });

  test('ProtectedRoute redirects unauthenticated clients to public sign-in', async () => {
    api.me.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/client/workspace']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route
            path="/client/workspace"
            element={(
              <ProtectedRoute role="client">
                <div>Client workspace</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/signin" element={<div>Public Sign-In Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Public Sign-In Screen')).toBeInTheDocument();
  });

  test('legacy admin login route redirects to staff sign-in', async () => {
    render(
      <MemoryRouter initialEntries={['/login/admin']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/login/admin" element={<Navigate to="/staff/signin" replace />} />
          <Route path="/staff/signin" element={<RoleLogin variant="staff" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument();
  });

  test('legacy client login route redirects to public sign-in', async () => {
    render(
      <MemoryRouter initialEntries={['/login/client']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/login/client" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<RoleLogin variant="public" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('staff sign-in routes admins to the requested dashboard', async () => {
    api.me
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce({ user: { id: 'admin-1', username: 'admin', email: 'admin@construction.local', role: 'admin' } });
    api.login.mockResolvedValueOnce({ user: { id: 'admin-1', username: 'admin', email: 'admin@construction.local', role: 'admin' } });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/staff/signin', state: { from: '/admin/dashboard/reports' } }]}
        future={memoryRouterFutureFlags}
      >
        <Routes>
          <Route path="/staff/signin" element={<RoleLogin variant="staff" />} />
          <Route path="/admin/dashboard/reports" element={<div>Reports dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument();
    expect(screen.getByText(/localhost testing only/i)).toBeInTheDocument();
    expect(screen.getByText(/Employee access/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin access/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request password help/i })).toHaveAttribute(
      'href',
      '/forgot-password?audience=staff&email=employee%40construction.local'
    );

    const emailInput = screen.getByLabelText(/Email/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });

    expect(emailInput).toHaveValue('employee@construction.local');
    expect(emailInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    expect(passwordInput).toHaveValue('1111');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'admin@construction.local');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('admin@construction.local', '1111');
    });
    expect(await screen.findByText('Reports dashboard')).toBeInTheDocument();
  });

  test('signup route opens client account creation', async () => {
    api.me.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/signup']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/signup" element={<RoleLogin variant="signup" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText(/Email/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'email');
  });

  test('public sign-in sends clients to the client workspace', async () => {
    api.me
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValue({ user: { id: 'client-1', username: 'client', email: 'client@construction.local', role: 'client' } });
    api.login.mockResolvedValueOnce({ user: { id: 'client-1', username: 'client', email: 'client@construction.local', role: 'client' } });

    render(
      <MemoryRouter initialEntries={['/signin']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/signin" element={<RoleLogin variant="public" />} />
          <Route path="/client/workspace" element={<div>Client workspace</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText(/Client account/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i, { selector: 'input' })).toHaveValue('client@construction.local');
    expect(screen.getByRole('link', { name: /Request password help/i })).toHaveAttribute(
      'href',
      '/forgot-password?email=client%40construction.local'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('client@construction.local', '1111');
    });
    expect(await screen.findByText('Client workspace')).toBeInTheDocument();
  });

  test('signup view supports password visibility toggles', async () => {
    api.me.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/signup']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/signup" element={<RoleLogin variant="signup" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Create account')).toBeInTheDocument();

    const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/Password/i, { selector: 'input' });

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show confirm password' }));

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  test('forgot password sends a reset request and shows the development note', async () => {
    api.forgotPassword.mockResolvedValueOnce({
      ok: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
      resetUrl: 'http://localhost:3000/reset-password?token=demo-token&audience=staff',
    });

    render(
      <MemoryRouter initialEntries={['/forgot-password?audience=staff&email=employee@construction.local']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<div>Reset password page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Staff password reset' })).toBeInTheDocument();
    const forgotEmailInput = screen.getByLabelText(/Email/i, { selector: 'input' });
    expect(forgotEmailInput).toHaveValue('employee@construction.local');
    expect(forgotEmailInput).toHaveAttribute('autocomplete', 'email');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    });

    await waitFor(() => {
      expect(api.forgotPassword).toHaveBeenCalledWith({ email: 'employee@construction.local', audience: 'staff' });
    });
    expect(screen.getByText(/Development mode: if email delivery is not configured, check the backend console for the reset link./i)).toBeInTheDocument();
  });

  test('staff sign-in shows the first-admin setup path when production bootstrap is required', async () => {
    api.getSetupStatus.mockResolvedValueOnce({
      ok: true,
      requiresAdminSetup: true,
      adminCount: 0,
      setupTokenConfigured: true,
      demoSeedEnabled: false,
      isProduction: true,
    });
    api.me.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/staff/signin']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/staff/signin" element={<RoleLogin variant="staff" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Production setup is incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first admin setup/i })).toHaveAttribute('href', '/setup/admin');
  });

  test('admin bootstrap creates the first admin and routes to the admin dashboard', async () => {
    api.getSetupStatus.mockResolvedValueOnce({
      ok: true,
      requiresAdminSetup: true,
      adminCount: 0,
      setupTokenConfigured: true,
      demoSeedEnabled: false,
      isProduction: true,
    });
    api.bootstrapAdmin.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'owner@example.com', role: 'admin' },
    });

    render(
      <MemoryRouter initialEntries={['/setup/admin']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/setup/admin" element={<AdminBootstrap />} />
          <Route path="/admin/dashboard/projects" element={<div>Admin projects dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'First Admin Setup' })).toBeInTheDocument();
    const bootstrapEmailInput = screen.getByLabelText(/Admin Email/i, { selector: 'input' });
    const setupTokenInput = screen.getByLabelText(/Setup Token/i, { selector: 'input' });
    expect(bootstrapEmailInput).toHaveAttribute('autocomplete', 'email');
    expect(setupTokenInput).toHaveAttribute('autocomplete', 'one-time-code');
    await userEvent.type(bootstrapEmailInput, 'owner@example.com');
    const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/Password/i, { selector: 'input' });
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    await userEvent.type(passwordInput, 'admin1234');
    await userEvent.type(confirmPasswordInput, 'admin1234');
    await userEvent.type(setupTokenInput, 'setup-secret');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Create First Admin' }));
    });

    await waitFor(() => {
      expect(api.bootstrapAdmin).toHaveBeenCalledWith({
        email: 'owner@example.com',
        password: 'admin1234',
        setupToken: 'setup-secret',
      });
    });
    expect(await screen.findByText('Admin projects dashboard')).toBeInTheDocument();
  });

  test('reset password submits the token and new password', async () => {
    api.resetPassword.mockResolvedValueOnce({ ok: true });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=demo-token&audience=staff']} future={memoryRouterFutureFlags}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/staff/signin" element={<div>Staff Sign-In Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Set a new password' })).toBeInTheDocument();
    const [newPasswordInput, confirmNewPasswordInput] = screen.getAllByLabelText(/New Password/i, { selector: 'input' });
    expect(newPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmNewPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    await userEvent.type(newPasswordInput, 'abc12345');
    await userEvent.type(confirmNewPasswordInput, 'abc12345');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    });

    await waitFor(() => {
      expect(api.resetPassword).toHaveBeenCalledWith({ token: 'demo-token', newPassword: 'abc12345' });
    });
    expect(await screen.findByText(/Password updated/i)).toBeInTheDocument();
  });
});
