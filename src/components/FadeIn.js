import React from 'react';
import useFadeIn from '../hooks/useFadeIn';
import './FadeIn.css';

const FadeIn = ({ children, delay = 0, duration = 0.5, direction = 'up' }) => {
  const [ref, isVisible] = useFadeIn();

  return (
    <div
      ref={ref}
      className={`fade-in ${direction} ${isVisible ? 'visible' : ''}`}
      style={{
        '--delay': `${delay}s`,
        '--duration': `${duration}s`
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn; 