/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();
const explicitBackendUrl = String(process.env.BACKEND_URL || '').trim();

if (!explicitFrontendUrl || !explicitBackendUrl) {
  console.error('Deploy protected-route smoke failed.');
  console.error('Set both FRONTEND_URL and BACKEND_URL to the deployed origins you want to validate.');
  process.exit(1);
}

const frontendUrl = explicitFrontendUrl.replace(/\/$/, '');
const backendUrl = explicitBackendUrl.replace(/\/$/, '');
const protectedRouteChecks = [
  { path: '/api/admin/kpis', allowedStatuses: [401], label: 'admin KPI route' },
  { path: '/api/admin/inquiries?limit=1', allowedStatuses: [401], label: 'admin inquiries route' },
  { path: '/api/client/follow-ups', allowedStatuses: [401], label: 'client follow-up route' },
];

const fetchText = async (url) => {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
    },
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

const checkProtectedRoute = async ({ path, allowedStatuses, label }) => {
  const frontendResult = await fetchText(`${frontendUrl}${path}`);
  if (!allowedStatuses.includes(frontendResult.response.status)) {
    throw new Error(`${label} via frontend expected HTTP ${allowedStatuses.join(' or ')} but received ${frontendResult.response.status}`);
  }

  const frontendPayload = expectJson(frontendResult.text, `${frontendUrl}${path}`);
  if (!frontendPayload || frontendPayload.error !== 'Unauthorized') {
    throw new Error(`${label} via frontend did not return the expected unauthorized JSON payload`);
  }

  const backendResult = await fetchText(`${backendUrl}${path}`);
  if (!allowedStatuses.includes(backendResult.response.status)) {
    throw new Error(`${label} via backend expected HTTP ${allowedStatuses.join(' or ')} but received ${backendResult.response.status}`);
  }

  const backendPayload = expectJson(backendResult.text, `${backendUrl}${path}`);
  if (!backendPayload || backendPayload.error !== 'Unauthorized') {
    throw new Error(`${label} via backend did not return the expected unauthorized JSON payload`);
  }
};

async function main() {
  for (const route of protectedRouteChecks) {
    await checkProtectedRoute(route);
  }

  console.log('Deploy protected-route smoke passed.');
  console.log(`Frontend: ${frontendUrl}`);
  console.log(`Backend: ${backendUrl}`);
  console.log(`Verified protected route presence: ${protectedRouteChecks.map((item) => item.path).join(', ')}`);
}

main().catch((error) => {
  console.error('Deploy protected-route smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
