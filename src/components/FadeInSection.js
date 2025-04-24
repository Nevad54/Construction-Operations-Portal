import React, { useState, useEffect, useRef } from 'react';

const FadeInSection = ({ 
  children, 
  delay = 0, 
  direction = 'up', 
  threshold = 0.1,
  stagger = false,
  className = ''
}) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Unobserve after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });

    const { current } = domRef;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [threshold]);

  const getDirectionClass = () => {
    switch (direction) {
      case 'left': return 'fade-in-left';
      case 'right': return 'fade-in-right';
      case 'up': return 'fade-in-up';
      case 'down': return 'fade-in-down';
      case 'scale': return 'fade-in-scale';
      default: return 'fade-in-up';
    }
  };

  const baseClasses = 'fade-in-section';
  const directionClass = getDirectionClass();
  const staggerClass = stagger ? 'stagger-children' : '';
  const visibilityClass = isVisible ? 'is-visible' : '';
  
  const style = {
    transitionDelay: `${delay}s`
  };

  return (
    <div 
      ref={domRef}
      className={`${baseClasses} ${directionClass} ${staggerClass} ${visibilityClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default FadeInSection; 