import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { trackEvent } from '../../utils/analytics';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';

const roleHome = {
  admin: '/admin/dashboard/projects',
  user: '/user/dashboard',
  client: '/client/workspace',
};

const roleHints = {
  admin: { email: 'admin@construction.local', password: '1111' },
  user: { email: 'employee@construction.local', password: '1111' },
  client: { email: 'client@construction.local', password: '1111' },
};

const variantConfigs = {
  role: (role) => ({
    allowedRoles: [role],
    fixedMode: null,
    hintRole: role,
    registrationRole: role,
    titleByMode: {
      login: {
        admin: 'Admin Login',
        user: 'User Login',
        client: 'Client Login',
      }[role] || 'User Login',
      register: {
        admin: 'Create Admin Account',
        user: 'Create User Account',
        client: 'Create Client Account',
      }[role] || 'Create User Account',
    },
    subtitleByMode: {
      login: {
        admin: 'Use the admin login that was issued for dashboard access and management tasks.',
        user: 'Use the employee login that was issued for files, updates, and account access.',
        client: 'Use the client login that was issued to review files, requests, and current project updates.',
      }[role] || 'Use the issued account email and password.',
      register: {
        admin: 'Create a new admin account. Admin signup code is required.',
        user: 'Create a new employee user account.',
        client: 'Create a new client account for shared project visibility.',
      }[role] || 'Create a new account.',
    },
  }),
  public: () => ({
    allowedRoles: ['admin', 'user', 'client'],
    fixedMode: 'login',
    hintRole: 'client',
    registrationRole: 'client',
    titleByMode: {
      login: 'Sign in',
      register: 'Create account',
    },
    subtitleByMode: {
      login: 'Use your email to open your workspace. Staff members should use staff sign-in.',
      register: 'Create a client account to review files, requests, and current project updates.',
    },
  }),
  signup: () => ({
    allowedRoles: ['client'],
    fixedMode: 'register',
    hintRole: null,
    registrationRole: 'client',
    titleByMode: {
      login: 'Sign in',
      register: 'Create account',
    },
    subtitleByMode: {
      login: 'Use your email to open your workspace.',
      register: 'Create a client account for shared files, follow-ups, and project visibility.',
    },
  }),
  staff: () => ({
    allowedRoles: ['admin', 'user'],
    fixedMode: 'login',
    hintRole: 'user',
    registrationRole: null,
    titleByMode: {
      login: 'Staff sign in',
      register: 'Staff sign in',
    },
    subtitleByMode: {
      login: 'For employees and admins managing project files, reporting, and operations.',
      register: 'For employees and admins managing project files, reporting, and operations.',
    },
  }),
};

const roleLabels = {
  admin: 'admin',
  user: 'employee',
  client: 'client',
};

const explainerItemsByVariant = {
  public: [
    { title: 'Client account', description: 'Review shared files, follow-ups, approvals, and project visibility.' },
    { title: 'Staff account', description: 'Use staff sign-in for internal files, reporting, and operations work.' },
  ],
  staff: [
    { title: 'Employee access', description: 'Use this for file handling, updates, and day-to-day delivery coordination.' },
    { title: 'Admin access', description: 'Use this for projects, people, requests, reporting, and account management.' },
  ],
};

function buildForgotPasswordHref(variant, email = '') {
  const params = new URLSearchParams();
  if (variant === 'staff') {
    params.set('audience', 'staff');
  }
  if (email.trim()) {
    params.set('email', email.trim());
  }
  return `/forgot-password?${params.toString()}`;
}

function getRoleMismatchMessage(currentRole, variant, expectedRole) {
  if (variant === 'staff' && currentRole === 'client') {
    return 'This account uses the client workspace. Sign in from the client portal instead.';
  }
  if (variant === 'role') {
    return `This account is ${currentRole || 'unknown'} role. Use ${expectedRole} credentials.`;
  }
  if (variant === 'signup') {
    return 'Client account creation is separate from staff access. Use staff sign-in if you are on the internal team.';
  }
  return `This account is set up for the ${roleLabels[currentRole] || 'assigned'} workspace.`;
}

