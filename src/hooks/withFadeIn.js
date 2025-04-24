import React from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

const withFadeIn = (WrappedComponent, options = {}) => {
  return (props) => {
    const [ref, isVisible] = useIntersectionObserver(options);
    
    return (
      <div 
        ref={ref} 
        className={`fade-in ${isVisible ? 'visible' : ''}`}
      >
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default withFadeIn; 