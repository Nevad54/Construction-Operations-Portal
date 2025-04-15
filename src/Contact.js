import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Contact = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length === 0) {
      console.log('Form submitted:', formData);
      alert('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
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
            <div className="contact-form fade-in">
              <h2>Get in Touch</h2>
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
                  ></textarea>
                  {errors.message && <span id="message-error" className="error">{errors.message}</span>}
                </div>
                <button type="submit" className="btn" aria-label="Send message">Send Message</button>
              </form>
            </div>
            <div className="contact-info fade-in">
              <h2>Contact Information</h2>
              <p><i className="fas fa-phone-alt"></i> <a href="tel:+639123456789">+63 912 345 6789</a></p>
              <p><i className="fas fa-envelope"></i> <a href="mailto:inquiry@mastertech.com.ph">inquiry@mastertech.com.ph</a></p>
              <p><i className="fas fa-map-marker-alt"></i> 320 Sta Rosa Tagaytay Road Purok 4 Brgy. Pasong Langka, Silang Cavite 4118</p>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                  width="400"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="MASTERTECH Location Map"
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
          <p>© 2025 MASTERTECH INTERGROUPPE INC. All Rights Reserved.</p>
        </div>
      </footer>
    </div>

    
  );
};

export default Contact;