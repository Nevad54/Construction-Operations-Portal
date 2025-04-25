import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './styles.css';

const Footer = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  const placeholderStyle = {
    backgroundColor: '#eee',
    width: '100%',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '14px'
  };

  return (
    <>
      {/* Footer Info Section */}
      <section className="footer-info" role="contentinfo">
        <div className="container">
          <div className="footer-item" data-aos="fade-right" data-aos-delay="100">
            <h2>Send Us a Message</h2>
            <p>If you have any questions or need a quote, feel free to contact us!</p>
            <a href="mailto:inquiry@mastertech.com.ph" className="btn" aria-label="Send us an email">Email Us</a>
          </div>
          <div className="footer-item" data-aos="fade-up" data-aos-delay="200">
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
                title="MASTERTECH Location Map"
              ></iframe>
            </div>
          </div>
          <div className="footer-item" data-aos="fade-left" data-aos-delay="300">
            <h2>Certifications</h2>
            <div 
              className="certification" 
              style={placeholderStyle}
              data-aos="fade-up"
              data-aos-delay="400"
            >
              No Image Available
            </div>
            <div 
              className="certification" 
              style={placeholderStyle}
              data-aos="fade-up"
              data-aos-delay="500"
            >
              No Image Available
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" data-aos="fade-up" data-aos-delay="600">
        <div className="container_footer">
          <p>© 2025 MASTERTECH INTERGROUPPE INC. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;