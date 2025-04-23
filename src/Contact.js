import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Contact = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';
  const IMAGE_BASE_URL = API_BASE_URL;
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);


  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    console.log('Current path:', path); // Debug log
    if (path === '/') return 'home';
    if (path === '/pages/about') return 'about';
    if (path === '/pages/services') return 'services';
    if (path === '/pages/vision-mission') return 'vision-mission';
    if (path === '/pages/core-values') return 'core-values';
    if (path === '/pages/safety') return 'safety';
    if (path === '/pages/projects') return 'projects';
    if (path === '/pages/contact') return 'contact';
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
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitStatus(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact`, { credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          setSubmitStatus({ type: 'success', message: 'Thank you for your message! We will get back to you soon.' });
          setFormData({ name: '', email: '', message: '' });
          setErrors({});
        } else {
          setSubmitStatus({ 
            type: 'error', 
            message: data.error || 'Failed to send message. Please try again.'
          });
          if (response.status === 429) {
            // Rate limit reached, disable form temporarily
            setIsSubmitting(true);
          }
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setSubmitStatus({ 
          type: 'error', 
          message: 'Network error. Please check your connection and try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(formErrors);
    }
  };

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
          <h1>Contact Us</h1>
          <div className="contact-content">
            <div className="contact-form">
              <h2>Send Us a Message</h2>
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
                    aria-required="true"
                    aria-describedby="name-error"
                    disabled={isSubmitting}
                  />
                  {errors.name && <span id="name-error" className="error">{errors.name}</span>}
                </div>
                <div className="form-group">
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
                <div className="form-group">
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

                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
            <div className="contact-info">
              <h2>Contact Information</h2>
              <div className="info-group">
                <h3><i className="fas fa-building"></i> Office Address</h3>
                <p>320 Sta Rosa Tagaytay Road Purok 4,<br />Brgy. Pasong Langka,<br />Silang Cavite 4118</p>
              </div>
              <div className="info-group">
                <h3><i className="fas fa-clock"></i> Office Hours</h3>
                <p>Monday - Friday: 8:00 AM - 5:00 PM<br />Saturday: 8:00 AM - 12:00 PM<br />Sunday: Closed</p>
              </div>
              <div className="info-group">
                <h3><i className="fas fa-phone-alt"></i> Phone & Email</h3>
                <p>
                  <a href="tel:+63465139424">(046) 513 9424</a><br />
                  <a href="tel:+639669369678">0966 936 9678 - Melissa</a><br />
                  <a href="tel:+639171668344">0917 166 8344 - Marlon</a><br />
                  <a href="tel:+639178214720">0917 821 4720 - Gemma</a><br />
                  <a href="mailto:inquiry@mastertech.com.ph">inquiry@mastertech.com.ph</a>
                </p>
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
                  title="Office Location Map"
                ></iframe>
              </div>
            </div>
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