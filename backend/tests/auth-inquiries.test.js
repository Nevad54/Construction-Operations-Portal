const test = require('node:test');
const assert = require('node:assert/strict');
const { registerAuthRoutes } = require('../routes/auth');
const { registerInquiryRoutes } = require('../routes/inquiries');
const { buildAdminSystemStatusAlerts } = require('../utils/adminSystemStatus');

function createMockApp() {
  const routes = new Map();
  const register = (method, path, handlers) => {
    routes.set(`${method} ${path}`, handlers);
  };

  return {
    routes,
    get: (path, ...handlers) => register('GET', path, handlers),
    post: (path, ...handlers) => register('POST', path, handlers),
    put: (path, ...handlers) => register('PUT', path, handlers),
    delete: (path, ...handlers) => register('DELETE', path, handlers),
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function runHandlers(handlers, req, res) {
  let index = 0;

  const next = async (error) => {
    if (error) throw error;
    const handler = handlers[index];
    index += 1;
    if (!handler) return;

    if (handler.length >= 3) {
      return handler(req, res, next);
    }
    return handler(req, res);
  };

  await next();
  return res;
}

test('auth login rejects missing credentials', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'admin-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
  });

  const handlers = app.routes.get('POST /api/auth/login');
  const req = { body: {}, session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Email and password are required' });
});

test('auth login stores session user when fallback credentials match', async () => {
  const app = createMockApp();
  const authUsers = [{ id: 'admin-1', username: 'admin', email: 'admin@construction.local', password: '1111', role: 'admin' }];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'admin-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
  });

  const handlers = app.routes.get('POST /api/auth/login');
  const req = { body: { email: 'admin@construction.local', password: '1111' }, session: {}, sessionID: 'session-1' };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(req.session.authUser, { id: 'admin-1', username: 'admin', role: 'admin' });
  assert.deepEqual(res.body, { user: { id: 'admin-1', username: 'admin', role: 'admin' } });
  assert.match(authUsers[0].passwordHash, /^hashed:/);
  assert.equal(authUsers[0].password, undefined);
});

test('auth login blocks inactive fallback accounts', async () => {
  const app = createMockApp();
  const authUsers = [{ id: 'user-1', username: 'employee', email: 'employee@construction.local', passwordHash: 'hashed:abc12345', role: 'user', isActive: false }];
  const activityCalls = [];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'admin-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => true,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role, isActive: user.isActive }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async (_req, payload) => { activityCalls.push(payload); },
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
  });

  const handlers = app.routes.get('POST /api/auth/login');
  const req = { body: { email: 'employee@construction.local', password: 'abc12345' }, session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.error, /inactive/i);
  assert.equal(activityCalls[0].action, 'auth.login_failed');
});

test('auth login rate limits repeated failed attempts for the same email', async () => {
  const app = createMockApp();
  const activityCalls = [];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'admin-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async (_req, payload) => { activityCalls.push(payload); },
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    getClientIp: () => '127.0.0.1',
  });

  const handlers = app.routes.get('POST /api/auth/login');

  for (let index = 0; index < 8; index += 1) {
    const req = { body: { email: 'owner@example.com', password: 'wrongpass1' }, session: {}, ip: '127.0.0.1' };
    const res = createResponse();
    await runHandlers(handlers, req, res);
    assert.equal(res.statusCode, 401);
  }

  const throttledReq = { body: { email: 'owner@example.com', password: 'wrongpass1' }, session: {}, ip: '127.0.0.1' };
  const throttledRes = createResponse();
  await runHandlers(handlers, throttledReq, throttledRes);

  assert.equal(throttledRes.statusCode, 429);
  assert.match(throttledRes.body.error, /Too many sign-in attempts/i);
  assert.equal(activityCalls.at(-1).metadata.reason, 'rate_limited');
});

test('auth register blocks admin creation without the signup code', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
  });

  const handlers = app.routes.get('POST /api/auth/register');
  const req = {
    body: { email: 'owner@example.com', password: 'secret123', role: 'admin', adminCode: 'wrong-code' },
    session: {},
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Invalid admin signup code' });
});

