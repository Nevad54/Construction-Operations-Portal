/* eslint-disable no-console */
// Smoke test for the public contact endpoint in local demo mode.
//
// Requires a backend instance started in development mode so reCAPTCHA
// verification is skipped for local-only demo submissions.

const candidateBaseUrls = [
  process.env.BASE_URL,
  'http://localhost:3102',
  'http://127.0.0.1:3102',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
].filter(Boolean).map((value) => value.replace(/\/$/, ''));

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
      // ignore
    }
  }

  throw new Error('No compatible Construction Operations Portal backend found on the supported local ports.');
};

const main = async () => {
  const baseUrl = await detectBaseUrl();
  console.log(`Contact smoke starting: ${baseUrl}`);

  const payload = {
    name: 'Demo Contact',
    email: 'demo.contact@example.com',
    phone: '+1 555 0101',
    companyName: 'Demo Fabrication Group',
    projectType: 'Industrial Retrofit',
    siteLocation: 'Imus, Cavite',
    timeline: 'Within 30 days',
    serviceNeeded: 'Site coordination and reporting',
    message: 'Local demo smoke submission for the public inquiry flow.',
    recaptchaToken: 'local-demo-token',
  };

  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();
  const body = contentType.includes('application/json') && bodyText ? JSON.parse(bodyText) : bodyText;

  if (!response.ok) {
    throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
  }

  const message = typeof body === 'string' ? body : body?.message;
  if (!message || !/message (sent|received) successfully/i.test(message)) {
    throw new Error(`Unexpected contact response: ${JSON.stringify(body)}`);
  }

  console.log('Contact smoke passed.');
  console.log(`Response: ${message}`);
};

main().catch((error) => {
  console.error('Contact smoke failed.');
  console.error(error.message);
  process.exitCode = 1;
});
