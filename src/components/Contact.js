import React from 'react';

const Contact = () => {
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="hero-content" data-aos="fade-up">
          <h1>Contact Us</h1>
          <p>Get in Touch with Our Team</p>
        </div>
      </section>

      <section className="contact-info">
        <div className="container">
          <div className="info-grid">
            <div className="info-card" data-aos="fade-up" data-aos-delay="100">
              <div className="icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Our Location</h3>
              <p>123 Engineering Street, Suite 100</p>
              <p>New York, NY 10001</p>
            </div>

            <div className="info-card" data-aos="fade-up" data-aos-delay="200">
              <div className="icon">
                <i className="fas fa-phone"></i>
              </div>
              <h3>Phone Number</h3>
              <p>+1 (555) 123-4567</p>
              <p>Mon - Fri, 9:00 AM - 5:00 PM</p>
            </div>

            <div className="info-card" data-aos="fade-up" data-aos-delay="300">
              <div className="icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Address</h3>
              <p>info@mastertech.com</p>
              <p>support@mastertech.com</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-form-section">
        <div className="container">
          <div className="form-container" data-aos="fade-up">
            <h2>Send Us a Message</h2>
            <form className="contact-form">
              <div className="form-group" data-aos="fade-right" data-aos-delay="100">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" required />
              </div>

              <div className="form-group" data-aos="fade-left" data-aos-delay="200">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className="form-group" data-aos="fade-right" data-aos-delay="300">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" />
              </div>

              <div className="form-group" data-aos="fade-left" data-aos-delay="400">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" required />
              </div>

              <div className="form-group" data-aos="fade-up" data-aos-delay="500">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>

              <div className="form-group" data-aos="fade-up" data-aos-delay="600">
                <div className="g-recaptcha" data-sitekey="your-site-key"></div>
              </div>

              <button type="submit" className="btn" data-aos="zoom-in" data-aos-delay="700">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="container" data-aos="fade-up">
          <h2>Find Us on the Map</h2>
          <div className="map-container">
            {/* Add your map embed code here */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2155710122!2d-73.9878448!3d40.7484405!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1645555555555!5m2!1sen!2sus"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact; 