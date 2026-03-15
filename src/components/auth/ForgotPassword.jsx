import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';

export default function ForgotPassword() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const audience = searchParams.get('audience') === 'staff' ? 'staff' : 'client';
  const defaultEmail = String(searchParams.get('email') || '').trim();
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const showDevelopmentNote = Boolean(result?.resetUrl);

  const title = audience === 'staff' ? 'Staff password reset' : 'Reset your password';
  const subtitle = audience === 'staff'
    ? 'Use the email tied to your employee or admin account.'
    : 'Use the email tied to your client workspace account.';

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const response = await api.forgotPassword({ email, audience });
      setResult(response);
    } catch (err) {
      setError(err.message || 'Could not start password reset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-text-secondary dark:text-gray-400">{subtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                helperText="If the account exists, the reset link will be sent to this address."
                required
              />
              <Button type="submit" loading={submitting} className="w-full">
                Send reset link
              </Button>
            </form>
            {error ? <p className="mt-3 text-sm text-feedback-error">{error}</p> : null}
            {result ? (
              <div className="mt-4 space-y-3 rounded-xl border border-stroke dark:border-gray-700 bg-surface-muted/60 dark:bg-gray-800/60 p-4">
                <p className="text-sm text-text-primary dark:text-gray-100">{result.message}</p>
                {showDevelopmentNote ? (
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    Development mode: if email delivery is not configured, check the backend console for the reset link.
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
              Back to {audience === 'staff'
                ? <Link className="text-brand hover:underline" to="/staff/signin">staff sign-in</Link>
                : <Link className="text-brand hover:underline" to="/signin">sign in</Link>}
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
