import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faInfoCircle, 
  faCogs, 
  faHandshake, 
  faEye, 
  faHeart, 
  faShieldAlt, 
  faProjectDiagram, 
  faEnvelope,
  faBars,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import './Services.css';

const Services = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="container">
          <h1>Our Services</h1>
          <p>Comprehensive solutions for your construction and industrial needs</p>
        </div>
      </section>

      <section className="services-content">
        <div className="container">
          <div className="service-cards">
            <div className="service-card">
              <i className="fas fa-hard-hat"></i>
              <h3>Structural & Civil Works</h3>
              <p>Expert construction and development services for all your structural needs.</p>
            </div>
            <div className="service-card">
              <i className="fas fa-cogs"></i>
              <h3>MEPS Works</h3>
              <p>Mechanical, Electrical, Plumbing, and Fire Protection solutions.</p>
            </div>
            <div className="service-card">
              <i className="fas fa-wrench"></i>
              <h3>Fabrication & Industrial</h3>
              <p>Specialized in clean room and painting processes improvements.</p>
            </div>
            <div className="service-card">
              <i className="fas fa-users-cog"></i>
              <h3>Manpower Support</h3>
              <p>Technical support and manpower solutions for manufacturing plants.</p>
            </div>
            <div className="service-card">
              <i className="fas fa-tools"></i>
              <h3>Equipment Supply</h3>
              <p>Supply of industrial materials and equipment for your projects.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="footer-info">
        <div className="container">
          <div className="footer-item">
            <h2>Send Us a Message</h2>
            <p>If you have any questions or need a quote, feel free to contact us!</p>
            <a href="/contact" className="btn">Contact Us</a>
          </div>
          <div className="footer-item">
            <h2>Our Location</h2>
            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> 320 Sta Rosa Tagaytay Road Purok 4 Brgy. Pasong Langka, Silang Cavite 4118</p>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.93515605421877!2d120.9966971517091!3d14.16017202394409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd7b0053a0280d%3A0x99434f55287e9a94!2sRestaurant!5e1!3m2!1sen!2sph!4v1743742491118!5m2!1sen!2sph"
                width="400"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services; 