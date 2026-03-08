const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeContactPayload,
  validateContactPayload,
  buildContactEmailContent,
} = require('../contactPayload');

test('contact payload only requires basic fields plus recaptcha', () => {
  const payload = normalizeContactPayload({
    name: 'Pat Demo',
    email: 'pat@example.com',
    message: 'Need help with a facility upgrade.',
    recaptchaToken: 'demo-token',
  });

  assert.deepEqual(validateContactPayload(payload, { requireRecaptcha: true }), {});
});

test('contact email content omits empty optional fields', () => {
  const content = buildContactEmailContent({
    name: 'Pat Demo',
    email: 'pat@example.com',
    phone: '',
    companyName: '',
    projectType: '',
    serviceNeeded: '',
    siteLocation: '',
    timeline: '',
    message: 'Need help with a facility upgrade.',
  });

  assert.match(content.text, /Name: Pat Demo/);
  assert.match(content.text, /Message: Need help with a facility upgrade\./);
  assert.doesNotMatch(content.text, /Company:/);
  assert.doesNotMatch(content.text, /Timeline:/);
});
