import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import './styles.css';

const Home = memo(() => {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';

  return (
    <PageLayout>
        <section className="hero" role="banner">
          <div className="hero-content">
            <h1>
              Welcome to MASTERTECH INTERGROUPPE INC.
            </h1>
            <p className="hero-subtitle">
              Your Trusted Partner in Construction and Industrial Solutions
            </p>
            <Link
              to="/contact"
              className="btn"
              aria-label="Contact us"
            >
              Get in Touch
            </Link>
          </div>
        </section>
        <section className="project-categories" role="main">
          <div className="container">
          <h2>Our Expertise</h2>
          <div className="categories-grid">
            <Link
              to="/projects#industrial"
              className="category-card fade-in"
            >
              <img
                src={`${IMAGE_BASE_URL}/uploads/industrial.jpg`}
                alt="Industrial Projects"
                loading="lazy"
              />
              <div className="category-overlay">
                <span>Industrial</span>
              </div>
            </Link>
            <Link
              to="/projects#residential"
              className="category-card fade-in"
            >
              <img
                src={`${IMAGE_BASE_URL}/uploads/residential.jpg`}
                alt="Residential Projects"
                loading="lazy"
              />
              <div className="category-overlay">
                <span>Residential</span>
              </div>
            </Link>
            <Link
              to="/projects#commercial"
              className="category-card fade-in"
            >
              <img
                src={`${IMAGE_BASE_URL}/uploads/commercial.jpg`}
                alt="Commercial Projects"
                loading="lazy"
              />
              <div className="category-overlay">
                <span>Commercial</span>
              </div>
            </Link>
            <Link
              to="/projects#renovation"
              className="category-card fade-in"
            >
              <img
                src={`${IMAGE_BASE_URL}/uploads/renovation.jpg`}
                alt="Renovation Projects"
                loading="lazy"
              />
              <div className="category-overlay">
                <span>Renovation</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section
        className="services"
        aria-labelledby="services-heading"
      >
        <h2 id="services-heading">Our Services</h2>
        <ul className="services-list">
          <li>
            <i className="fas fa-hard-hat"></i>
            <span>
              Structural, Civil, Site Development, and Architectural Works
            </span>
          </li>
          <li>
            <i className="fas fa-cogs"></i>
            <span>
              Mechanical, Electrical, Plumbing, and Fire Protection (MEPS) Works
            </span>
          </li>
          <li>
            <i className="fas fa-wrench"></i>
            <span>
              Fabrication & Industrial Plant Projects (Specialized in Clean Room
              & Painting Processes Improvements, Including Automation)
            </span>
          </li>
          <li>
            <i className="fas fa-users-cog"></i>
            <span>Manpower and Technical Support for Manufacturing Plants</span>
          </li>
          <li>
            <i className="fas fa-tools"></i>
            <span>Supply of Industrial Materials and Equipment</span>
          </li>
        </ul>
      </section>
    </PageLayout>
  );
});

export default Home;
