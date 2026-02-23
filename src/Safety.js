import React, { useEffect, memo } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PageLayout from './components/PageLayout';
import './styles.css';

const Safety = memo(() => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  return (
    <PageLayout>
      <section className="safety" role="main">
        <div className="container">
          <h1 data-aos="fade-up">Commitment to Safety</h1>
          <div className="safety-content" data-aos="fade-up" data-aos-delay="100">
            <p data-aos="fade-up" data-aos-delay="200">
              The management of Mastertech Intergrouppe Inc. (MTI, Mastertech) holds the highest regard for the health and safety of all employees, subcontractors, partners, and the general public. MTI is equally committed to environmental protection and will not compromise on this principle.
            </p>
            <p data-aos="fade-up" data-aos-delay="300">
              Therefore, it is Mastertech's fundamental responsibility to exercise due diligence and take all necessary precautions to prevent accidents and unsafe practices that could endanger employees, the public, the environment, or property. To uphold this commitment, the company will actively and continuously develop Safety, Health, and Environmental (SHE) standards aligned with its methodologies.
            </p>
            <p data-aos="fade-up" data-aos-delay="400">
              MTI will also ensure the employment of qualified safety personnel with the necessary authority and responsibility to implement and uphold these objectives. Furthermore, the company recognizes that an effective health and safety program significantly enhances operational efficiency.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
});

export default Safety;
