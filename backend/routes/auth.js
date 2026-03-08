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
  } = deps;

  app.post('/api/auth/login', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    if (isDbReady()) {
      const user = await User.findOne({ usernameLower: username.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      req.session.authUser = sanitizeUser(user);
    } else {
      const user = AUTH_USERS.find(
        (u) => String(u.username || '').toLowerCase() === username.toLowerCase()
      );
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const hasHash = Boolean(user.passwordHash);
      const ok = hasHash ? await verifyPassword(password, user.passwordHash) : user.password === password;
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

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
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const roleInput = String(req.body.role || 'user').trim().toLowerCase();
    const adminCode = String(req.body.adminCode || '');
    const role = ['admin', 'user', 'client'].includes(roleInput) ? roleInput : 'user';

    if (!username || username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be 3 to 32 characters' });
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, dot, underscore, and dash' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    if (role === 'admin' && adminCode !== ADMIN_SIGNUP_CODE) {
      return res.status(403).json({ error: 'Invalid admin signup code' });
    }

    if (isDbReady()) {
      const exists = await User.findOne({ usernameLower: username.toLowerCase() }).lean();
      if (exists) return res.status(409).json({ error: 'Username already exists' });
      const passwordHash = await hashPassword(password);
      const newUser = await User.create({ username, role, passwordHash });
      req.session.authUser = sanitizeUser(newUser);
    } else {
      const exists = AUTH_USERS.some(
        (u) => String(u.username || '').toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      const newUser = {
        id: `${role}-${Date.now()}`,
        username,
        passwordHash: await hashPassword(password),
        role,
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

  app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' });
    if (newPassword.length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters' });

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
          const safe = sanitizeUser(dbUser);
          req.session.authUser = safe;
          return res.json({ user: safe });
        })
        .catch(() => res.json({ user: sessionUser }));
      return;
    }

    return res.json({ user: sessionUser });
  });
}

module.exports = {
  registerAuthRoutes,
};
