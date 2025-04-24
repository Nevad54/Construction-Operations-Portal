import React from 'react';
import FadeInSection from '../components/FadeInSection';

/**
 * Higher-order component that adds fade-in animation to any component
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @param {Object} options - Animation options
 * @param {string} options.direction - Animation direction ('up', 'down', 'left', 'right', 'scale')
 * @param {number} options.delay - Animation delay in seconds
 * @param {number} options.threshold - Intersection observer threshold (0-1)
 * @param {boolean} options.stagger - Whether to stagger child animations
 * @returns {React.ComponentType} - Wrapped component with fade-in animation
 */
const withFadeIn = (WrappedComponent, options = {}) => {
  const {
    direction = 'up',
    delay = 0,
    threshold = 0.1,
    stagger = false
  } = options;

  return (props) => (
    <FadeInSection
      direction={direction}
      delay={delay}
      threshold={threshold}
      stagger={stagger}
    >
      <WrappedComponent {...props} />
    </FadeInSection>
  );
};

export default withFadeIn; 