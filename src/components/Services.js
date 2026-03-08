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

const officeMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Imus+Cavite';
const officeMapEmbedUrl = 'https://maps.google.com/maps?q=Imus%20Cavite&z=15&output=embed';

const Services = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Initialize AOS with fresh settings
  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: false,
      offset: 100,
      easing: 'ease-out-back',
      mirror: true,
      anchorPlacement: 'top-center'
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
            <img src="/assets/logo.svg" alt="Construction Operations Portal mark" className="logo" />
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
              data-aos="zoom-in"
              data-aos-duration="1000"
              data-aos-easing="ease-out-back"
            >
              Our Services
            </h1>
            <div className="services-grid">
              {services.map((service, index) => (
                <div 
                  key={index} 
                  className="service-card"
                  data-aos="flip-left"
                  data-aos-duration="1000"
                  data-aos-delay={index * 200}
                  data-aos-easing="ease-out-back"
                >
                  <div 
                    className="service-icon"
                    data-aos="zoom-in"
                    data-aos-duration="800"
                    data-aos-delay={index * 200 + 400}
                  >
                    <FontAwesomeIcon icon={service.icon} />
                  </div>
                  <h3 
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay={index * 200 + 600}
                  >
                    {service.title}
                  </h3>
                  <p 
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay={index * 200 + 800}
                  >
                    {service.description}
                  </p>
                  <a 
                    href="/contact" 
                    className="btn"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay={index * 200 + 1000}
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
              data-aos-easing="ease-out-back"
            >
              <h2>Send Us a Message</h2>
              <p>If you have any questions or need a quote, feel free to contact us!</p>
              <a href="/contact" className="btn">Contact Us</a>
            </div>
            <div 
              className="footer-item" 
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-easing="ease-out-back"
            >
              <h2>Our Location</h2>
              <p><FontAwesomeIcon icon={faMapMarkerAlt} /> 245 Horizon Service Road, Brgy. San Miguel Norte, Westfield Cavite 4123</p>
              <div className="location-card">
                <div className="map-container">
                  <iframe
                    src={officeMapEmbedUrl}
                    width="400"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Placeholder Office Location Map"
                  ></iframe>
                </div>
                <p>Placeholder map preview for portfolio use.</p>
                <a className="btn btn-secondary" href={officeMapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </div>
            </div>
            <div 
              className="footer-item" 
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-easing="ease-out-back"
            >
              <h2>Operations Standards</h2>
              <div className="trust-item">
                <strong>Project Controls</strong>
                <span>Scope tracking, progress visibility, and scheduled site coordination.</span>
              </div>
              <div className="trust-item">
                <strong>Safety Records</strong>
                <span>Placeholder block for permits, checklists, and compliance documentation.</span>
              </div>
              <div className="trust-item">
                <strong>Client Updates</strong>
                <span>Structured reporting for milestones, issues, and closeout handoff.</span>
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div className="container_footer">
            <p>© 2025 Construction Operations Portal. All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Services; 

