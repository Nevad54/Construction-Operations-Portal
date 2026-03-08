/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();
const explicitBackendUrl = String(process.env.BACKEND_URL || '').trim();

const frontendCandidates = (explicitFrontendUrl
  ? [explicitFrontendUrl]
  : [
      'http://localhost:3101',
      'http://127.0.0.1:3101',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ]).map((value) => value.replace(/\/$/, ''));

const backendCandidates = explicitBackendUrl
  ? [explicitBackendUrl.replace(/\/$/, '')]
  : [];

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

const tryCandidates = async (candidates, label, checker) => {
  const failures = [];

  for (const baseUrl of candidates) {
    try {
      await checker(baseUrl);
      return baseUrl;
    } catch (error) {
      failures.push(`${baseUrl} -> ${error.message}`);
    }
  }

  throw new Error(`${label} failed.\n${failures.join('\n')}`);
};

const checkFrontendOrigin = async (baseUrl) => {
  const indexResult = await fetchText(`${baseUrl}/`);
  if (!indexResult.response.ok) {
    throw new Error(`/ returned HTTP ${indexResult.response.status}`);
  }
  if (!indexResult.text.includes('<title>Construction Operations Portal</title>')) {
    throw new Error('frontend shell title did not match expected app signature');
  }

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

  const authResult = await fetchText(`${baseUrl}/api/auth/me`, {
    headers: { Accept: 'application/json' },
  });
  if (authResult.response.status !== 401) {
    throw new Error(`/api/auth/me expected HTTP 401 for anonymous request but received ${authResult.response.status}`);
  }
  const authPayload = expectJson(authResult.text, `${baseUrl}/api/auth/me`);
  if (!authPayload || authPayload.error !== 'Unauthorized') {
    throw new Error('/api/auth/me did not return the expected unauthorized JSON payload');
  }

  return {
    statusPayload,
  };
};

const checkBackendBase = async (baseUrl) => {
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
};

async function main() {
  const frontendUrl = await tryCandidates(frontendCandidates, 'Frontend runtime smoke', checkFrontendOrigin);

  if (backendCandidates.length) {
    await tryCandidates(backendCandidates, 'Backend runtime smoke', checkBackendBase);
  }

  console.log('Deploy runtime smoke passed.');
  console.log(`Frontend: ${frontendUrl}`);
  if (backendCandidates.length) {
    console.log(`Backend candidates checked: ${backendCandidates.join(', ')}`);
  }
  console.log('Verified endpoints: /, /api/status, /api/auth/me');
}

main().catch((error) => {
  console.error('Deploy runtime smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
