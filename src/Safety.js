import React, { memo } from 'react';
import PageLayout from './components/PageLayout';
import './styles.css';

const pillars = [
  {
    kicker: 'Control',
    title: 'Risk Prevention',
    desc: 'Unsafe practices are addressed early through planning, supervision, and visible accountability.',
  },
  {
    kicker: 'Oversight',
    title: 'Qualified Safety Leadership',
    desc: 'Safety personnel are positioned with the authority and responsibility to uphold standards in the field.',
  },
  {
    kicker: 'Performance',
    title: 'Operational Efficiency',
    desc: 'Effective safety programs reinforce quality execution, steadier workflows, and better project control.',
  },
];

const Safety = memo(() => {
  return (
    <PageLayout
      meta={{
        title: 'Safety | Construction Operations Portal',
        description: 'Review the safety commitment, risk prevention approach, and qualified oversight standards behind Construction Operations Portal delivery work.',
      }}
    >
      <section className="safety" aria-labelledby="safety-heading">
        <div className="container">

          {/* Hero */}
          <div className="commitment-hero">
            <div className="commitment-hero-copy">
              <p className="commitment-kicker">Commitment</p>
              <h1 id="safety-heading">Commitment to Safety</h1>
              <p className="commitment-intro">
                Safety is an operating requirement, not just a compliance statement.
              </p>
            </div>
            <div className="commitment-hero-side">
              <div className="commitment-stat">
                <strong>People first</strong>
                <span>Employees, partners, and the public are all inside the safety perimeter.</span>
              </div>
              <div className="commitment-stat">
                <strong>Execution discipline</strong>
                <span>Safe delivery improves consistency and operational efficiency.</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="safety-content commitment-card">
            <p>We prioritize the health and safety of employees, subcontractors, partners, and the public.</p>
            <p>We work to prevent unsafe practices that could endanger people, property, or the environment.</p>
            <p>Qualified safety personnel are given the authority to uphold these standards on site.</p>
          </div>

          {/* Pillars */}
          <div className="safety-pillars">
            {pillars.map((p) => (
              <div key={p.title} className="commitment-card">
                <p className="commitment-card-kicker">{p.kicker}</p>
                <h2>{p.title}</h2>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </PageLayout>
  );
});

export default Safety;
