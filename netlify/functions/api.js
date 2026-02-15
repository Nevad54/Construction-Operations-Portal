const crypto = require('crypto');

const SESSION_COOKIE = 'mti_auth';
const SESSION_MAX_AGE = 60 * 60; // 1 hour

// Lazy-load mongoose so the function stays fast/light in proxy mode.
let mongoose = null;
const getMongoose = () => {
  if (mongoose) return mongoose;
  // eslint-disable-next-line global-require
  mongoose = require('mongoose');
  return mongoose;
};

let cachedConnection = null;
let ProjectModel = null;
let fallbackProjects = [];
let dbLastError = '';
let dbConnected = false;

const getBackendBaseUrl = () => (process.env.BACKEND_API_URL || '').trim().replace(/\/$/, '');

const toJson = (value) => JSON.stringify(value || {});

const parseCookies = (cookieHeader = '') => {
  const out = {};
  String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((item) => {
      const idx = item.indexOf('=');
      if (idx <= 0) return;
      const k = item.slice(0, idx).trim();
      const v = item.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    });
  return out;
};

const base64UrlEncode = (obj) => Buffer.from(toJson(obj)).toString('base64url');
const base64UrlDecode = (str) => JSON.parse(Buffer.from(String(str || ''), 'base64url').toString('utf8'));

const signPayload = (payload, secret) => {
  const body = base64UrlEncode(payload);
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verifyToken = (token, secret) => {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig !== expected) return null;
  const payload = base64UrlDecode(body);
  if (!payload || !payload.exp || Date.now() > Number(payload.exp)) return null;
  return payload;
};

const corsHeaders = (origin, extra = {}) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Allow-Credentials': 'true',
  ...extra,
});

const jsonResponse = (statusCode, payload, origin, extraHeaders = {}, cookies = []) => {
  const response = {
    statusCode,
    headers: corsHeaders(origin, { 'Content-Type': 'application/json', ...extraHeaders }),
    body: toJson(payload),
  };
  if (cookies.length) {
    response.multiValueHeaders = { 'set-cookie': cookies };
  }
  return response;
};

const normalizePath = (eventPath = '') => {
  const p = String(eventPath || '')
    .replace(/^\/\.netlify\/functions\/api\/?/, '')
    .replace(/^\/api\/?/, '')
    .replace(/^\/+/, '');
  return p;
};

const parseBody = (event) => {
  if (!event || event.body == null) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

const buildMongoUriCandidates = (rawUri) => {
  const uri = String(rawUri || '').trim();
  if (!uri) return [];
  const candidates = [uri];

  // Retry with URL-encoded password for URIs like mongodb://user:pass@host/db
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:\/@]+):([^@]+)@(.+)$/i);
  if (match) {
    const [, prefix, user, pass, rest] = match;
    const encodedPass = encodeURIComponent(pass);
    const rebuilt = `${prefix}${user}:${encodedPass}@${rest}`;
    if (rebuilt !== uri) {
      candidates.push(rebuilt);
    }
  }
  return Array.from(new Set(candidates));
};

const ensureDb = async () => {
  const mg = getMongoose();
  if (cachedConnection && mg.connection.readyState === 1) {
    dbConnected = true;
    dbLastError = '';
    return true;
  }

  const sourceUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  const uriCandidates = buildMongoUriCandidates(sourceUri);
  if (!uriCandidates.length) {
    dbConnected = false;
    dbLastError = 'MONGO_URI is not configured';
    return false;
  }

  let lastError = null;
  for (const uri of uriCandidates) {
    try {
      if (mg.connection.readyState !== 0) {
        try { await mg.disconnect(); } catch (_) {}
      }
      cachedConnection = await mg.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
      });
      if (!ProjectModel) {
        const schema = new mg.Schema(
          {
            title: String,
            description: String,
            image: String,
            category: String,
            date: Date,
            status: String,
            location: String,
            owner: String,
          },
          { timestamps: true }
        );
        ProjectModel = mg.models.Project || mg.model('Project', schema);
      }
      dbConnected = true;
      dbLastError = '';
      return true;
    } catch (e) {
      lastError = e;
    }
  }

  dbConnected = false;
  dbLastError = lastError && lastError.message ? lastError.message : 'Unknown DB connection error';
  return false;
};

const getAuthUsers = () => ([
  { id: 'admin-1', username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || '1111', role: 'admin' },
  { id: 'user-1', username: process.env.EMP_USER || 'employee', password: process.env.EMP_PASS || '1111', role: 'user' },
  { id: 'client-1', username: process.env.CLIENT_USER || 'client', password: process.env.CLIENT_PASS || '1111', role: 'client' },
]);

const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;

