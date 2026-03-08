const test = require('node:test');
const assert = require('node:assert/strict');
const { registerAuthRoutes } = require('../routes/auth');
const { registerInquiryRoutes } = require('../routes/inquiries');

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
  assert.deepEqual(res.body, { error: 'Username and password are required' });
});

test('auth login stores session user when fallback credentials match', async () => {
  const app = createMockApp();
  const authUsers = [{ id: 'admin-1', username: 'admin', password: '1111', role: 'admin' }];

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
  const req = { body: { username: 'admin', password: '1111' }, session: {}, sessionID: 'session-1' };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(req.session.authUser, { id: 'admin-1', username: 'admin', role: 'admin' });
  assert.deepEqual(res.body, { user: { id: 'admin-1', username: 'admin', role: 'admin' } });
  assert.match(authUsers[0].passwordHash, /^hashed:/);
  assert.equal(authUsers[0].password, undefined);
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
    body: { username: 'owner', password: 'secret', role: 'admin', adminCode: 'wrong-code' },
    session: {},
  };
  const res = createResponse();

  await runHandlers(handlers, req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Invalid admin signup code' });
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
