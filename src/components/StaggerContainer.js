import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const StaggerContainer = ({ 
  children, 
  className = '', 
  options = {},
  staggerDelay = 100 // Default delay between items in milliseconds
}) => {
  const [ref, isVisible] = useIntersectionObserver(options);
  
  // Clone children and add transition delay based on index
  const childrenWithDelay = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        style: {
          ...child.props.style,
          transitionDelay: isVisible ? `${index * staggerDelay}ms` : '0ms'
        }
      });
    }
    return child;
  });
  
  return (
    <div 
      ref={ref} 
      className={`stagger-container ${isVisible ? 'visible' : ''} ${className}`}
    >
      {childrenWithDelay}
    </div>
  );
};

export default StaggerContainer; 