test('auth register rejects weak passwords', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
  });

  const handlers = app.routes.get('POST /api/auth/register');
  const req = {
    body: { email: 'owner@example.com', password: '1234', role: 'client' },
    session: {},
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /at least 8 characters/i);
});

test('setup status reports admin bootstrap requirements', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    isProduction: true,
    demoSeedEnabled: false,
    getAdminAccountCount: async () => 0,
  });

  const handlers = app.routes.get('GET /api/auth/setup-status');
  const req = { session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.requiresAdminSetup, true);
  assert.equal(res.body.adminCount, 0);
});

test('setup status hides bootstrap token configuration after an admin already exists', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    isProduction: true,
    demoSeedEnabled: false,
    getAdminAccountCount: async () => 1,
    firstAdminSetupToken: 'setup-secret',
  });

  const handlers = app.routes.get('GET /api/auth/setup-status');
  const req = { session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.requiresAdminSetup, false);
  assert.equal(res.body.setupTokenConfigured, false);
});

test('bootstrap admin creates the first admin when production setup is required', async () => {
  const app = createMockApp();
  const authUsers = [];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role, email: user.email }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    isProduction: true,
    demoSeedEnabled: false,
    getAdminAccountCount: async () => 0,
    firstAdminSetupToken: 'setup-secret',
  });

  const handlers = app.routes.get('POST /api/auth/bootstrap-admin');
  const req = {
    body: { email: 'owner@example.com', password: 'admin1234', setupToken: 'setup-secret' },
    session: {},
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(authUsers.length, 1);
  assert.equal(authUsers[0].role, 'admin');
  assert.equal(authUsers[0].isActive, true);
  assert.equal(req.session.authUser.role, 'admin');
});

test('bootstrap admin rejects an invalid setup token', async () => {
  const app = createMockApp();

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: [],
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role, email: user.email }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    isProduction: true,
    demoSeedEnabled: false,
    getAdminAccountCount: async () => 0,
    firstAdminSetupToken: 'setup-secret',
  });

  const handlers = app.routes.get('POST /api/auth/bootstrap-admin');
  const req = {
    body: { email: 'owner@example.com', password: 'admin1234', setupToken: 'wrong-token' },
    session: {},
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Invalid setup token' });
});

test('admin system status warns when bootstrap token remains configured after setup completes', () => {
  const alerts = buildAdminSystemStatusAlerts({
    usingFallback: false,
    emailConfigured: true,
    frontendUrlConfigured: true,
    isProduction: true,
    adminCount: 1,
    demoSeedEnabled: false,
    setupTokenConfigured: true,
  });

  assert.equal(alerts.some((alert) => alert.code === 'bootstrap_token_still_configured'), true);
});

test('forgot password stores a reset token and returns a generic success payload', async () => {
  const app = createMockApp();
  const authUsers = [{ id: 'client-1', username: 'client', email: 'client@example.com', role: 'client', passwordHash: 'hashed:1111' }];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    createPasswordResetToken: () => 'demo-token',
    hashPasswordResetToken: (value) => `hashed-reset:${value}`,
    sendPasswordResetEmail: async () => true,
    buildPasswordResetUrl: (token, audience) => `http://localhost:3000/reset-password?token=${token}&audience=${audience}`,
    isProduction: false,
    getClientIp: () => '127.0.0.1',
  });

  const handlers = app.routes.get('POST /api/auth/forgot-password');
  const req = { body: { email: 'client@example.com', audience: 'client' }, session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.match(res.body.message, /If an account with that email exists/i);
  assert.equal(res.body.resetToken, 'demo-token');
  assert.equal(authUsers[0].resetPasswordTokenHash, 'hashed-reset:demo-token');
  assert.ok(authUsers[0].resetPasswordExpiresAt);
});

