import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
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
  faMapMarkerAlt,
  faTools,
  faBuilding,
  faIndustry,
  faWrench,
  faTruck,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import './Services.css';

const Services = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Initialize AOS with enhanced settings
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      offset: 50,
      easing: 'ease-out-cubic',
      mirror: true,
      anchorPlacement: 'top-bottom'
    });
  }, []);

  const services = [
    {
      icon: faTools,
      title: "Equipment Installation",
      description: "Professional installation of industrial equipment and machinery with precision and expertise."
    },
    {
      icon: faBuilding,
      title: "Construction Services",
      description: "Complete construction solutions for industrial and commercial facilities."
    },
    {
      icon: faIndustry,
      title: "Industrial Maintenance",
      description: "Regular maintenance and repair services to keep your industrial equipment running smoothly."
    },
    {
      icon: faWrench,
      title: "Technical Support",
      description: "24/7 technical support and troubleshooting for all your industrial needs."
    },
    {
      icon: faTruck,
      title: "Logistics Services",
      description: "Efficient transportation and logistics solutions for your equipment and materials."
    },
    {
      icon: faClipboardCheck,
      title: "Quality Assurance",
      description: "Comprehensive quality control and assurance services for all projects."
    }
  ];

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
            <h1 
              data-aos="fade-down"
              data-aos-duration="1000"
              data-aos-easing="ease-out-cubic"
            >
              Our Services
            </h1>
            <div className="services-grid">
              {services.map((service, index) => (
                <div 
                  key={index} 
                  className="service-card"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay={index * 200}
                  data-aos-easing="ease-out-cubic"
                  data-aos-anchor-placement="top-bottom"
                >
                  <div 
                    className="service-icon"
                    data-aos="zoom-in"
                    data-aos-duration="600"
                    data-aos-delay={index * 200 + 300}
                  >
                    <FontAwesomeIcon icon={service.icon} />
                  </div>
                  <h3 
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-delay={index * 200 + 400}
                  >
                    {service.title}
                  </h3>
                  <p 
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-delay={index * 200 + 500}
                  >
                    {service.description}
                  </p>
                  <a 
                    href="/contact" 
                    className="btn"
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-delay={index * 200 + 600}
                  >
                    Learn More
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Info Section */}
        <section className="footer-info">
          <div className="container">
            <div 
              className="footer-item" 
              data-aos="fade-right"
              data-aos-duration="1000"
              data-aos-easing="ease-out-cubic"
              data-aos-anchor-placement="top-bottom"
            >
              <h2>Send Us a Message</h2>
              <p>If you have any questions or need a quote, feel free to contact us!</p>
              <a href="/contact" className="btn">Contact Us</a>
            </div>
            <div 
              className="footer-item" 
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-easing="ease-out-cubic"
              data-aos-anchor-placement="top-bottom"
            >
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
            <div 
              className="footer-item" 
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-easing="ease-out-cubic"
              data-aos-anchor-placement="top-bottom"
            >
              <h2>Certifications</h2>
              <div 
                className="certification" 
                style={{
                  backgroundColor: '#eee',
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '14px'
                }}
              >
                No Image Available
              </div>
              <div 
                className="certification" 
                style={{
                  backgroundColor: '#eee',
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '14px'
                }}
              >
                No Image Available
              </div>
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