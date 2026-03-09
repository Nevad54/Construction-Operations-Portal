import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleLogin from './components/auth/RoleLogin';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
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
  });

  test('ProtectedRoute redirects unauthenticated admins to admin login', async () => {
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
          <Route path="/login/admin" element={<div>Admin Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Login Screen')).toBeInTheDocument();
  });

  test('ProtectedRoute redirects signed-in users away from the wrong role route', async () => {
    api.me.mockResolvedValueOnce({ user: { id: 'user-1', username: 'employee', role: 'user' } });

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

  test('ProtectedRoute redirects unauthenticated clients to client login', async () => {
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
          <Route path="/login/client" element={<div>Client Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Client Login Screen')).toBeInTheDocument();
  });

  test('RoleLogin signs in and routes admins to the requested dashboard', async () => {
    api.me
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce({ user: { id: 'admin-1', username: 'admin', role: 'admin' } });
    api.login.mockResolvedValueOnce({ user: { id: 'admin-1', username: 'admin', role: 'admin' } });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/login/admin', state: { from: '/admin/dashboard/reports' } }]}
        future={memoryRouterFutureFlags}
      >
        <Routes>
          <Route path="/login/admin" element={<RoleLogin role="admin" />} />
          <Route path="/admin/dashboard/reports" element={<div>Reports dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('1111');
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('admin', '1111');
    });
    expect(await screen.findByText('Reports dashboard')).toBeInTheDocument();
  });
});
