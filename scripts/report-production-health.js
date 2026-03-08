/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();
const explicitBackendUrl = String(process.env.BACKEND_URL || '').trim();

if (!explicitFrontendUrl) {
  console.error('Production health report failed.');
  console.error('Set FRONTEND_URL to the deployed frontend origin you want to inspect.');
  process.exit(1);
}

const frontendUrl = explicitFrontendUrl.replace(/\/$/, '');
const backendUrl = explicitBackendUrl ? explicitBackendUrl.replace(/\/$/, '') : '';

const endpoints = [
  { label: 'frontend /', url: `${frontendUrl}/`, type: 'html' },
  { label: 'frontend /services', url: `${frontendUrl}/services`, type: 'html' },
  { label: 'frontend /projects', url: `${frontendUrl}/projects`, type: 'html' },
  { label: 'frontend /contact', url: `${frontendUrl}/contact`, type: 'html' },
  { label: 'frontend /api/status', url: `${frontendUrl}/api/status`, type: 'json' },
  { label: 'frontend /api/auth/me', url: `${frontendUrl}/api/auth/me`, type: 'json' },
];

if (backendUrl) {
  endpoints.push({ label: 'backend /api/status', url: `${backendUrl}/api/status`, type: 'json' });
}

const fetchEndpoint = async ({ label, url, type }) => {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        Accept: type === 'json' ? 'application/json' : 'text/html,application/json',
      },
    });

    const text = await response.text();
    const durationMs = Date.now() - startedAt;
    const summary = {
      label,
      url,
      ok: response.ok || response.status === 401,
      status: response.status,
      durationMs,
    };

    if (type === 'html') {
      summary.matchesAppShell = text.includes('<title>Construction Operations Portal</title>');
    } else {
      try {
        const payload = text ? JSON.parse(text) : null;
        summary.json = payload;
      } catch (_error) {
        summary.jsonParseError = true;
      }
    }

    return summary;
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      error: error.message,
    };
  }
};

const formatResultLine = (result) => {
  const status = result.status === null ? 'ERR' : String(result.status);
  const timing = `${result.durationMs}ms`;
  if (!result.ok) {
    return `FAIL ${result.label} -> ${status} ${timing}${result.error ? ` (${result.error})` : ''}`;
  }

  if (result.matchesAppShell === false) {
    return `WARN ${result.label} -> ${status} ${timing} (unexpected app shell)`;
  }

  if (result.jsonParseError) {
    return `WARN ${result.label} -> ${status} ${timing} (invalid JSON)`;
  }

  return `OK   ${result.label} -> ${status} ${timing}`;
};

async function main() {
  const timestamp = new Date().toISOString();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await fetchEndpoint(endpoint));
  }

  const okCount = results.filter((result) => result.ok).length;
  const warnCount = results.filter((result) => result.matchesAppShell === false || result.jsonParseError).length;
  const failCount = results.filter((result) => !result.ok).length;

  console.log('Production health report');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Frontend: ${frontendUrl}`);
  if (backendUrl) {
    console.log(`Backend: ${backendUrl}`);
  }
  console.log('');

  results.forEach((result) => {
    console.log(formatResultLine(result));
  });

  console.log('');
  console.log(`Summary: ${okCount} ok, ${warnCount} warnings, ${failCount} failures`);

  if (process.env.REPORT_JSON === '1') {
    console.log('');
    console.log(JSON.stringify({ timestamp, frontendUrl, backendUrl, results }, null, 2));
  }

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Production health report failed.');
  console.error(error.message);
  process.exitCode = 1;
});
