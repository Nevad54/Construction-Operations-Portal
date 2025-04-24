import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import FadeInOnScroll from './components/FadeInOnScroll';
import './styles.css';

const Contact = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';
  const IMAGE_BASE_URL = API_BASE_URL;
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
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

  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    console.log('Current path:', path);
    if (path === '/') return 'home';
    if (path === '/about') return 'about';
    if (path === '/services') return 'services';
    if (path === '/vision-mission') return 'vision-mission';
    if (path === '/core-values') return 'core-values';
    if (path === '/safety') return 'safety';
    if (path === '/projects') return 'projects';
    if (path === '/contact') return 'contact';
    return 'home';
  };
  const activePage = getActivePage();

  const handleOutsideClick = (event) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const isSmallScreen = window.innerWidth < 768;
    const isClickOutsideSidebar = sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target);
    const isClickInsideNavLinks = navLinks && navLinks.contains(event.target);

    if (isSmallScreen && isSidebarActive && isClickOutsideSidebar && !isClickInsideNavLinks) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768 && isSidebarActive) {
      setIsSidebarActive(false);
      setIsNavLinksActive(false);
    }
  };

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 200);
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSidebarActive]);

  const handleRecaptchaChange = (token) => {
    console.log('reCAPTCHA token received');
    setRecaptchaToken(token);
    setIsRecaptchaVerified(true);
    setErrors(prev => ({ ...prev, captcha: undefined }));
  };

  const handleRecaptchaExpired = () => {
    console.log('reCAPTCHA expired');
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    setErrors(prev => ({ ...prev, captcha: 'reCAPTCHA verification expired. Please verify again.' }));
  };

  const handleRecaptchaError = (err) => {
    console.error('reCAPTCHA error:', err);
    setIsRecaptchaVerified(false);
    setErrors(prev => ({
      ...prev,
      captcha: 'Error loading reCAPTCHA. Please refresh the page.'
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
        const response = await fetch(`${API_BASE_URL}/api/contact`, {
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
        setSubmitStatus({
            type: 'error',
            message: err.message || 'Failed to send message. Please try again.'
        });
        console.error('Contact form error:', err);
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

  useEffect(() => {
    // Initialize reCAPTCHA only once when component mounts
    const loadRecaptcha = () => {
      if (!RECAPTCHA_SITE_KEY) {
        console.error('reCAPTCHA site key is missing. Please check your environment variables.');
        return;
      }
      if (window.grecaptcha && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };

    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha && RECAPTCHA_SITE_KEY) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = loadRecaptcha;
      document.head.appendChild(script);
    } else {
      loadRecaptcha();
    }

    return () => {
      // Cleanup if needed
      if (window.grecaptcha && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, [RECAPTCHA_SITE_KEY]); // Add RECAPTCHA_SITE_KEY to dependencies

  return (
    <div>
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <section className="contact" role="main">
        <div className="container">
          <FadeInOnScroll>
            <h1>Contact Us</h1>
          </FadeInOnScroll>
          <div className="contact-content">
            <FadeInOnScroll delay={100}>
              <div className="contact-form">
                <h2>Send Us a Message</h2>
                {!RECAPTCHA_SITE_KEY && (
                  <div className="alert alert-error">
                    reCAPTCHA configuration is missing. Please contact the administrator.
                  </div>
                )}
                {submitStatus && (
                  <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {submitStatus.message}
                  </div>
                )}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? 'error' : ''}
                    />
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>
                  <div className="form-group">
                    {RECAPTCHA_SITE_KEY ? (
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleRecaptchaChange}
                        onExpired={handleRecaptchaExpired}
                        onError={handleRecaptchaError}
                      />
                    ) : null}
                    {errors.captcha && <span className="error-message">{errors.captcha}</span>}
                  </div>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isSubmitting || attemptsRemaining <= 0}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                  {attemptsRemaining <= 0 && (
                    <p className="attempts-message">
                      Maximum attempts reached. Please try again in {timeUntilReset} minutes.
                    </p>
                  )}
                </form>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={200}>
              <div className="contact-info">
                <h2>Get in Touch</h2>
                <div className="info-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <p>320 Sta Rosa Tagaytay Road Purok 4 Brgy. Pasong Langka, Silang Cavite 4118</p>
                </div>
                <div className="info-item">
                  <i className="fas fa-phone"></i>
                  <p>+63 912 345 6789</p>
                </div>
                <div className="info-item">
                  <i className="fas fa-envelope"></i>
                  <p>inquiry@mastertech.com.ph</p>
                </div>
                <div className="map-container">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="MASTERTECH Location Map"
                  ></iframe>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
      
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      >
        ↑
      </button>
      {/* Footer */}
      <footer role="contentinfo">
        <div className="container_footer">
          <p> 2025 MASTERTECH INTERGROUPPE INC. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;