test('forgot password rate limits repeated requests per email and still returns a generic success payload', async () => {
  const app = createMockApp();
  const authUsers = [{ id: 'client-1', username: 'client', email: 'client@example.com', role: 'client', passwordHash: 'hashed:1111' }];
  let emailSendCount = 0;

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    createPasswordResetToken: () => 'demo-token',
    hashPasswordResetToken: (value) => `hashed-reset:${value}`,
    sendPasswordResetEmail: async () => {
      emailSendCount += 1;
      return true;
    },
    buildPasswordResetUrl: (token, audience) => `http://localhost:3000/reset-password?token=${token}&audience=${audience}`,
    isProduction: false,
    getClientIp: () => '127.0.0.1',
  });

  const handlers = app.routes.get('POST /api/auth/forgot-password');

  for (let index = 0; index < 4; index += 1) {
    const req = { body: { email: 'client@example.com', audience: 'client' }, session: {} };
    const res = createResponse();
    await runHandlers(handlers, req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
  }

  assert.equal(emailSendCount, 3);
});

test('reset password updates the fallback user when the token is valid', async () => {
  const app = createMockApp();
  const authUsers = [{
    id: 'client-1',
    username: 'client',
    email: 'client@example.com',
    role: 'client',
    passwordHash: 'old-hash',
    resetPasswordTokenHash: 'hashed-reset:demo-token',
    resetPasswordExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }];

  registerAuthRoutes(app, {
    User: {},
    AUTH_USERS: authUsers,
    ADMIN_SIGNUP_CODE: 'expected-code',
    hashPassword: async (value) => `hashed:${value}`,
    verifyPassword: async () => false,
    sanitizeUser: (user) => ({ id: user.id, username: user.username, role: user.role }),
    requireAuth: (_req, _res, next) => next(),
    persistAuthUsers: () => {},
    logActivity: async () => {},
    isDbReady: () => false,
    getSessionUser: (req) => req.session.authUser || null,
    createPasswordResetToken: () => 'demo-token',
    hashPasswordResetToken: (value) => `hashed-reset:${value}`,
    sendPasswordResetEmail: async () => true,
    buildPasswordResetUrl: (token, audience) => `http://localhost:3000/reset-password?token=${token}&audience=${audience}`,
    isProduction: false,
    getClientIp: () => '127.0.0.1',
  });

  const handlers = app.routes.get('POST /api/auth/reset-password');
  const req = { body: { token: 'demo-token', newPassword: 'newsecret1' }, session: {} };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(authUsers[0].passwordHash, 'hashed:newsecret1');
  assert.equal(authUsers[0].resetPasswordTokenHash, '');
  assert.equal(authUsers[0].resetPasswordExpiresAt, null);
});

