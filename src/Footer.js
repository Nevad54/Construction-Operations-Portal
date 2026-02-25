import React from 'react';
import './styles.css';

const Footer = () => {
  return (
    <>
      <section className="footer-info" aria-label="Company contact details">
        <div className="container">
          <div className="footer-item">
            <h2>Send Us a Message</h2>
            <p>If you have any questions or need a quote, feel free to contact us!</p>
            <a href="mailto:inquiry@construction-ops.com" className="btn" aria-label="Send us an email">Email Us</a>
          </div>
          <div className="footer-item">
            <h2>Our Location</h2>
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
                title="Construction Office Location Map"
              ></iframe>
            </div>
          </div>
          <div className="footer-item">
            <h2>Certifications</h2>
            <img
              src="/Uploads/showcase1.png"
              alt="ISO 9001 Certification"
              className="certification"
              loading="lazy"
            />
            <img
              src="/Uploads/showcase2.png"
              alt="Safety Compliance Certification"
              className="certification"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <footer role="contentinfo">
        <div className="container_footer">
          <p>&copy; 2025 Construction Operations Group. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