export default function RoleLogin({ role = 'user', variant = 'role' }) {
  const isLocalDemoEnvironment =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const navigate = useNavigate();
  const location = useLocation();
  const config = useMemo(() => {
    const configFactory = variantConfigs[variant] || variantConfigs.role;
    return configFactory(role);
  }, [role, variant]);
  const requestedMode = config.fixedMode || (location.search.includes('mode=register') ? 'register' : 'login');
  const defaultHint = config.hintRole ? roleHints[config.hintRole] : null;
  const explainerItems = explainerItemsByVariant[variant] || [];
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupNotice, setSetupNotice] = useState('');
  const [mode, setMode] = useState(requestedMode);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [form, setForm] = useState({
    email: isLocalDemoEnvironment && requestedMode === 'login' ? (defaultHint?.email || '') : '',
    password: isLocalDemoEnvironment && requestedMode === 'login' ? (defaultHint?.password || '') : '',
    confirmPassword: '',
    adminCode: '',
  });

  const fromPath = location.state?.from;
  const title = config.titleByMode[mode] || config.titleByMode.login;
  const subtitle = config.subtitleByMode[mode] || config.subtitleByMode.login;

  const resolveSuccessPath = useMemo(() => (currentRole) => {
    if (typeof fromPath === 'string' && fromPath.trim()) return fromPath;
    return roleHome[currentRole] || roleHome[config.registrationRole] || roleHome[role] || '/';
  }, [config.registrationRole, fromPath, role]);

  useEffect(() => {
    setMode(requestedMode);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAdminCode(false);
  }, [requestedMode, role]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const setupStatus = await api.getSetupStatus();
        if (!active) return;
        setSetupNotice(
          setupStatus?.requiresAdminSetup && variant !== 'signup'
            ? 'Production setup is incomplete. Create the first admin account before opening staff access.'
            : ''
        );
        const data = await api.me();
        if (!active) return;
        const currentRole = data?.user?.role;
        if (config.allowedRoles.includes(currentRole)) {
          navigate(resolveSuccessPath(currentRole), { replace: true });
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
  }, [config.allowedRoles, navigate, resolveSuccessPath]);

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
          email: form.email,
          password: form.password,
          role: config.registrationRole || role,
          adminCode: (config.registrationRole || role) === 'admin' ? form.adminCode : '',
        });
        navigate(resolveSuccessPath(config.registrationRole || role), { replace: true });
        return;
      }

      await api.login(form.email, form.password);
      const data = await api.me();
      const currentRole = data?.user?.role;
      if (!config.allowedRoles.includes(currentRole)) {
        await api.logout();
        setError(getRoleMismatchMessage(currentRole, variant, role));
        return;
      }
      trackEvent('login_success', {
        role: currentRole,
        entryRole: variant === 'role' ? role : variant,
      });
      navigate(resolveSuccessPath(currentRole), { replace: true });
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
            {mode === 'login' && isLocalDemoEnvironment && defaultHint ? (
              <p className="text-xs text-text-muted dark:text-gray-500">
                Local demo convenience is enabled on this machine. The prefilled credentials are for localhost testing only.
              </p>
            ) : null}
            {setupNotice ? <p className="text-xs text-feedback-warning">{setupNotice}</p> : null}
            {setupNotice ? (
              <p className="text-xs text-text-secondary dark:text-gray-400">
                Use <Link className="text-brand hover:underline" to="/setup/admin">first admin setup</Link> if this environment has not been initialized yet.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {mode === 'login' && explainerItems.length ? (
              <div className="mb-4 grid gap-3 sm:grid-cols-2" aria-label="Account type explainer">
                {explainerItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-stroke dark:border-gray-700 bg-surface-muted/60 dark:bg-gray-800/60 p-3">
                    <p className="text-sm font-semibold text-text-primary dark:text-gray-100">{item.title}</p>
                    <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                autoComplete={mode === 'login' ? 'username' : 'email'}
                helperText={mode === 'login' ? 'Use the email tied to the workspace you were issued.' : 'Use the email where you want workspace updates sent.'}
                required
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                helperText={mode === 'login' ? 'Use the password already assigned to this account.' : 'Use at least 8 characters with at least one letter and one number.'}
                trailingElement={(
                  <button
                    type="button"
                    className="text-xs font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
                required
              />
              {mode === 'register' && (
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                  helperText="Repeat the same password to confirm the account setup."
                  trailingElement={(
                    <button
                      type="button"
                      className="text-xs font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  )}
                  required
                />
              )}
              {mode === 'register' && (config.registrationRole || role) === 'admin' && (
                <Input
                  label="Admin Signup Code"
                  type={showAdminCode ? 'text' : 'password'}
                  value={form.adminCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminCode: e.target.value }))}
                  autoComplete="one-time-code"
                  helperText="Only use this if an admin signup code was explicitly issued to you."
                  trailingElement={(
                    <button
                      type="button"
                      className="text-xs font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setShowAdminCode((value) => !value)}
                      aria-label={showAdminCode ? 'Hide admin signup code' : 'Show admin signup code'}
                    >
                      {showAdminCode ? 'Hide' : 'Show'}
                    </button>
                  )}
                  required
                />
              )}
              <Button type="submit" loading={submitting} className="w-full">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            {error && <p className="text-feedback-error mt-3 text-sm">{error}</p>}
            {mode === 'login' ? (
              <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                Forgot password? <Link className="text-brand hover:underline" to={buildForgotPasswordHref(variant, form.email)}>Request password help</Link>.
              </p>
            ) : null}
            {variant === 'role' ? (
              <>
                <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                  {mode === 'login' ? (
                    <>No account yet? <button type="button" className="text-brand hover:underline bg-transparent border-0 p-0 font-medium" onClick={() => { setMode('register'); setError(''); }}>Create account</button></>
                  ) : (
                    <>Already have an account? <button type="button" className="text-brand hover:underline bg-transparent border-0 p-0 font-medium" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
                  )}
                </p>
                <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                  {role === 'admin' ? (
                    <>Need employee access? <Link className="text-brand hover:underline" to="/staff/signin">Go to staff sign-in</Link></>
                  ) : role === 'client' ? (
                    <>Need team access? <Link className="text-brand hover:underline" to="/staff/signin">Staff sign-in</Link></>
                  ) : (
                    <>Need client access? <Link className="text-brand hover:underline" to="/signin">Client sign-in</Link></>
                  )}
                </p>
              </>
            ) : null}
            {variant === 'public' ? (
              <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                No account yet? <Link className="text-brand hover:underline" to="/signup">Create account</Link>. On the internal team? <Link className="text-brand hover:underline" to="/staff/signin">Staff sign-in</Link>.
              </p>
            ) : null}
            {variant === 'signup' ? (
              <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                Already have access? <Link className="text-brand hover:underline" to="/signin">Sign in</Link>. On the internal team? <Link className="text-brand hover:underline" to="/staff/signin">Use staff sign-in</Link>.
              </p>
            ) : null}
            {variant === 'staff' ? (
              <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">
                Need the client workspace instead? <Link className="text-brand hover:underline" to="/signin">Client sign-in</Link>.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
