import React, { useEffect } from 'react';
import PageLayout from './components/PageLayout';
import './styles.css';

const Services = () => {
  useEffect(() => {
    // no-op
  }, []);

  const services = [
    { title: 'General Contracting', description: 'End-to-end execution for civil, architectural, and industrial projects.' },
    { title: 'Design-Build', description: 'Integrated engineering and construction delivery through a single accountable team.' },
    { title: 'MEPF Works', description: 'Mechanical, electrical, plumbing, and fire protection systems built for reliability.' },
    { title: 'Industrial Fabrication', description: 'Custom fabrication and process-line improvements for manufacturing environments.' },
    { title: 'Plant Maintenance Support', description: 'Skilled manpower and technical support to keep operations stable and safe.' },
    { title: 'Technical Consulting', description: 'Practical advisory support for planning, phasing, procurement, and execution risks.' },
  ];

  return (
    <PageLayout>
      {/* Services Section */}
      <section className="services">
        <div className="container">
          <h1>Our Services</h1>
          <p className="services-intro">
            We deliver practical, high-accountability solutions across construction and industrial operations.
          </p>
          <div className="service-list">
            {services.map((service, index) => (
              <div key={index} className="service-item">
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Services;
