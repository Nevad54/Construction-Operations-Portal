import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { trackEvent } from '../../utils/analytics';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';

const roleHome = {
  admin: '/admin/dashboard',
  user: '/user/dashboard',
  client: '/client/workspace',
};

const roleHints = {
  admin: { username: 'admin', password: '1111' },
  user: { username: 'employee', password: '1111' },
  client: { username: 'client', password: '1111' },
};

export default function RoleLogin({ role = 'user' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: roleHints[role]?.username || '',
    password: roleHints[role]?.password || '',
    confirmPassword: '',
    adminCode: '',
  });

  const fromPath = location.state?.from;
  const titleByRole = {
    admin: mode === 'login' ? 'Admin Login' : 'Create Admin Account',
    user: mode === 'login' ? 'User Login' : 'Create User Account',
    client: mode === 'login' ? 'Client Login' : 'Create Client Account',
  };

  const subtitleByRole = {
    admin: mode === 'login'
      ? 'Sign in to access admin dashboard and management features.'
      : 'Create a new admin account. Admin signup code is required.',
    user: mode === 'login'
      ? 'Sign in to access employee dashboard and files.'
      : 'Create a new employee user account.',
    client: mode === 'login'
      ? 'Sign in to review shared files, project handoff updates, and current next actions.'
      : 'Create a new client account for shared project visibility.',
  };

  const title = titleByRole[role] || titleByRole.user;
  const subtitle = subtitleByRole[role] || subtitleByRole.user;

  const successPath = useMemo(() => {
    if (typeof fromPath === 'string' && fromPath.trim()) return fromPath;
    return roleHome[role] || '/';
  }, [fromPath, role]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const data = await api.me();
        if (!active) return;
        const currentRole = data?.user?.role;
        if (currentRole === role) {
          navigate(successPath, { replace: true });
        }
      } catch (err) {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    check();
    return () => {
      active = false;
    };
  }, [navigate, role, successPath]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await api.register({
          username: form.username,
          password: form.password,
          role,
          adminCode: role === 'admin' ? form.adminCode : '',
        });
        navigate(successPath, { replace: true });
        return;
      }

      await api.login(form.username, form.password);
      const data = await api.me();
      const currentRole = data?.user?.role;
      if (currentRole !== role) {
        await api.logout();
        setError(`This account is ${currentRole || 'unknown'} role. Use ${role} credentials.`);
        return;
      }
      trackEvent('login_success', {
        role: currentRole,
        entryRole: role,
      });
      navigate(successPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent>
              <p className="text-text-secondary dark:text-gray-400">Checking session...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-text-secondary dark:text-gray-400">{subtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              {mode === 'register' && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              )}
              {mode === 'register' && role === 'admin' && (
                <Input
                  label="Admin Signup Code"
                  type="password"
                  value={form.adminCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminCode: e.target.value }))}
                  required
                />
              )}
              <Button type="submit" loading={submitting} className="w-full">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            {error && <p className="text-feedback-error mt-3 text-sm">{error}</p>}
            <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
              {mode === 'login' ? (
                <>No account yet? <button type="button" className="text-brand hover:underline bg-transparent border-0 p-0 font-medium" onClick={() => { setMode('register'); setError(''); }}>Create account</button></>
              ) : (
                <>Already have an account? <button type="button" className="text-brand hover:underline bg-transparent border-0 p-0 font-medium" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
              )}
            </p>
            <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
              {role === 'admin' ? (
                <>Need employee access? <Link className="text-brand hover:underline" to="/login/user">Go to User Login</Link></>
              ) : role === 'client' ? (
                <>Need team access? <Link className="text-brand hover:underline" to="/login/user">User Login</Link> or <Link className="text-brand hover:underline" to="/login/admin">Admin Login</Link></>
              ) : (
                <>Need admin access? <Link className="text-brand hover:underline" to="/login/admin">Go to Admin Login</Link></>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
