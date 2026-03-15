const { PASSWORD_POLICY, PASSWORD_POLICY_MESSAGE, isPasswordStrong } = require('../utils/passwordPolicy');

function registerAuthRoutes(app, deps) {
  const {
    User,
    AUTH_USERS,
    ADMIN_SIGNUP_CODE,
    hashPassword,
    verifyPassword,
    sanitizeUser,
    requireAuth,
    persistAuthUsers,
    logActivity,
    isDbReady,
    getSessionUser,
    createPasswordResetToken,
    hashPasswordResetToken,
    sendPasswordResetEmail,
    buildPasswordResetUrl,
    isProduction,
    getClientIp,
    getAdminAccountCount,
    demoSeedEnabled,
    firstAdminSetupToken,
  } = deps;

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());
  const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;
  const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;
  const PASSWORD_RESET_IP_LIMIT = 10;
  const PASSWORD_RESET_EMAIL_LIMIT = 3;
  const PASSWORD_RESET_GENERIC_MESSAGE = 'If an account with that email exists, password reset instructions have been sent.';
  const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
  const LOGIN_ATTEMPT_IP_LIMIT = 20;
  const LOGIN_ATTEMPT_EMAIL_LIMIT = 8;
  const LOGIN_ATTEMPT_GENERIC_MESSAGE = 'Too many sign-in attempts. Wait a few minutes and try again.';
  const passwordResetIpAttempts = new Map();
  const passwordResetEmailAttempts = new Map();
  const loginAttemptIpBuckets = new Map();
  const loginAttemptEmailBuckets = new Map();
  const getIdentityValue = (body = {}) => {
    const email = String(body.email || '').trim();
    if (email) return { email, username: '' };
    const username = String(body.username || '').trim();
    return { email: '', username };
  };
  const getDisplayNameForEmail = (email) => String(email || '').trim();
  const getResetRateBucket = (req) => {
    if (!req.session.passwordResetRequests) {
      req.session.passwordResetRequests = [];
    }
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    req.session.passwordResetRequests = req.session.passwordResetRequests.filter((time) => time > oneHourAgo);
    return req.session.passwordResetRequests;
  };
  const pruneRateMap = (store, now) => {
    const fallbackWindow = PASSWORD_RESET_WINDOW_MS;
    const windowStart = now - fallbackWindow;
    for (const [key, timestamps] of store.entries()) {
      const nextTimestamps = timestamps.filter((time) => time > windowStart);
      if (nextTimestamps.length > 0) {
        store.set(key, nextTimestamps);
      } else {
        store.delete(key);
      }
    }
  };
  const isRateLimited = (store, key, limit, now) => {
    if (!key) return false;
    pruneRateMap(store, now);
    return (store.get(key) || []).length >= limit;
  };
  const pruneRateMapWithWindow = (store, now, windowMs) => {
    const windowStart = now - windowMs;
    for (const [key, timestamps] of store.entries()) {
      const nextTimestamps = timestamps.filter((time) => time > windowStart);
      if (nextTimestamps.length > 0) {
        store.set(key, nextTimestamps);
      } else {
        store.delete(key);
      }
    }
  };
  const isRateLimitedWithWindow = (store, key, limit, now, windowMs) => {
    if (!key) return false;
    pruneRateMapWithWindow(store, now, windowMs);
    return (store.get(key) || []).length >= limit;
  };
  const recordRateLimitAttempt = (store, key, now) => {
    if (!key) return;
    const timestamps = store.get(key) || [];
    timestamps.push(now);
    store.set(key, timestamps);
  };
  const clearRateLimitAttempts = (store, key) => {
    if (!key) return;
    store.delete(key);
  };
  const buildForgotPasswordResponse = (debugPayload = null) => ({
    ok: true,
    message: PASSWORD_RESET_GENERIC_MESSAGE,
    ...(debugPayload && !isProduction ? debugPayload : {}),
  });
  const clearResetState = (user) => {
    user.resetPasswordTokenHash = '';
    user.resetPasswordExpiresAt = null;
  };
  const isResetTokenValid = (user, token) => {
    if (!user || !token) return false;
    if (!user.resetPasswordTokenHash || !user.resetPasswordExpiresAt) return false;
    if (new Date(user.resetPasswordExpiresAt).getTime() <= Date.now()) return false;
    return user.resetPasswordTokenHash === hashPasswordResetToken(token);
  };
  const isUserActive = (user) => user && user.isActive !== false;
  const requiresAdminSetup = async () => {
    if (!isProduction) return false;
    const adminCount = typeof getAdminAccountCount === 'function'
      ? await getAdminAccountCount()
      : 0;
    return adminCount === 0;
  };

  app.get('/api/auth/setup-status', async (_req, res) => {
    try {
      const adminCount = typeof getAdminAccountCount === 'function'
        ? await getAdminAccountCount()
        : 0;
      return res.json({
        ok: true,
        isProduction,
        demoSeedEnabled: Boolean(demoSeedEnabled),
        adminCount,
        requiresAdminSetup: isProduction && adminCount === 0,
        setupTokenConfigured: isProduction && adminCount === 0
          ? Boolean(String(firstAdminSetupToken || '').trim())
          : false,
      });
    } catch (err) {
      console.error('Load setup status failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/bootstrap-admin', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const setupToken = String(req.body.setupToken || '').trim();

    try {
      if (!(await requiresAdminSetup())) {
        return res.status(409).json({ error: 'First-admin setup is not available.' });
      }
      if (!String(firstAdminSetupToken || '').trim()) {
        return res.status(503).json({ error: 'First-admin setup token is not configured.' });
      }
      if (setupToken !== String(firstAdminSetupToken || '').trim()) {
        return res.status(403).json({ error: 'Invalid setup token' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email is required' });
      }
      if (!isPasswordStrong(password)) {
        return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
      }

      if (isDbReady()) {
        const exists = await User.findOne({ emailLower: normalizeEmail(email) }).lean();
        if (exists) return res.status(409).json({ error: 'Email already exists' });
        const created = await User.create({
          username: getDisplayNameForEmail(email),
          email,
          role: 'admin',
          isActive: true,
          passwordHash: await hashPassword(password),
        });
        req.session.authUser = sanitizeUser(created);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.bootstrap_admin',
          actorId: String(created._id),
          actorRole: 'admin',
          targetType: 'user',
          targetId: String(created._id),
          details: `First admin account created for ${created.email}`,
        });
        return res.status(201).json({ user: req.session.authUser });
      }

      const exists = AUTH_USERS.some((u) => normalizeEmail(u.email) === normalizeEmail(email));
      if (exists) return res.status(409).json({ error: 'Email already exists' });
      const created = {
        id: `admin-${Date.now()}`,
        username: getDisplayNameForEmail(email),
        email,
        role: 'admin',
        isActive: true,
        passwordHash: await hashPassword(password),
        projectIds: [],
      };
      AUTH_USERS.push(created);
      persistAuthUsers();
      req.session.authUser = sanitizeUser(created);
      await logActivity(req, {
        allowAnonymous: true,
        action: 'auth.bootstrap_admin',
        actorId: created.id,
        actorRole: 'admin',
        targetType: 'user',
        targetId: created.id,
        details: `First admin account created for ${created.email}`,
      });
      return res.status(201).json({ user: req.session.authUser });
    } catch (err) {
      console.error('Bootstrap admin failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, username } = getIdentityValue(req.body);
    const password = String(req.body.password || '');
    const identifier = email || username;
    const normalizedIdentifier = normalizeEmail(identifier);
    const clientIp = typeof getClientIp === 'function' ? String(getClientIp(req) || '') : String(req.ip || '');
    const now = Date.now();
    if (!identifier || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (
      isRateLimitedWithWindow(loginAttemptIpBuckets, clientIp, LOGIN_ATTEMPT_IP_LIMIT, now, LOGIN_ATTEMPT_WINDOW_MS) ||
      isRateLimitedWithWindow(loginAttemptEmailBuckets, normalizedIdentifier, LOGIN_ATTEMPT_EMAIL_LIMIT, now, LOGIN_ATTEMPT_WINDOW_MS)
    ) {
      await logActivity(req, {
        allowAnonymous: true,
        action: 'auth.login_failed',
        targetType: 'email',
        targetId: normalizedIdentifier,
        details: `Rate-limited login attempt for ${normalizedIdentifier || 'unknown user'}`,
        metadata: { reason: 'rate_limited', ip: clientIp },
      });
      return res.status(429).json({ error: LOGIN_ATTEMPT_GENERIC_MESSAGE });
    }

    if (isDbReady()) {
      const user = email
        ? await User.findOne({ emailLower: normalizeEmail(email) })
        : await User.findOne({ usernameLower: username.toLowerCase() });
      if (!user) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'email',
          targetId: normalizedIdentifier,
          details: `Failed login attempt for ${normalizedIdentifier}`,
          metadata: { reason: 'not_found' },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!isUserActive(user)) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'user',
          targetId: String(user._id || user.id || ''),
          details: `${user.email || user.username} attempted to sign in while inactive`,
          metadata: { reason: 'inactive' },
        });
        return res.status(403).json({ error: 'This account is inactive. Contact the owner or admin.' });
      }
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'user',
          targetId: String(user._id || ''),
          details: `Failed login attempt for ${user.email || user.username}`,
          metadata: { reason: 'invalid_password' },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      clearRateLimitAttempts(loginAttemptIpBuckets, clientIp);
      clearRateLimitAttempts(loginAttemptEmailBuckets, normalizedIdentifier);
      req.session.authUser = sanitizeUser(user);
    } else {
      const user = AUTH_USERS.find(
        (u) => {
          if (email) {
            return normalizeEmail(u.email) === normalizeEmail(email);
          }
          return String(u.username || '').toLowerCase() === username.toLowerCase();
        }
      );
      if (!user) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'email',
          targetId: normalizedIdentifier,
          details: `Failed login attempt for ${normalizedIdentifier}`,
          metadata: { reason: 'not_found' },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!isUserActive(user)) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'user',
          targetId: String(user.id || ''),
          details: `${user.email || user.username} attempted to sign in while inactive`,
          metadata: { reason: 'inactive' },
        });
        return res.status(403).json({ error: 'This account is inactive. Contact the owner or admin.' });
      }

      const hasHash = Boolean(user.passwordHash);
      const ok = hasHash ? await verifyPassword(password, user.passwordHash) : user.password === password;
      if (!ok) {
        recordRateLimitAttempt(loginAttemptIpBuckets, clientIp, now);
        recordRateLimitAttempt(loginAttemptEmailBuckets, normalizedIdentifier, now);
        await logActivity(req, {
          allowAnonymous: true,
          action: 'auth.login_failed',
          targetType: 'user',
          targetId: String(user.id || ''),
          details: `Failed login attempt for ${user.email || user.username}`,
          metadata: { reason: 'invalid_password' },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      clearRateLimitAttempts(loginAttemptIpBuckets, clientIp);
      clearRateLimitAttempts(loginAttemptEmailBuckets, normalizedIdentifier);

      if (!hasHash) {
        try {
          user.passwordHash = await hashPassword(password);
          delete user.password;
          persistAuthUsers();
        } catch (_error) {
          // ignore migration failure
        }
      }

      req.session.authUser = sanitizeUser(user);
    }
    logActivity(req, {
      action: 'auth.login',
      targetType: 'session',
      targetId: req.sessionID || '',
      details: `${req.session.authUser.username} logged in`,
    });
    return res.json({ user: req.session.authUser });
  });

  app.post('/api/auth/register', async (req, res) => {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const roleInput = String(req.body.role || 'user').trim().toLowerCase();
    const adminCode = String(req.body.adminCode || '');
    const role = ['admin', 'user', 'client'].includes(roleInput) ? roleInput : 'user';

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
    }
    if (role === 'admin' && adminCode !== ADMIN_SIGNUP_CODE) {
      return res.status(403).json({ error: 'Invalid admin signup code' });
    }

    if (isDbReady()) {
      const exists = await User.findOne({ emailLower: normalizeEmail(email) }).lean();
      if (exists) return res.status(409).json({ error: 'Email already exists' });
      const passwordHash = await hashPassword(password);
      const newUser = await User.create({
        username: getDisplayNameForEmail(email),
        email,
        role,
        passwordHash,
      });
      req.session.authUser = sanitizeUser(newUser);
    } else {
      const exists = AUTH_USERS.some(
        (u) => normalizeEmail(u.email) === normalizeEmail(email)
      );
      if (exists) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      const newUser = {
        id: `${role}-${Date.now()}`,
        username: getDisplayNameForEmail(email),
        email,
        passwordHash: await hashPassword(password),
        role,
        isActive: true,
        projectIds: [],
      };
      AUTH_USERS.push(newUser);
      persistAuthUsers();
      req.session.authUser = sanitizeUser(newUser);
    }
    logActivity(req, {
      action: 'auth.register',
      targetType: 'user',
      targetId: req.session.authUser.id,
      details: `${req.session.authUser.username} registered as ${req.session.authUser.role}`,
    });
    return res.status(201).json({ user: req.session.authUser });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const audience = String(req.body.audience || 'client').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const requestBucket = getResetRateBucket(req);
    const now = Date.now();
    const clientIp = typeof getClientIp === 'function'
      ? String(getClientIp(req) || '').trim()
      : '';
    if (
      requestBucket.length >= 5 ||
      isRateLimited(passwordResetIpAttempts, clientIp, PASSWORD_RESET_IP_LIMIT, now) ||
      isRateLimited(passwordResetEmailAttempts, email, PASSWORD_RESET_EMAIL_LIMIT, now)
    ) {
      return res.json(buildForgotPasswordResponse());
    }
    requestBucket.push(now);
    recordRateLimitAttempt(passwordResetIpAttempts, clientIp, now);
    recordRateLimitAttempt(passwordResetEmailAttempts, email, now);

    try {
      let user = null;
      if (isDbReady()) {
        user = await User.findOne({ emailLower: normalizeEmail(email) });
      } else {
        user = AUTH_USERS.find((item) => normalizeEmail(item.email) === normalizeEmail(email)) || null;
      }

      if (!user) {
        return res.json(buildForgotPasswordResponse());
      }

      const resetToken = createPasswordResetToken();
      const resetUrl = buildPasswordResetUrl(resetToken, audience);
      user.resetPasswordTokenHash = hashPasswordResetToken(resetToken);
      user.resetPasswordExpiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

      if (isDbReady()) {
        await user.save();
      } else {
        persistAuthUsers();
      }

      Promise.resolve()
        .then(() => sendPasswordResetEmail({
          email: user.email || email,
          resetUrl,
          role: user.role,
          audience,
        }))
        .catch((emailErr) => {
          console.error('Password reset email delivery failed', emailErr);
        });

      await logActivity(req, {
        action: 'auth.forgot_password',
        targetType: 'user',
        targetId: String(user._id || user.id || ''),
        details: `${user.email || user.username} requested a password reset`,
      });

      return res.json(buildForgotPasswordResponse(
        isProduction ? null : { resetUrl, resetToken }
      ));
    } catch (err) {
      console.error('Forgot password failed', err);
      return res.json(buildForgotPasswordResponse());
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const token = String(req.body.token || '').trim();
    const newPassword = String(req.body.newPassword || '');
    if (!token) return res.status(400).json({ error: 'Reset token is required' });
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
    }

    try {
      if (isDbReady()) {
        const tokenHash = hashPasswordResetToken(token);
        const user = await User.findOne({
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpiresAt: { $gt: new Date() },
        });
        if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired' });
        user.passwordHash = await hashPassword(newPassword);
        clearResetState(user);
        await user.save();
        await logActivity(req, {
          action: 'auth.reset_password',
          targetType: 'user',
          targetId: String(user._id),
          details: `${user.email || user.username} completed password reset`,
        });
        return res.json({ ok: true });
      }

      const user = AUTH_USERS.find((item) => isResetTokenValid(item, token));
      if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired' });
      user.passwordHash = await hashPassword(newPassword);
      delete user.password;
      clearResetState(user);
      persistAuthUsers();
      await logActivity(req, {
        action: 'auth.reset_password',
        targetType: 'user',
        targetId: String(user.id || ''),
        details: `${user.email || user.username} completed password reset`,
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error('Reset password failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' });
    if (!isPasswordStrong(newPassword)) return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });

    try {
      if (isDbReady()) {
        const user = await User.findById(req.authUser.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const ok = await verifyPassword(currentPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid current password' });
        user.passwordHash = await hashPassword(newPassword);
        await user.save();
        await logActivity(req, {
          action: 'auth.change_password',
          targetType: 'user',
          targetId: String(user._id),
          details: `${user.username} changed password`,
        });
        return res.json({ ok: true });
      }

      const record = AUTH_USERS.find((u) => String(u.id) === String(req.authUser.id));
      if (!record) return res.status(404).json({ error: 'User not found' });
      const ok = record.passwordHash
        ? await verifyPassword(currentPassword, record.passwordHash)
        : String(record.password || '') === currentPassword;
      if (!ok) return res.status(401).json({ error: 'Invalid current password' });

      record.passwordHash = await hashPassword(newPassword);
      delete record.password;
      persistAuthUsers();
      await logActivity(req, {
        action: 'auth.change_password',
        targetType: 'user',
        targetId: record.id,
        details: `${record.username} changed password`,
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error('Change password failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    logActivity(req, {
      action: 'auth.logout',
      targetType: 'session',
      targetId: req.sessionID || '',
      details: 'User logged out',
    });
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });

    if (isDbReady()) {
      User.findById(sessionUser.id).lean()
        .then((dbUser) => {
          if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });
          if (!isUserActive(dbUser)) {
            req.session.destroy(() => res.status(401).json({ error: 'Unauthorized' }));
            return null;
          }
          const safe = sanitizeUser(dbUser);
          req.session.authUser = safe;
          return res.json({ user: safe });
        })
        .catch(() => res.json({ user: sessionUser }));
      return;
    }

    if (!isUserActive(sessionUser)) {
      req.session.destroy(() => res.status(401).json({ error: 'Unauthorized' }));
      return;
    }
    return res.json({ user: sessionUser });
  });
}

module.exports = {
  registerAuthRoutes,
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
};
