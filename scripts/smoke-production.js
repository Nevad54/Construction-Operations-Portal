/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();
const explicitBackendUrl = String(process.env.BACKEND_URL || '').trim();

if (!explicitFrontendUrl) {
  console.error('Production smoke failed.');
  console.error('Set FRONTEND_URL to the deployed frontend origin you want to validate.');
  process.exit(1);
}

const frontendUrl = explicitFrontendUrl.replace(/\/$/, '');
const backendUrl = explicitBackendUrl ? explicitBackendUrl.replace(/\/$/, '') : '';
const publicRoutes = ['/', '/services', '/projects', '/contact'];

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

const ensureFrontendShell = async (path) => {
  const { response, text } = await fetchText(`${frontendUrl}${path}`);

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  if (!text.includes('<title>Construction Operations Portal</title>')) {
    throw new Error(`${path} did not return the expected app shell title`);
  }
};

const checkFrontendApiBoundary = async () => {
  const statusResult = await fetchText(`${frontendUrl}/api/status`, {
    headers: { Accept: 'application/json' },
  });
  if (!statusResult.response.ok) {
    throw new Error(`/api/status returned HTTP ${statusResult.response.status}`);
  }

  const statusPayload = expectJson(statusResult.text, `${frontendUrl}/api/status`);
  if (!statusPayload || !Object.prototype.hasOwnProperty.call(statusPayload, 'dbConnected')) {
    throw new Error('/api/status did not return the expected backend status payload');
  }

  const authResult = await fetchText(`${frontendUrl}/api/auth/me`, {
    headers: { Accept: 'application/json' },
  });
  if (authResult.response.status !== 401) {
    throw new Error(`/api/auth/me expected HTTP 401 for anonymous request but received ${authResult.response.status}`);
  }

  const authPayload = expectJson(authResult.text, `${frontendUrl}/api/auth/me`);
  if (!authPayload || authPayload.error !== 'Unauthorized') {
    throw new Error('/api/auth/me did not return the expected unauthorized JSON payload');
  }
};

const checkContactProbe = async () => {
  const payload = {
    name: 'Production Smoke',
    email: 'production.smoke@example.com',
    phone: '+1 555 0101',
    projectType: 'Industrial Retrofit',
    message: 'Production-safe validation using an intentionally invalid reCAPTCHA token.',
    recaptchaToken: 'invalid-production-smoke-token',
  };

  const contactResult = await fetchText(`${frontendUrl}/api/contact`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (contactResult.response.status !== 400) {
    throw new Error(`/api/contact expected HTTP 400 for invalid reCAPTCHA token but received ${contactResult.response.status}`);
  }

  const contactPayload = expectJson(contactResult.text, `${frontendUrl}/api/contact`);
  if (!contactPayload || contactPayload.error !== 'reCAPTCHA verification failed. Please try again.') {
    throw new Error('/api/contact did not return the expected invalid reCAPTCHA error payload');
  }

  if (!Array.isArray(contactPayload.details) || !contactPayload.details.includes('invalid-input-response')) {
    throw new Error('/api/contact did not include the expected Google reCAPTCHA error details');
  }
};

const checkBackendBase = async () => {
  if (!backendUrl) return;

  const backendStatus = await fetchText(`${backendUrl}/api/status`, {
    headers: { Accept: 'application/json' },
  });

  if (!backendStatus.response.ok) {
    throw new Error(`Backend /api/status returned HTTP ${backendStatus.response.status}`);
  }

  const backendPayload = expectJson(backendStatus.text, `${backendUrl}/api/status`);
  if (!backendPayload || !Object.prototype.hasOwnProperty.call(backendPayload, 'dbConnected')) {
    throw new Error('Backend /api/status did not return the expected backend status payload');
  }
};

async function main() {
  for (const route of publicRoutes) {
    await ensureFrontendShell(route);
  }

  await checkFrontendApiBoundary();
  await checkContactProbe();
  await checkBackendBase();

  console.log('Production smoke passed.');
  console.log(`Frontend: ${frontendUrl}`);
  if (backendUrl) {
    console.log(`Backend: ${backendUrl}`);
  }
  console.log(`Verified public routes: ${publicRoutes.join(', ')}`);
  console.log('Verified API routes: /api/status, /api/auth/me, /api/contact (invalid-token probe)');
}

main().catch((error) => {
  console.error('Production smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
