/* eslint-disable no-console */
// Smoke test for Project-based RBAC.
//
// Runs against a local backend instance (auto-detects 3102/3002).
// Usage:
//   node backend/scripts/smoke-rbac.js
//   BASE_URL=http://localhost:3102 node backend/scripts/smoke-rbac.js

const candidateBaseUrls = [
  process.env.BASE_URL,
  'http://localhost:3102',
  'http://127.0.0.1:3102',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
].filter(Boolean).map((value) => value.replace(/\/$/, ''));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseCookiePairs = (setCookieValue) => {
  // "name=value; Path=/; HttpOnly" -> "name=value"
  const raw = String(setCookieValue || '').split(';')[0].trim();
  return raw || '';
};

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }
  addFromSetCookie(setCookie) {
    const pair = parseCookiePairs(setCookie);
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx <= 0) return;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    this.cookies.set(name, value);
  }
  headerValue() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

const httpJson = async (path, { method = 'GET', body = undefined, jar = null, headers = {} } = {}) => {
  const url = `${jar?.baseUrl || candidateBaseUrls[0]}${path}`;
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  };
  if (jar) {
    const cookie = jar.headerValue();
    if (cookie) init.headers.Cookie = cookie;
  }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (jar && Array.isArray(setCookies)) {
    setCookies.forEach((c) => jar.addFromSetCookie(c));
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }
  return json;
};

const httpForm = async (path, { method = 'POST', formData, jar } = {}) => {
  const url = `${jar?.baseUrl || candidateBaseUrls[0]}${path}`;
  const init = { method, body: formData, headers: { Accept: 'application/json' } };
  if (jar) {
    const cookie = jar.headerValue();
    if (cookie) init.headers.Cookie = cookie;
  }
  const res = await fetch(url, init);
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (jar && Array.isArray(setCookies)) {
    setCookies.forEach((c) => jar.addFromSetCookie(c));
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }
  return json;
};

const detectBaseUrl = async () => {
  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/status`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;
      const payload = await response.json();
      if (payload && Object.prototype.hasOwnProperty.call(payload, 'usingFallback')) {
        return baseUrl;
      }
    } catch (_error) {
      // ignore and continue
    }
  }

  throw new Error('No compatible Construction Operations Portal backend found on the supported local ports.');
};

const login = async ({ username, password }) => {
  const jar = new CookieJar();
  jar.baseUrl = candidateBaseUrls[0];
  await httpJson('/api/auth/login', { method: 'POST', body: { username, password }, jar });
  const me = await httpJson('/api/auth/me', { jar });
  return { jar, me: me.user };
};

const ensureProject = async () => {
  const title = `RBAC Smoke ${new Date().toISOString()}`;
  const description = 'RBAC smoke test project (safe to delete)';
  const created = await httpJson('/api/projects', {
    method: 'POST',
    body: { title, description, status: 'ongoing', location: 'Test', owner: 'smoke' },
  });
  const id = String(created && created._id ? created._id : '');
  if (!id) throw new Error('Failed to create project (missing _id)');
  return { id, title };
};

const findUserByUsername = (users, username) => {
  const want = String(username || '').toLowerCase();
  return (Array.isArray(users) ? users : []).find((u) => String(u.username || '').toLowerCase() === want) || null;
};

const main = async () => {
  const baseUrl = await detectBaseUrl();
  candidateBaseUrls[0] = baseUrl;
  console.log(`RBAC smoke starting: ${baseUrl}`);

  // Wait a moment if backend is still booting.
  for (let i = 0; i < 10; i++) {
    try {
      await httpJson('/api/status');
      break;
    } catch (_) {
      await sleep(250);
    }
  }

  const adminLogin = await login({ username: 'admin', password: '1111' });
  if (adminLogin.me.role !== 'admin') throw new Error(`Expected admin role, got ${adminLogin.me.role}`);

  const project = await ensureProject();
  console.log(`Created project: ${project.title} (${project.id})`);

  const users = await httpJson('/api/admin/users', { jar: adminLogin.jar });
  const employee = findUserByUsername(users, 'employee') || (await httpJson('/api/admin/users', {
    method: 'POST',
    jar: adminLogin.jar,
    body: { username: 'employee', password: '1111', role: 'user' },
  })).user;

  const client = findUserByUsername(users, 'client') || (await httpJson('/api/admin/users', {
    method: 'POST',
    jar: adminLogin.jar,
    body: { username: 'client', password: '1111', role: 'client' },
  })).user;

  const client2Name = `client2_${Date.now()}`;
  const client2 = (await httpJson('/api/admin/users', {
    method: 'POST',
    jar: adminLogin.jar,
    body: { username: client2Name, password: '1111', role: 'client' },
  })).user;

  await httpJson(`/api/admin/users/${encodeURIComponent(employee.id)}`, {
    method: 'PUT',
    jar: adminLogin.jar,
    body: { projectIds: [project.id] },
  });
  await httpJson(`/api/admin/users/${encodeURIComponent(client.id)}`, {
    method: 'PUT',
    jar: adminLogin.jar,
    body: { projectIds: [project.id] },
  });
  await httpJson(`/api/admin/users/${encodeURIComponent(client2.id)}`, {
    method: 'PUT',
    jar: adminLogin.jar,
    body: { projectIds: [] },
  });

  console.log(`Assigned project to employee(${employee.username}) and client(${client.username}); left ${client2Name} unassigned.`);

  const fileName = `rbac-smoke-${Date.now()}.txt`;
  const fileBytes = Buffer.from(`rbac-smoke ${new Date().toISOString()}\n`, 'utf8');
  const f = new File([fileBytes], fileName, { type: 'text/plain' });
  const fd = new FormData();
  fd.append('file', f);
  fd.append('visibility', 'client');
  fd.append('projectId', project.id);
  fd.append('folder', 'RBAC');
  fd.append('tags', 'rbac,smoke');
  fd.append('notes', 'created by smoke test');

  const uploaded = await httpForm('/api/files', { method: 'POST', jar: adminLogin.jar, formData: fd });
  console.log(`Uploaded client file: ${uploaded.originalName} (${uploaded._id || uploaded.id || 'no-id'})`);

  const clientLogin = await login({ username: 'client', password: '1111' });
  const clientFiles = await httpJson('/api/files', { jar: clientLogin.jar });
  const clientSees = Array.isArray(clientFiles) && clientFiles.some((x) => String(x.originalName || '') === fileName);
  if (!clientSees) throw new Error('Client should see the project file, but did not.');

  const client2Login = await login({ username: client2Name, password: '1111' });
  const client2Files = await httpJson('/api/files', { jar: client2Login.jar });
  const client2Sees = Array.isArray(client2Files) && client2Files.some((x) => String(x.originalName || '') === fileName);
  if (client2Sees) throw new Error('Unassigned client should NOT see the project file, but did.');

  const employeeLogin = await login({ username: 'employee', password: '1111' });
  const employeeFiles = await httpJson('/api/files', { jar: employeeLogin.jar });
  const employeeSees = Array.isArray(employeeFiles) && employeeFiles.some((x) => String(x.originalName || '') === fileName);
  if (!employeeSees) throw new Error('Employee should see the project file, but did not.');

  console.log('RBAC smoke PASS');
};

main().catch((err) => {
  console.error('RBAC smoke FAIL:', err && err.message ? err.message : err);
  if (err && err.body) console.error('Details:', err.body);
  process.exitCode = 1;
});
