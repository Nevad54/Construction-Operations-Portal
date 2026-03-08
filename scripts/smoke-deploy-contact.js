/* eslint-disable no-console */
const explicitFrontendUrl = String(process.env.FRONTEND_URL || '').trim();

if (!explicitFrontendUrl) {
  console.error('Deploy contact smoke failed.');
  console.error('Set FRONTEND_URL to the deployed frontend origin you want to validate.');
  process.exit(1);
}

const frontendUrl = explicitFrontendUrl.replace(/\/$/, '');

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

const checkContactRoute = async () => {
  const { response, text } = await fetchText(`${frontendUrl}/contact`);

  if (!response.ok) {
    throw new Error(`/contact returned HTTP ${response.status}`);
  }

  if (!text.includes('<title>Construction Operations Portal</title>')) {
    throw new Error('/contact did not return the expected app shell title');
  }
};

const checkInvalidRecaptchaProbe = async () => {
  const payload = {
    name: 'Deployed Smoke',
    email: 'deployed.smoke@example.com',
    phone: '+1 555 0100',
    projectType: 'Industrial Retrofit',
    message: 'Production-safe validation using an intentionally invalid reCAPTCHA token.',
    recaptchaToken: 'invalid-production-smoke-token',
  };

  const { response, text } = await fetchText(`${frontendUrl}/api/contact`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 400) {
    throw new Error(`/api/contact expected HTTP 400 for invalid reCAPTCHA token but received ${response.status}`);
  }

  const body = expectJson(text, `${frontendUrl}/api/contact`);

  if (!body || body.error !== 'reCAPTCHA verification failed. Please try again.') {
    throw new Error('/api/contact did not return the expected invalid reCAPTCHA error payload');
  }

  if (!Array.isArray(body.details) || !body.details.includes('invalid-input-response')) {
    throw new Error('/api/contact did not include the expected Google reCAPTCHA error details');
  }
};

async function main() {
  await checkContactRoute();
  await checkInvalidRecaptchaProbe();

  console.log('Deploy contact smoke passed.');
  console.log(`Frontend: ${frontendUrl}`);
  console.log('Verified routes: /contact, /api/contact (invalid-token probe)');
}

main().catch((error) => {
  console.error('Deploy contact smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
