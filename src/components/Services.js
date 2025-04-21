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
    <div className="services-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <ul>
          <li><a href="/"><FontAwesomeIcon icon={faHome} /> Home</a></li>
          <li><a href="/about"><FontAwesomeIcon icon={faInfoCircle} /> About</a></li>
          <li><a href="/services"><FontAwesomeIcon icon={faCogs} /> Services</a></li>
          <li className="dropdown">
            <a href="#"><FontAwesomeIcon icon={faHandshake} /> Commitment</a>
            <div className="dropdown-content">
              <a href="/vision-mission"><FontAwesomeIcon icon={faEye} /> Vision & Mission</a>
              <a href="/core-values"><FontAwesomeIcon icon={faHeart} /> Core Values</a>
              <a href="/safety"><FontAwesomeIcon icon={faShieldAlt} /> Safety</a>
            </div>
          </li>
          <li><a href="/projects"><FontAwesomeIcon icon={faProjectDiagram} /> Projects</a></li>
          <li><a href="/contact"><FontAwesomeIcon icon={faEnvelope} /> Contact</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header>
          <div className="container">
            <button className="hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <img src="/Uploads/logo.png" alt="MASTERTECH Logo" className="logo" />
            <nav>
              <ul className="nav-links">
                <li><a href="/"><FontAwesomeIcon icon={faHome} /> Home</a></li>
                <li><a href="/about"><FontAwesomeIcon icon={faInfoCircle} /> About</a></li>
                <li><a href="/services"><FontAwesomeIcon icon={faCogs} /> Services</a></li>
                <li className="dropdown">
                  <a href="#"><FontAwesomeIcon icon={faHandshake} /> Commitment</a>
                  <div className="dropdown-content">
                    <a href="/vision-mission"><FontAwesomeIcon icon={faEye} /> Vision & Mission</a>
                    <a href="/core-values"><FontAwesomeIcon icon={faHeart} /> Core Values</a>
                    <a href="/safety"><FontAwesomeIcon icon={faShieldAlt} /> Safety</a>
                  </div>
                </li>
                <li><a href="/projects"><FontAwesomeIcon icon={faProjectDiagram} /> Projects</a></li>
                <li><a href="/contact"><FontAwesomeIcon icon={faEnvelope} /> Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <section className="services">
          <div className="container">
            <h1>Our Services</h1>
            {/* Add your services content here */}
          </div>
        </section>

        {/* Footer */}
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
            <div className="footer-item">
              <h2>Certifications</h2>
              <img src="/Uploads/certification1.jpg" alt="ISO 9001 Certification" className="certification" />
              <img src="/Uploads/certification2.jpg" alt="Safety Compliance Certification" className="certification" />
            </div>
          </div>
        </section>

        <footer>
          <div className="container_footer">
            <p>© 2025 MASTERTECH INTERGROUPPE INC. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Services; 