test('admin inquiry update enforces role guard before touching data', async () => {
  const app = createMockApp();
  const fallbackInquiries = [{ _id: 'inq-1', name: 'Lead', status: 'new', owner: 'Ops', nextFollowUpAt: '2026-03-10T00:00:00.000Z' }];

  registerInquiryRoutes(app, {
    Inquiry: {},
    fallbackInquiries,
    useFallback: true,
    mongoose: { connection: { readyState: 0 } },
    requireAuth: (req, res, next) => {
      req.authUser = req.session.authUser;
      return next();
    },
    requireRoles: (roles) => (req, res, next) => {
      if (!req.authUser || !roles.includes(req.authUser.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return next();
    },
    normalizeInquiryStatus: (value) => String(value || '').trim().toLowerCase() || 'new',
    normalizeInquiryPriority: (value) => String(value || '').trim().toLowerCase() || 'normal',
    normalizeInquiryOwner: (value) => String(value || '').trim(),
    normalizeFollowUpAt: (value) => (value ? new Date(value).toISOString() : ''),
    isClosedInquiryStatus: (value) => ['won', 'lost', 'closed'].includes(String(value || '').toLowerCase()),
    sanitizeInquiry: (item) => item,
    persistFallbackInquiries: () => {},
    logActivity: async () => {},
  });

  const handlers = app.routes.get('PUT /api/admin/inquiries/:id');
  const req = {
    params: { id: 'inq-1' },
    body: { status: 'qualified', owner: 'Melissa', nextFollowUpAt: '2026-03-11T09:00:00.000Z' },
    session: { authUser: { id: 'user-1', username: 'employee', role: 'user' } },
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Forbidden' });
  assert.equal(fallbackInquiries[0].owner, 'Ops');
});

test('admin inquiry update requires owner and follow-up date for active inquiries', async () => {
  const app = createMockApp();
  const fallbackInquiries = [{ _id: 'inq-1', name: 'Lead', status: 'new', owner: 'Ops', nextFollowUpAt: '2026-03-10T00:00:00.000Z' }];

  registerInquiryRoutes(app, {
    Inquiry: {},
    fallbackInquiries,
    useFallback: true,
    mongoose: { connection: { readyState: 0 } },
    requireAuth: (req, _res, next) => {
      req.authUser = req.session.authUser;
      return next();
    },
    requireRoles: () => (_req, _res, next) => next(),
    normalizeInquiryStatus: (value) => String(value || '').trim().toLowerCase() || 'new',
    normalizeInquiryPriority: (value) => String(value || '').trim().toLowerCase() || 'normal',
    normalizeInquiryOwner: (value) => String(value || '').trim(),
    normalizeFollowUpAt: (value) => (value ? new Date(value).toISOString() : ''),
    isClosedInquiryStatus: (value) => ['won', 'lost', 'closed'].includes(String(value || '').toLowerCase()),
    sanitizeInquiry: (item) => item,
    persistFallbackInquiries: () => {},
    logActivity: async () => {},
  });

  const handlers = app.routes.get('PUT /api/admin/inquiries/:id');
  const req = {
    params: { id: 'inq-1' },
    body: { status: 'qualified', owner: '', nextFollowUpAt: '' },
    session: { authUser: { id: 'admin-1', username: 'admin', role: 'admin' } },
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Owner is required' });
});

test('admin inquiry update persists fallback inquiry lifecycle changes', async () => {
  const app = createMockApp();
  const fallbackInquiries = [{
    _id: 'inq-1',
    name: 'Lead',
    status: 'new',
    owner: 'Ops',
    nextFollowUpAt: '2026-03-10T00:00:00.000Z',
    assignedTo: 'Ops',
  }];

  registerInquiryRoutes(app, {
    Inquiry: {},
    fallbackInquiries,
    useFallback: true,
    mongoose: { connection: { readyState: 0 } },
    requireAuth: (req, _res, next) => {
      req.authUser = req.session.authUser;
      return next();
    },
    requireRoles: () => (_req, _res, next) => next(),
    normalizeInquiryStatus: (value) => String(value || '').trim().toLowerCase() || 'new',
    normalizeInquiryPriority: (value) => String(value || '').trim().toLowerCase() || 'normal',
    normalizeInquiryOwner: (value) => String(value || '').trim(),
    normalizeFollowUpAt: (value) => (value ? new Date(value).toISOString() : ''),
    isClosedInquiryStatus: (value) => ['won', 'lost', 'closed'].includes(String(value || '').toLowerCase()),
    sanitizeInquiry: (item) => item,
    persistFallbackInquiries: () => {},
    logActivity: async () => {},
  });

  const handlers = app.routes.get('PUT /api/admin/inquiries/:id');
  const req = {
    params: { id: 'inq-1' },
    body: {
      status: 'qualified',
      owner: 'Melissa',
      nextFollowUpAt: '2026-03-11T09:00:00.000Z',
      priority: 'high',
      notes: 'Follow up with proposal',
    },
    session: { authUser: { id: 'admin-1', username: 'admin', role: 'admin' } },
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(fallbackInquiries[0].status, 'qualified');
  assert.equal(fallbackInquiries[0].owner, 'Melissa');
  assert.equal(fallbackInquiries[0].assignedTo, 'Melissa');
  assert.equal(fallbackInquiries[0].priority, 'high');
  assert.equal(fallbackInquiries[0].notes, 'Follow up with proposal');
  assert.equal(fallbackInquiries[0].handledBy, 'admin');
  assert.match(fallbackInquiries[0].nextFollowUpAt, /2026-03-11T09:00:00.000Z/);
  assert.equal(res.body.inquiry.owner, 'Melissa');
});