const createSessionCookie = (user, secret) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const token = signPayload(payload, secret);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_MAX_AGE}`;
};

const getSessionUser = (event, secret) => {
  const cookies = parseCookies(event && event.headers ? (event.headers.cookie || event.headers.Cookie || '') : '');
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const data = verifyToken(token, secret);
  if (!data) return null;
  return { id: data.id, username: data.username, role: data.role };
};

const proxyToBackend = async (event, backendBase) => {
  const host = event.headers && (event.headers.host || event.headers.Host) ? (event.headers.host || event.headers.Host) : 'localhost';
  const rawUrl = event.rawUrl || `https://${host}${event.path || ''}`;
  const incomingUrl = new URL(rawUrl);
  const stripped = normalizePath(incomingUrl.pathname);
  const apiPath = stripped ? `/api/${stripped}` : '/api';
  const targetUrl = `${backendBase}${apiPath}${incomingUrl.search || ''}`;

  const method = String(event.httpMethod || 'GET').toUpperCase();
  const headers = { ...(event.headers || {}) };
  delete headers.host;
  delete headers.Host;
  delete headers['content-length'];
  delete headers['Content-Length'];

  const opts = { method, headers };
  if (!['GET', 'HEAD'].includes(method) && event.body != null) {
    opts.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
  }

  const upstream = await fetch(targetUrl, opts);
  const text = await upstream.text();
  const outHeaders = {};
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') return;
    outHeaders[k] = v;
  });
  const cookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  const response = { statusCode: upstream.status, headers: outHeaders, body: text };
  if (cookies.length) response.multiValueHeaders = { 'set-cookie': cookies };
  return response;
};

exports.handler = async (event) => {
  const origin = event && event.headers ? (event.headers.origin || event.headers.Origin || '*') : '*';
  const method = String(event.httpMethod || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin) };
  }

  const backendBase = getBackendBaseUrl();
  if (backendBase) {
    try {
      return await proxyToBackend(event, backendBase);
    } catch (e) {
      return jsonResponse(502, { error: 'Failed to reach backend API.', details: e.message || String(e) }, origin);
    }
  }

  const secret = process.env.SESSION_SECRET || 'change-me';
  const path = normalizePath(event.path || '');
  const body = parseBody(event);

  try {
    if (path === 'status') {
      await ensureDb();
      return jsonResponse(200, { usingNetlifyFunction: true, backendProxy: false, dbConnected, dbLastError }, origin);
    }

    if (path === 'auth/login' && method === 'POST') {
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = getAuthUsers().find((u) => u.username.toLowerCase() === username && u.password === password);
      if (!user) return jsonResponse(401, { error: 'Invalid credentials' }, origin);
      const safeUser = { id: user.id, username: user.username, role: user.role };
      return jsonResponse(200, { user: safeUser }, origin, {}, [createSessionCookie(user, secret)]);
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = getSessionUser(event, secret);
      if (!user) return jsonResponse(401, { error: 'Unauthorized' }, origin);
      return jsonResponse(200, { user }, origin);
    }

    if (path === 'auth/logout' && method === 'POST') {
      return jsonResponse(200, { ok: true }, origin, {}, [clearSessionCookie()]);
    }

    if (path === 'projects' && method === 'GET') {
      const hasDb = await ensureDb();
      if (!hasDb || !ProjectModel) return jsonResponse(200, fallbackProjects, origin);
      const projects = await ProjectModel.find().sort({ createdAt: -1 }).lean();
      return jsonResponse(200, projects, origin);
    }

    if (path === 'projects' && method === 'POST') {
      const hasDb = await ensureDb();
      const data = {
        title: body.title || '',
        description: body.description || '',
        image: body.image || '',
        category: body.category || '',
        date: body.date ? new Date(body.date) : null,
        status: body.status || 'ongoing',
        location: body.location || '',
        owner: body.owner || '',
      };
      if (!data.title || !data.description) {
        return jsonResponse(400, { error: 'Title and description are required' }, origin);
      }
      if (!hasDb || !ProjectModel) {
        const created = { _id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        fallbackProjects.unshift(created);
        return jsonResponse(201, created, origin);
      }
      const created = await ProjectModel.create(data);
      return jsonResponse(201, created, origin);
    }

    if (path.startsWith('projects/') && method === 'PUT') {
      const hasDb = await ensureDb();
      const id = path.split('/')[1];
      const updates = {
        title: body.title,
        description: body.description,
        image: body.image,
        category: body.category,
        date: body.date ? new Date(body.date) : body.date,
        status: body.status,
        location: body.location,
        owner: body.owner,
      };
      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
      if (!hasDb || !ProjectModel) {
        const idx = fallbackProjects.findIndex((p) => String(p._id) === String(id));
        if (idx === -1) return jsonResponse(404, { error: 'Project not found' }, origin);
        fallbackProjects[idx] = { ...fallbackProjects[idx], ...updates, updatedAt: new Date().toISOString() };
        return jsonResponse(200, fallbackProjects[idx], origin);
      }
      const updated = await ProjectModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
      if (!updated) return jsonResponse(404, { error: 'Project not found' }, origin);
      return jsonResponse(200, updated, origin);
    }

    if (path.startsWith('projects/') && method === 'DELETE') {
      const hasDb = await ensureDb();
      const id = path.split('/')[1];
      if (!hasDb || !ProjectModel) {
        const idx = fallbackProjects.findIndex((p) => String(p._id) === String(id));
        if (idx === -1) return jsonResponse(404, { error: 'Project not found' }, origin);
        fallbackProjects.splice(idx, 1);
        return jsonResponse(200, { message: 'Project deleted' }, origin);
      }
      const deleted = await ProjectModel.findByIdAndDelete(id);
      if (!deleted) return jsonResponse(404, { error: 'Project not found' }, origin);
      return jsonResponse(200, { message: 'Project deleted' }, origin);
    }

    return jsonResponse(404, { error: 'Not found' }, origin);
  } catch (error) {
    return jsonResponse(500, { error: 'Internal Server Error', details: error.message || String(error) }, origin);
  }
};
