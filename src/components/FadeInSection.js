import React, { useEffect } from 'react';
import { useStaggeredFadeIn } from '../hooks/useStaggeredFadeIn';

const FadeInSection = ({ 
  children, 
  delay = 0, 
  className = '', 
  animationClass = 'fade-in',
  options = {} 
}) => {
  const [ref, isVisible, setStaggerDelay] = useStaggeredFadeIn(options);
  
  useEffect(() => {
    setStaggerDelay(delay);
  }, [delay, setStaggerDelay]);
  
  return (
    <div 
      ref={ref} 
      className={`${animationClass} ${isVisible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default FadeInSection; 