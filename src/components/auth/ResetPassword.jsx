import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = String(searchParams.get('token') || '').trim();
  const audience = searchParams.get('audience') === 'staff' ? 'staff' : 'client';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = window.setTimeout(() => {
      navigate(audience === 'staff' ? '/staff/signin' : '/signin', { replace: true });
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [audience, navigate, success]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('Reset link is invalid or incomplete.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.resetPassword({ token, newPassword });
      setSuccess('Password updated. You can sign in with the new password now.');
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <p className="text-sm text-text-secondary dark:text-gray-400">
              Choose a new password for your {audience === 'staff' ? 'staff' : 'client'} account.
            </p>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4">
                <p className="text-sm text-feedback-error">Reset link is invalid or incomplete.</p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Request a new link from <Link className="text-brand hover:underline" to={audience === 'staff' ? '/forgot-password?audience=staff' : '/forgot-password'}>forgot password</Link>.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    helperText="Use at least 8 characters with at least one letter and one number."
                    trailingElement={(
                      <button
                        type="button"
                        className="text-xs font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowNewPassword((value) => !value)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    helperText="Repeat the new password to confirm the reset."
                    trailingElement={(
                      <button
                        type="button"
                        className="text-xs font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                    required
                  />
                  <Button type="submit" loading={submitting} className="w-full">
                    Reset password
                  </Button>
                </form>
                {error ? <p className="mt-3 text-sm text-feedback-error">{error}</p> : null}
                {success ? <p className="mt-3 text-sm text-feedback-success">{success}</p> : null}
                <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                  Back to <Link className="text-brand hover:underline" to={audience === 'staff' ? '/staff/signin' : '/signin'}>sign-in</Link>.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
