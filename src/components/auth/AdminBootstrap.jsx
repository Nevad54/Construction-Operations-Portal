import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';

export default function AdminBootstrap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    setupToken: '',
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const status = await api.getSetupStatus();
        if (!active) return;
        setSetupStatus(status || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load setup status');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await api.bootstrapAdmin({
        email: form.email,
        password: form.password,
        setupToken: form.setupToken,
      });
      navigate('/admin/dashboard/projects', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create the first admin account');
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
              <p className="text-text-secondary dark:text-gray-400">Checking setup status...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const setupUnavailable = !setupStatus?.requiresAdminSetup;

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>First Admin Setup</CardTitle>
            <p className="text-sm text-text-secondary dark:text-gray-400">
              Use the one-time setup token from deployment configuration to create the first production admin account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupUnavailable ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  First-admin setup is not currently available. Either an admin already exists or this environment is not in production bootstrap mode.
                </p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Return to <Link className="text-brand hover:underline" to="/staff/signin">staff sign-in</Link>.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-stroke bg-surface-page/70 p-4 dark:border-gray-700 dark:bg-gray-950/40">
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    Setup token configured: {setupStatus.setupTokenConfigured ? 'Yes' : 'No'}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">
                    Passwords must be at least 8 characters and include at least one letter and one number.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Admin Email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    autoComplete="email"
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    autoComplete="new-password"
                    helperText="Use at least 8 characters with at least one letter and one number."
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Setup Token"
                    type="password"
                    value={form.setupToken}
                    onChange={(event) => setForm((prev) => ({ ...prev, setupToken: event.target.value }))}
                    autoComplete="one-time-code"
                    helperText="This should match the deploy-time FIRST_ADMIN_SETUP_TOKEN secret."
                    required
                  />
                  <Button type="submit" loading={submitting} className="w-full">
                    Create First Admin
                  </Button>
                </form>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  After setup, continue from <Link className="text-brand hover:underline" to="/staff/signin">staff sign-in</Link>.
                </p>
              </>
            )}
            {error ? <p className="text-sm text-feedback-error">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
