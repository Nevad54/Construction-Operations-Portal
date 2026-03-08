/* eslint-disable no-console */
// Smoke test for authenticated admin dashboard APIs.
//
// Runs against a local backend instance (default http://localhost:3002).
// Usage:
//   node backend/scripts/smoke-admin-dashboard.js
//   BASE_URL=http://localhost:3002 node backend/scripts/smoke-admin-dashboard.js

const candidateBaseUrls = [
  process.env.BASE_URL,
  'http://localhost:3102',
  'http://127.0.0.1:3102',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
].filter(Boolean).map((value) => value.replace(/\/$/, ''));

const parseCookiePair = (setCookieValue) => String(setCookieValue || '').split(';')[0].trim();

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  addFromSetCookie(setCookie) {
    const pair = parseCookiePair(setCookie);
    if (!pair) return;
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex <= 0) return;
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    this.cookies.set(name, value);
  }

  headerValue() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}

const requestJson = async (path, { method = 'GET', body, jar } = {}) => {
  const response = await fetch(`${jar?.baseUrl || candidateBaseUrls[0]}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(jar && jar.headerValue() ? { Cookie: jar.headerValue() } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [];

  if (jar && Array.isArray(setCookies)) {
    setCookies.forEach((cookie) => jar.addFromSetCookie(cookie));
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
};

const requestBestEffortJson = async (path, { jar } = {}) => {
  const response = await fetch(`${jar?.baseUrl || candidateBaseUrls[0]}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(jar && jar.headerValue() ? { Cookie: jar.headerValue() } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!contentType.includes('application/json')) {
    return {
      kind: 'non-json',
      contentType,
      bodyPreview: text.slice(0, 120),
    };
  }

  return {
    kind: 'json',
    value: text ? JSON.parse(text) : null,
  };
};

const detectBaseUrl = async () => {
  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/status`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) continue;
      const payload = await response.json();
      if (payload && Object.prototype.hasOwnProperty.call(payload, 'usingFallback')) {
        return baseUrl;
      }
    } catch (_error) {
      // ignore and continue searching
    }
  }

  throw new Error('No compatible Construction Operations Portal backend found on the supported local ports.');
};

const main = async () => {
  const baseUrl = await detectBaseUrl();
  console.log(`Admin dashboard smoke starting: ${baseUrl}`);

  await requestJson('/api/status', { jar: { baseUrl, headerValue: () => '' } });

  const jar = new CookieJar();
  jar.baseUrl = baseUrl;
  const adminUsername = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASS || '1111';
  const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || adminPassword;
  let login;

  try {
    login = await requestJson('/api/auth/login', {
      method: 'POST',
      body: {
        username: adminUsername,
        password: adminPassword,
      },
      jar,
    });
  } catch (error) {
    if (error.status !== 401) throw error;

    const tempUsername = `smoke_admin_${Date.now()}`;
    console.log(`Default admin login rejected. Creating temporary admin user: ${tempUsername}`);

    login = await requestJson('/api/auth/register', {
      method: 'POST',
      body: {
        username: tempUsername,
        password: adminPassword,
        role: 'admin',
        adminCode: adminSignupCode,
      },
      jar,
    });
  }

  if (login?.user?.role !== 'admin') {
    throw new Error(`Expected admin login but received role "${login?.user?.role || 'unknown'}"`);
  }

  const me = await requestJson('/api/auth/me', { jar });
  if (me?.user?.role !== 'admin') {
    throw new Error(`Expected /api/auth/me to return admin but received "${me?.user?.role || 'unknown'}"`);
  }

  const requiredKpiKeys = ['new_today', 'overdue_followups', 'qualified_rate', 'proposal_rate'];
  const kpis = await requestBestEffortJson('/api/admin/kpis', { jar });
  if (kpis.kind === 'json') {
    const kpiPayload = kpis.value?.kpis || kpis.value || {};
    const missingKpiKeys = requiredKpiKeys.filter((key) => !(key in kpiPayload));
    if (missingKpiKeys.length) {
      throw new Error(`Missing KPI fields: ${missingKpiKeys.join(', ')}`);
    }
  } else {
    console.warn(`Warning: /api/admin/kpis returned ${kpis.contentType || 'non-JSON content'} instead of JSON. Preview: ${kpis.bodyPreview}`);
  }

  const inquiries = await requestJson('/api/admin/inquiries?limit=5', { jar });
  if (!Array.isArray(inquiries?.items)) {
    throw new Error('Expected admin inquiries payload with an items array.');
  }

  console.log('Admin dashboard smoke passed.');
  console.log(`Admin user: ${me.user.username}`);
  console.log(`KPI fields checked: ${requiredKpiKeys.join(', ')}`);
  console.log(`Inquiry sample count: ${inquiries.items.length}`);
};

main().catch((error) => {
  console.error('Admin dashboard smoke failed.');
  console.error(error.message);
  if (error.body) {
    console.error(JSON.stringify(error.body, null, 2));
  }
  process.exitCode = 1;
});
