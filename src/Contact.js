import React, { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import PageLayout from './components/PageLayout';
import './styles.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Contact = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';
  // Use environment variable for reCAPTCHA site key with fallback
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6Ld6MSErAAAAALZQPgxDGLtC86B1JPq4STi-EURa';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(() => {
    const saved = localStorage.getItem('contactAttempts');
    const lastReset = localStorage.getItem('lastAttemptReset');
    const now = Date.now();
    
    // Reset attempts if it's been more than an hour
    if (lastReset && (now - parseInt(lastReset)) > 3600000) {
      localStorage.setItem('contactAttempts', '3');
      localStorage.setItem('lastAttemptReset', now.toString());
      return 3;
    }
    
    return saved ? parseInt(saved) : 3;
  });
  const [timeUntilReset, setTimeUntilReset] = useState(null);



  const handleRecaptchaChange = (token) => {
    if (!token) {
      setErrors(prev => ({ ...prev, captcha: 'reCAPTCHA verification failed. Please try again.' }));
      setIsRecaptchaVerified(false);
      setRecaptchaToken('');
      return;
    }
    setRecaptchaToken(token);
    setIsRecaptchaVerified(true);
    setErrors(prev => ({ ...prev, captcha: undefined }));
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    setErrors(prev => ({ ...prev, captcha: 'reCAPTCHA verification expired. Please verify again.' }));
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleRecaptchaError = (err) => {
    console.error('reCAPTCHA error:', err);
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    setErrors(prev => ({
      ...prev,
      captcha: 'Error loading reCAPTCHA. Please refresh the page and try again.'
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!isRecaptchaVerified || !recaptchaToken) {
      newErrors.captcha = 'Please complete the reCAPTCHA verification';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitStatus(null);

    if (!validateForm()) {
      return;
    }

    if (attemptsRemaining <= 0) {
      setSubmitStatus({
        type: 'error',
        message: 'Maximum attempts reached. Please try again later.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/.netlify/functions/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const timeLeft = parseInt(data.error.match(/\d+/)[0]);
          setTimeUntilReset(timeLeft);
          setSubmitStatus({
            type: 'error',
            message: data.error
          });
          return;
        }
        
        if (response.status === 400 && data.error && data.error.includes('reCAPTCHA')) {
          setErrors(prev => ({
            ...prev,
            captcha: 'reCAPTCHA verification failed. Please try again.',
            captchaDetails: data.details || []
          }));
          if (recaptchaRef.current) {
            recaptchaRef.current.reset();
          }
          setRecaptchaToken('');
          setIsRecaptchaVerified(false);
          throw new Error('reCAPTCHA verification failed. Please try again.');
        }
        
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitStatus({
        type: 'success',
        message: data.message || 'Message sent successfully!'
      });
      
      // Reset form and reCAPTCHA only on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
      setIsRecaptchaVerified(false);
      setAttemptsRemaining(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to send message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update localStorage when attempts change
  useEffect(() => {
    localStorage.setItem('contactAttempts', attemptsRemaining.toString());
    if (attemptsRemaining === 3) {
      localStorage.setItem('lastAttemptReset', Date.now().toString());
    }
  }, [attemptsRemaining]);

  // Check for attempts reset every minute
  useEffect(() => {
    const checkReset = () => {
      const lastReset = localStorage.getItem('lastAttemptReset');
      if (lastReset) {
        const timeSinceReset = Date.now() - parseInt(lastReset);
        if (timeSinceReset > 3600000) { // 1 hour in milliseconds
          setAttemptsRemaining(3);
          localStorage.setItem('contactAttempts', '3');
          localStorage.setItem('lastAttemptReset', Date.now().toString());
        }
      }
    };

    const interval = setInterval(checkReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Add error handling for missing reCAPTCHA key
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error('reCAPTCHA site key is missing. Please check your environment variables.');
      setErrors(prev => ({
        ...prev,
        captcha: 'reCAPTCHA configuration is missing. Please contact the administrator.'
      }));
    }
  }, [RECAPTCHA_SITE_KEY]);

  return (
    <PageLayout>
      <section className="contact">
        <div className="container">
          <h1 data-aos="fade-up">Contact Us</h1>
          <p className="contact-intro" data-aos="fade-up" data-aos-delay="50">
            Tell us what you need. Our team will review and respond with next steps.
          </p>
          <div className="contact-content">
            <div className="contact-form" data-aos="fade-right" data-aos-delay="100">
              <h2>Send Us a Message</h2>
              {submitStatus && (
                <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-error'}`} data-aos="fade-up">
                  {submitStatus.message}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group" data-aos="fade-up" data-aos-delay="200">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby="name-error"
                    disabled={isSubmitting}
                  />
                  {errors.name && <span id="name-error" className="error">{errors.name}</span>}
                </div>
                <div className="form-group" data-aos="fade-up" data-aos-delay="300">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby="email-error"
                    disabled={isSubmitting}
                  />
                  {errors.email && <span id="email-error" className="error">{errors.email}</span>}
                </div>
                <div className="form-group" data-aos="fade-up" data-aos-delay="400">
                  <label htmlFor="phone">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (123) 456-7890"
                    aria-describedby="phone-error"
                    disabled={isSubmitting}
                  />
                  {errors.phone && <span id="phone-error" className="error">{errors.phone}</span>}
                </div>
                <div className="form-group" data-aos="fade-up" data-aos-delay="500">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    aria-required="true"
                    aria-describedby="message-error"
                    disabled={isSubmitting}
                  ></textarea>
                  {errors.message && <span id="message-error" className="error">{errors.message}</span>}
                </div>
                
                <div className="form-group captcha-group" data-aos="fade-up" data-aos-delay="600">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleRecaptchaChange}
                        onExpired={handleRecaptchaExpired}
                        onErrored={handleRecaptchaError}
                    className="recaptcha-container"
                  />
                  {errors.captcha && (
                    <div className="error" role="alert">
                      {errors.captcha}
                      {errors.captchaDetails && (
                        <small>Error details: {errors.captchaDetails.join(', ')}</small>
                      )}
                    </div>
                  )}
                </div>

                {timeUntilReset ? (
                  <div className="attempts-info" data-aos="fade-up" data-aos-delay="700">
                    <p className="error">Please wait {timeUntilReset} minutes before trying again.</p>
                  </div>
                ) : (
                  <div className="attempts-info" data-aos="fade-up" data-aos-delay="700">
                    <p>Attempts remaining: {attemptsRemaining}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSubmitting || timeUntilReset !== null || !isRecaptchaVerified}
                  data-aos="fade-up" 
                  data-aos-delay="800"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
            <div className="contact-info" data-aos="fade-left" data-aos-delay="100">
              <h2>Contact Information</h2>
              <div className="info-group" data-aos="fade-up" data-aos-delay="200">
                <h3><i className="fas fa-building"></i> Office Address</h3>
                <p>320 Sta Rosa Tagaytay Road Purok 4,<br />Brgy. Pasong Langka,<br />Silang Cavite 4118</p>
              </div>
              <div className="info-group" data-aos="fade-up" data-aos-delay="300">
                <h3><i className="fas fa-clock"></i> Office Hours</h3>
                <p>Monday - Friday: 8:00 AM - 5:00 PM<br />Saturday: 8:00 AM - 12:00 PM<br />Sunday: Closed</p>
              </div>
              <div className="info-group" data-aos="fade-up" data-aos-delay="400">
                <h3><i className="fas fa-phone-alt"></i> Phone & Email</h3>
                <p>
                  <a href="tel:+63465139424">(046) 513 9424</a><br />
                  <a href="tel:+639669369678">0966 936 9678 - Melissa</a><br />
                  <a href="tel:+639171668344">0917 166 8344 - Marlon</a><br />
                  <a href="tel:+639178214720">0917 821 4720 - Gemma</a><br />
                  <a href="mailto:inquiry@construction-ops.com">inquiry@construction-ops.com</a>
                </p>
              </div>
              <div className="map-container" data-aos="fade-up" data-aos-delay="500">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location Map"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
