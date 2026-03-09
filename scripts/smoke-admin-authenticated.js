/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();

const frontendCandidates = (explicitFrontendUrl
  ? [explicitFrontendUrl]
  : [
      'http://localhost:3101',
      'http://127.0.0.1:3101',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ]).map((value) => value.replace(/\/$/, ''));

const requiredKpiKeys = ['new_today', 'overdue_followups', 'qualified_rate', 'proposal_rate'];
const adminShellRoutes = ['/login/admin', '/admin/dashboard/projects', '/admin/dashboard/reports'];

const parseCookiePair = (setCookieValue) => String(setCookieValue || '').split(';')[0].trim();

class CookieJar {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
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

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      Accept: 'text/html,application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  return { response, text };
};

const expectJson = (text, label) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    throw new Error(`${label} did not return valid JSON.`);
  }
};

const expectAppShell = (text, route) => {
  if (!text.includes('<title>Construction Operations Portal</title>')) {
    throw new Error(`${route} did not return the expected app shell title`);
  }
};

const collectCookies = (response, jar) => {
  if (!jar || typeof response.headers.getSetCookie !== 'function') return;
  response.headers.getSetCookie().forEach((cookie) => jar.addFromSetCookie(cookie));
};

const requestJson = async (jar, path, { method = 'GET', body, expectedStatus } = {}) => {
  const { response, text } = await fetchText(`${jar.baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(jar.headerValue() ? { Cookie: jar.headerValue() } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  collectCookies(response, jar);

  if (expectedStatus != null && response.status !== expectedStatus) {
    throw new Error(`${path} expected HTTP ${expectedStatus} but received ${response.status}`);
  }

  const data = expectJson(text, `${jar.baseUrl}${path}`);
  if (!response.ok) {
    const error = new Error(data?.error || `${path} returned HTTP ${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
};

const isLocalFrontend = (baseUrl) => {
  try {
    const hostname = new URL(baseUrl).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch (_error) {
    return false;
  }
};

const detectFrontend = async () => {
  const failures = [];

  for (const baseUrl of frontendCandidates) {
    try {
      const indexResult = await fetchText(`${baseUrl}/`);
      if (!indexResult.response.ok) {
        throw new Error(`/ returned HTTP ${indexResult.response.status}`);
      }
      expectAppShell(indexResult.text, '/');

      const statusResult = await fetchText(`${baseUrl}/api/status`, {
        headers: { Accept: 'application/json' },
      });
      if (!statusResult.response.ok) {
        throw new Error(`/api/status returned HTTP ${statusResult.response.status}`);
      }

      const statusPayload = expectJson(statusResult.text, `${baseUrl}/api/status`);
      if (!statusPayload || !Object.prototype.hasOwnProperty.call(statusPayload, 'dbConnected')) {
        throw new Error('/api/status did not return the expected backend status payload');
      }

      return { baseUrl, statusPayload };
    } catch (error) {
      failures.push(`${baseUrl} -> ${error.message}`);
    }
  }

  throw new Error(`Admin authenticated smoke failed to find a compatible frontend origin.\n${failures.join('\n')}`);
};

const verifyShellRoutes = async (baseUrl) => {
  for (const route of adminShellRoutes) {
    const { response, text } = await fetchText(`${baseUrl}${route}`);
    if (!response.ok) {
      throw new Error(`${route} returned HTTP ${response.status}`);
    }
    expectAppShell(text, route);
  }
};

const loginAsAdmin = async (jar) => {
  const adminUsername = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASS || '1111';
  const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || adminPassword;

  try {
    return await requestJson(jar, '/api/auth/login', {
      method: 'POST',
      body: {
        username: adminUsername,
        password: adminPassword,
      },
    });
  } catch (error) {
    if (error.status !== 401 || !isLocalFrontend(jar.baseUrl)) {
      throw error;
    }

    const tempUsername = `smoke_admin_${Date.now()}`;
    console.log(`Default admin login rejected on localhost. Creating temporary admin user: ${tempUsername}`);

    return requestJson(jar, '/api/auth/register', {
      method: 'POST',
      body: {
        username: tempUsername,
        password: adminPassword,
        role: 'admin',
        adminCode: adminSignupCode,
      },
    });
  }
};

async function main() {
  const { baseUrl } = await detectFrontend();
  await verifyShellRoutes(baseUrl);

  const jar = new CookieJar(baseUrl);
  const login = await loginAsAdmin(jar);
  if (login?.user?.role !== 'admin') {
    throw new Error(`Expected admin login but received role "${login?.user?.role || 'unknown'}".`);
  }

  const me = await requestJson(jar, '/api/auth/me');
  if (me?.user?.role !== 'admin') {
    throw new Error(`Expected /api/auth/me to return admin but received "${me?.user?.role || 'unknown'}".`);
  }

  const projects = await requestJson(jar, '/api/projects');
  if (!Array.isArray(projects)) {
    throw new Error('Expected /api/projects to return an array for the admin shell project view.');
  }

  const kpis = await requestJson(jar, '/api/admin/kpis');
  const kpiPayload = kpis?.kpis || kpis || {};
  const missingKpiKeys = requiredKpiKeys.filter((key) => !(key in kpiPayload));
  if (missingKpiKeys.length) {
    throw new Error(`Missing KPI fields: ${missingKpiKeys.join(', ')}`);
  }

  const inquiries = await requestJson(jar, '/api/admin/inquiries?limit=3');
  if (!Array.isArray(inquiries?.items)) {
    throw new Error('Expected /api/admin/inquiries to return an items array.');
  }

  await requestJson(jar, '/api/auth/logout', {
    method: 'POST',
    expectedStatus: 200,
  });

  const { response: postLogoutResponse, text: postLogoutText } = await fetchText(`${baseUrl}/api/auth/me`, {
    headers: {
      Accept: 'application/json',
      ...(jar.headerValue() ? { Cookie: jar.headerValue() } : {}),
    },
  });

  if (postLogoutResponse.status !== 401) {
    throw new Error(`/api/auth/me expected HTTP 401 after logout but received ${postLogoutResponse.status}`);
  }

  const postLogoutPayload = expectJson(postLogoutText, `${baseUrl}/api/auth/me (post logout)`);
  if (!postLogoutPayload || postLogoutPayload.error !== 'Unauthorized') {
    throw new Error('/api/auth/me did not return the expected unauthorized JSON payload after logout.');
  }

  console.log('Admin authenticated smoke passed.');
  console.log(`Frontend: ${baseUrl}`);
  console.log(`Shell routes: ${adminShellRoutes.join(', ')}`);
  console.log('Authenticated API routes: /api/auth/me, /api/projects, /api/admin/kpis, /api/admin/inquiries?limit=3, /api/auth/logout');
}

main().catch((error) => {
  console.error('Admin authenticated smoke failed.');
  console.error(error.message);
  if (error.body) {
    console.error(JSON.stringify(error.body, null, 2));
  }
  process.exitCode = 1;
});
