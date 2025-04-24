import React, { useEffect, useRef } from 'react';

/**
 * Higher-order component that adds fade-in animations to all images
 * @param {React.ComponentType} WrappedComponent - The page component to wrap
 * @returns {React.ComponentType} - Wrapped component with image animations
 */
const withImageAnimations = (WrappedComponent) => {
  return (props) => {
    const pageRef = useRef(null);

    useEffect(() => {
      // Find all images
      const images = pageRef.current?.querySelectorAll('img, .image, .img, .photo, .gallery-img');
      
      if (images && images.length > 0) {
        // Apply stagger effect to images
        images.forEach((image, index) => {
          // Skip if already has animation
          if (image.classList.contains('fade-in-section')) return;
          
          // Create a wrapper for the image
          const wrapper = document.createElement('div');
          wrapper.className = 'fade-in-section fade-in-scale';
          
          // Add stagger effect
          wrapper.style.transitionDelay = `${index * 0.1}s`;
          
          // Wrap the image
          image.parentNode.insertBefore(wrapper, image);
          wrapper.appendChild(image);
          
          // Add intersection observer
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  wrapper.classList.add('is-visible');
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.1 }
          );
          
          observer.observe(wrapper);
        });
      }
    }, []);

    return (
      <div ref={pageRef}>
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default withImageAnimations; 