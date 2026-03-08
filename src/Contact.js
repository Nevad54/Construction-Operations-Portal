import React, { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PageLayout from './components/PageLayout';
import { trackEvent } from './utils/analytics';
import './styles.css';

const officeMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Imus+Cavite';

const projectTypeOptions = [
  'Industrial Retrofit',
  'Commercial Fit-Out',
  'Residential Renovation',
  'Site Development',
  'Plant Support',
];

const getFieldDescribedBy = (fieldErrorId, helperId, hasError) => {
  return hasError ? `${helperId} ${fieldErrorId}` : helperId;
};

const buildContactEndpoint = () => {
  const baseUrl = String(process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');
  if (!baseUrl) return '/api/contact';
  if (baseUrl.includes('netlify.app') || baseUrl.includes('netlify.com')) {
    return `${baseUrl}/.netlify/functions/api/contact`;
  }
  return `${baseUrl}/api/contact`;
};

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  projectType: '',
  message: '',
};

const isLocalDevelopmentHost = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

const Contact = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out',
    });
  }, []);

  const RECAPTCHA_SITE_KEY =
    process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6Ld6MSErAAAAALZQPgxDGLtC86B1JPq4STi-EURa';
  const isLocalRecaptchaBypass = process.env.NODE_ENV !== 'production' && isLocalDevelopmentHost();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const recaptchaRef = useRef(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(() => {
    const saved = localStorage.getItem('contactAttempts');
    const lastReset = localStorage.getItem('lastAttemptReset');
    const now = Date.now();

    if (lastReset && now - parseInt(lastReset, 10) > 3600000) {
      localStorage.setItem('contactAttempts', '3');
      localStorage.setItem('lastAttemptReset', now.toString());
      return 3;
    }

    return saved ? parseInt(saved, 10) : 3;
  });
  const [timeUntilReset, setTimeUntilReset] = useState(null);
  const canSubmit = !isSubmitting && timeUntilReset === null && isRecaptchaVerified;
  const submitButtonLabel = isSubmitting
    ? 'Submitting Inquiry...'
    : isLocalRecaptchaBypass && !isRecaptchaVerified
      ? 'Complete Verification to Submit'
      : 'Request Site Assessment';
  const localVerificationStatus = isRecaptchaVerified ? 'Verified' : 'Required';

  const handleRecaptchaChange = (token) => {
    if (!token) {
      setErrors((prev) => ({
        ...prev,
        captcha: 'reCAPTCHA verification failed. Please try again.',
        captchaDetails: undefined,
      }));
      setIsRecaptchaVerified(false);
      setRecaptchaToken('');
      return;
    }

    setRecaptchaToken(token);
    setIsRecaptchaVerified(true);
    setErrors((prev) => ({ ...prev, captcha: undefined, captchaDetails: undefined }));
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    setErrors((prev) => ({
      ...prev,
      captcha: 'reCAPTCHA verification expired. Please verify again.',
      captchaDetails: undefined,
    }));
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    setErrors((prev) => ({
      ...prev,
      captcha: 'Error loading reCAPTCHA. Please refresh the page and try again.',
      captchaDetails: undefined,
    }));
  };

  const handleLocalVerification = () => {
    setRecaptchaToken('local-dev-bypass-token');
    setIsRecaptchaVerified(true);
    setErrors((prev) => ({ ...prev, captcha: undefined, captchaDetails: undefined }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Email is invalid';
    }
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      nextErrors.phone = 'Phone number is invalid';
    }
    if (!formData.message.trim()) nextErrors.message = 'Message is required';
    if (!isRecaptchaVerified || !recaptchaToken) {
      nextErrors.captcha = 'Please complete the reCAPTCHA verification';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSubmitStatus(null);

    if (!validateForm()) return;

    if (attemptsRemaining <= 0) {
      setSubmitStatus({
        type: 'error',
        message: 'Maximum attempts reached. Please try again later.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      trackEvent('contact_submit', {
        formId: 'site_assessment',
        projectType: formData.projectType || 'not_specified',
        hasPhone: Boolean(formData.phone && formData.phone.trim()),
      });

      const response = await fetch(buildContactEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const timeLeftMatch = data.error && data.error.match(/\d+/);
          if (timeLeftMatch) {
            setTimeUntilReset(parseInt(timeLeftMatch[0], 10));
          }
          setSubmitStatus({ type: 'error', message: data.error });
          return;
        }

        if (response.status === 400 && data.fields) {
          const fieldErrors = { ...data.fields };
          if (fieldErrors.recaptchaToken) {
            fieldErrors.captcha = 'Please complete the reCAPTCHA verification';
            delete fieldErrors.recaptchaToken;
          }
          setErrors(fieldErrors);
        }

        if (response.status === 400 && data.error && data.error.includes('reCAPTCHA')) {
          setErrors((prev) => ({
            ...prev,
            captcha: 'reCAPTCHA verification failed. Please try again.',
            captchaDetails: data.details || [],
          }));
          if (recaptchaRef.current) {
            recaptchaRef.current.reset();
          }
          setRecaptchaToken('');
          setIsRecaptchaVerified(false);
        }

        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitStatus({
        type: 'success',
        message: data.message || 'Project inquiry received successfully.',
      });

      trackEvent('contact_success', {
        formId: 'site_assessment',
        projectType: formData.projectType || 'not_specified',
      });

      setFormData(initialFormData);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
      setIsRecaptchaVerified(false);
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      setTimeUntilReset(null);
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to send message. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('contactAttempts', attemptsRemaining.toString());
    if (attemptsRemaining === 3) {
      localStorage.setItem('lastAttemptReset', Date.now().toString());
    }
  }, [attemptsRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      const lastReset = localStorage.getItem('lastAttemptReset');
      if (!lastReset) return;

      const timeSinceReset = Date.now() - parseInt(lastReset, 10);
      if (timeSinceReset > 3600000) {
        setAttemptsRemaining(3);
        setTimeUntilReset(null);
        localStorage.setItem('contactAttempts', '3');
        localStorage.setItem('lastAttemptReset', Date.now().toString());
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY && !isLocalRecaptchaBypass) {
      setErrors((prev) => ({
        ...prev,
        captcha: 'reCAPTCHA configuration is missing. Please contact the administrator.',
      }));
    }
  }, [RECAPTCHA_SITE_KEY, isLocalRecaptchaBypass]);

  return (
    <PageLayout
      meta={{
        title: 'Contact | Construction Operations Portal',
        description: 'Request a site assessment for industrial, commercial, renovation, or residential work and get a clear next-step recommendation from the operations team.',
      }}
    >
      <section className="contact contact-page">
        <div className="container">
          <div className="contact-hero" data-aos="fade-up">
            <div className="contact-hero-copy">
              <p className="contact-kicker">Project Intake</p>
              <h1>Request a Site Assessment</h1>
              <p className="contact-intro">
                Leave your basic contact details and a short note about the work. We can sort the deeper project
                details in the follow-up instead of making the first step feel heavy.
              </p>
              <div className="contact-mini-points" aria-label="Response expectations">
                <span>Quick first contact</span>
                <span>Next-step recommendation</span>
                <span>Simple follow-up flow</span>
              </div>
            </div>
            <div className="contact-hero-aside">
              <div className="contact-aside-card">
                <strong>Best for</strong>
                <p>Industrial, commercial, renovation, and site-support work that needs disciplined coordination.</p>
              </div>
              <div className="contact-aside-card">
                <strong>Response target</strong>
                <p>Next-business-day follow-up after the intake review.</p>
              </div>
            </div>
          </div>

          <div className="contact-content contact-content--modern">
            <div className="contact-form contact-form--modern" data-aos="fade-right" data-aos-delay="80">
              <div className="contact-panel-header">
                <h2>Quick Inquiry</h2>
                <p>Start with the essentials. If the work is a fit, we will gather scope, site, and timing in the follow-up.</p>
              </div>

              {submitStatus && (
                <div
                  className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}
                  role="status"
                  aria-live="polite"
                >
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="contact-field-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={getFieldDescribedBy('name-error', 'name-help', Boolean(errors.name))}
                    />
                    <span id="name-help" className="sr-only">Enter the primary contact name for this inquiry.</span>
                    {errors.name && <span id="name-error" className="error" role="alert">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={getFieldDescribedBy('email-error', 'email-help', Boolean(errors.email))}
                    />
                    <span id="email-help" className="sr-only">Enter the best email address for follow-up.</span>
                    {errors.email && <span id="email-error" className="error" role="alert">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (123) 456-7890"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={getFieldDescribedBy('phone-error', 'phone-help', Boolean(errors.phone))}
                    />
                    <span id="phone-help" className="sr-only">Phone number is optional and should include the best callback number.</span>
                    {errors.phone && <span id="phone-error" className="error" role="alert">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="projectType">Project Type</label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      aria-describedby="projectType-help"
                    >
                      <option value="">Select project type (optional)</option>
                      {projectTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span id="projectType-help" className="sr-only">Choose the closest project type if it helps classify the inquiry.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Project Scope</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Describe the work, location, timing, or anything we should know."
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={getFieldDescribedBy('message-error', 'message-help', Boolean(errors.message))}
                  />
                  <span id="message-help" className="sr-only">Describe the work, location, timing, or the main delivery constraint.</span>
                  {errors.message && <span id="message-error" className="error" role="alert">{errors.message}</span>}
                </div>

                <div
                  className="form-group captcha-group"
                  aria-describedby="captcha-help"
                >
                  {isLocalRecaptchaBypass ? (
                    <div
                      className="recaptcha-container recaptcha-container--local"
                      data-testid="local-recaptcha-bypass"
                      aria-live="polite"
                    >
                      <div className="recaptcha-local-header">
                        <strong>Local development verification</strong>
                        <span
                          className={`recaptcha-local-pill ${
                            isRecaptchaVerified ? 'recaptcha-local-pill--verified' : 'recaptcha-local-pill--pending'
                          }`}
                        >
                          {localVerificationStatus}
                        </span>
                      </div>
                      <p className="recaptcha-local-copy">
                        {isRecaptchaVerified
                          ? 'Verification is complete. The inquiry can be submitted from this local session now.'
                          : 'Use the local verification step to unlock submit on localhost without depending on a Google site key.'}
                      </p>
                      <p className="recaptcha-local-note">
                        This path is only active for local development on `3001/3002` and `3101/3102`.
                      </p>
                      <button
                        type="button"
                        className={`btn btn-secondary recaptcha-local-button ${
                          isRecaptchaVerified ? 'recaptcha-local-button--verified' : ''
                        }`}
                        onClick={handleLocalVerification}
                        disabled={isSubmitting || isRecaptchaVerified}
                      >
                        {isRecaptchaVerified ? 'Local Verification Complete' : 'Enable Local Verification'}
                      </button>
                    </div>
                  ) : (
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={handleRecaptchaChange}
                      onExpired={handleRecaptchaExpired}
                      onErrored={handleRecaptchaError}
                      className="recaptcha-container"
                    />
                  )}
                  <span id="captcha-help" className="sr-only">Verification is required before the inquiry can be submitted.</span>
                  {errors.captcha && (
                    <div className="error" role="alert">
                      {errors.captcha}
                      {errors.captchaDetails && <small>Error details: {errors.captchaDetails.join(', ')}</small>}
                    </div>
                  )}
                </div>

                <div className="attempts-info" aria-live="polite">
                  {timeUntilReset ? (
                    <p className="error">Please wait {timeUntilReset} minutes before trying again.</p>
                  ) : isLocalRecaptchaBypass && isRecaptchaVerified ? (
                    <p className="attempts-info-status attempts-info-status--ready">
                      Verification complete. Attempts remaining: {attemptsRemaining}
                    </p>
                  ) : isLocalRecaptchaBypass ? (
                    <p className="attempts-info-status">
                      Complete local verification to enable submit. Attempts remaining: {attemptsRemaining}
                    </p>
                  ) : (
                    <p className="attempts-info-status">Attempts remaining: {attemptsRemaining}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn contact-submit-btn ${canSubmit ? 'contact-submit-btn--ready' : 'contact-submit-btn--locked'}`}
                  disabled={!canSubmit}
                >
                  {submitButtonLabel}
                </button>
              </form>
            </div>

            <div className="contact-info contact-info--modern" data-aos="fade-left" data-aos-delay="120">
              <div className="contact-info-card">
                <h2>What happens next</h2>
                <div className="trust-list" aria-label="Contact intake standards">
                  <div className="trust-item">
                    <strong>Qualification First</strong>
                    <span>We review scope, site, and timing before recommending the next conversation.</span>
                  </div>
                  <div className="trust-item">
                    <strong>Clear Ownership</strong>
                    <span>The intake goes into the same operations workflow used for follow-up and delivery visibility.</span>
                  </div>
                  <div className="trust-item">
                    <strong>Site-Ready Briefing</strong>
                    <span>Useful submissions include location, timeline, and the main execution constraint.</span>
                  </div>
                </div>
              </div>

              <div className="location-card contact-location-card">
                <p className="footer-kicker">Office and Coverage</p>
                <h2>Imus, Cavite</h2>
                <p className="footer-location-line">
                  245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123
                </p>
                <div className="location-meta">
                  <div className="location-meta-item">
                    <strong>Office Hours</strong>
                    <span>Monday to Friday, 9:00 AM to 6:00 PM. Saturday, 9:00 AM to 1:00 PM.</span>
                  </div>
                  <div className="location-meta-item">
                    <strong>Coverage</strong>
                    <span>Facilities, commercial, industrial, and renovation support across our core service area.</span>
                  </div>
                  <div className="location-meta-item">
                    <strong>Direct Line</strong>
                    <span><a href="tel:+63467001842">(046) 700 1842</a> / <a href="tel:+639185021436">0918 502 1436</a></span>
                  </div>
                </div>
                <a className="btn btn-secondary" href={officeMapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
