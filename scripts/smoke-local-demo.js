const frontendCandidates = [
  process.env.FRONTEND_URL,
  'http://localhost:3101',
  'http://127.0.0.1:3101',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
].filter(Boolean);

const backendCandidates = [
  process.env.BACKEND_URL,
  'http://localhost:3102',
  'http://127.0.0.1:3102',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
].filter(Boolean);

const frontendRoutes = ['/', '/contact', '/login/admin'];

async function fetchOk(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      Accept: 'text/html,application/json',
    },
  });

  if (!response.ok && response.status !== 304) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
}

async function firstReachable(candidates, path, validator = null) {
  const errors = [];

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${path}`;
    try {
      const response = await fetchOk(url);
      if (validator) {
        await validator(response, baseUrl);
      }
      return { baseUrl, url };
    } catch (error) {
      errors.push(`${url} -> ${error.message}`);
    }
  }

  throw new Error(errors.join('\n'));
}

async function verifyFrontend(baseUrl) {
  const failures = [];

  for (const route of frontendRoutes) {
    try {
      await fetchOk(`${baseUrl}${route}`);
    } catch (error) {
      failures.push(`${baseUrl}${route} -> ${error.message}`);
    }
  }

  if (failures.length) {
    throw new Error(failures.join('\n'));
  }
}

async function validateBackendStatus(response) {
  const payload = await response.json();
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'usingFallback')) {
    throw new Error('Status endpoint does not match Construction Operations Portal backend shape');
  }
}

async function validateFrontendIndex(response) {
  const html = await response.text();
  if (!html.includes('<title>Construction Operations Portal</title>')) {
    throw new Error('Index page does not match Construction Operations Portal frontend');
  }
}

async function main() {
  const backend = await firstReachable(backendCandidates, '/api/status', validateBackendStatus);

  const frontend = await firstReachable(frontendCandidates, '/', validateFrontendIndex);
  await verifyFrontend(frontend.baseUrl);

  console.log('Local demo smoke passed.');
  console.log(`Backend: ${backend.baseUrl}`);
  console.log(`Frontend: ${frontend.baseUrl}`);
  console.log(`Checked frontend routes: ${frontendRoutes.join(', ')}`);
}

main().catch((error) => {
  console.error('Local demo smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
