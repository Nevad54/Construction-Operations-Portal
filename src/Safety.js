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
              Our management holds the highest regard for the health and safety of employees, subcontractors, partners, and the public. We are equally committed to environmental protection and do not compromise on this principle.
            </p>
            <p data-aos="fade-up" data-aos-delay="300">
              We exercise due diligence and take all necessary precautions to prevent unsafe practices that could endanger people, property, or the environment. To uphold this commitment, we continuously strengthen our Safety, Health, and Environmental (SHE) standards.
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
