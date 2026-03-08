const CONTACT_REQUIRED_FIELDS = [
  'name',
  'email',
  'message',
];

const trimValue = (value) => String(value || '').trim();

const normalizeContactPayload = (body = {}) => ({
  name: trimValue(body.name),
  email: trimValue(body.email).toLowerCase(),
  phone: trimValue(body.phone),
  companyName: trimValue(body.companyName),
  projectType: trimValue(body.projectType),
  siteLocation: trimValue(body.siteLocation),
  timeline: trimValue(body.timeline),
  serviceNeeded: trimValue(body.serviceNeeded),
  message: trimValue(body.message),
  recaptchaToken: trimValue(body.recaptchaToken),
});

const validateContactPayload = (payload, { requireRecaptcha = true } = {}) => {
  const errors = {};

  CONTACT_REQUIRED_FIELDS.forEach((field) => {
    if (!trimValue(payload[field])) {
      errors[field] = `${field} is required`;
    }
  });

  if (payload.email && !/\S+@\S+\.\S+/.test(payload.email)) {
    errors.email = 'email is invalid';
  }

  if (payload.phone && !/^\+?[\d\s\-()]+$/.test(payload.phone)) {
    errors.phone = 'phone is invalid';
  }

  if (requireRecaptcha && !trimValue(payload.recaptchaToken)) {
    errors.recaptchaToken = 'recaptchaToken is required';
  }

  return errors;
};

const buildContactEmailContent = (payload) => {
  const optionalRows = [
    payload.phone ? `Phone: ${payload.phone}` : null,
    payload.companyName ? `Company: ${payload.companyName}` : null,
    payload.projectType ? `Project Type: ${payload.projectType}` : null,
    payload.serviceNeeded ? `Primary Service: ${payload.serviceNeeded}` : null,
    payload.siteLocation ? `Site Location: ${payload.siteLocation}` : null,
    payload.timeline ? `Timeline: ${payload.timeline}` : null,
  ].filter(Boolean);

  const lines = [`Name: ${payload.name}`, `Email: ${payload.email}`, ...optionalRows, `Message: ${payload.message}`];

  const htmlRows = [
    `<p><strong>Name:</strong> ${payload.name}</p>`,
    `<p><strong>Email:</strong> ${payload.email}</p>`,
    payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : '',
    payload.companyName ? `<p><strong>Company:</strong> ${payload.companyName}</p>` : '',
    payload.projectType ? `<p><strong>Project Type:</strong> ${payload.projectType}</p>` : '',
    payload.serviceNeeded ? `<p><strong>Primary Service:</strong> ${payload.serviceNeeded}</p>` : '',
    payload.siteLocation ? `<p><strong>Site Location:</strong> ${payload.siteLocation}</p>` : '',
    payload.timeline ? `<p><strong>Timeline:</strong> ${payload.timeline}</p>` : '',
    `<p><strong>Message:</strong> ${payload.message}</p>`,
  ].filter(Boolean);

  return {
    text: lines.join('\n'),
    html: htmlRows.join(''),
  };
};

module.exports = {
  CONTACT_REQUIRED_FIELDS,
  normalizeContactPayload,
  validateContactPayload,
  buildContactEmailContent,
};
