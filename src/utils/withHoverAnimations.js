import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds hover animations to components
 * @param {React.ComponentType} WrappedComponent - The component to wrap with hover animations
 * @param {Object} options - Configuration options for the hover animation
 * @param {number} options.scale - Scale factor on hover (default: 1.05)
 * @param {number} options.duration - Animation duration in seconds (default: 0.3)
 * @returns {React.ComponentType} - Wrapped component with hover animations
 */
const withHoverAnimations = (WrappedComponent, options = {}) => {
  const {
    scale = 1.05,
    duration = 0.3
  } = options;

  const HoverWrapper = (props) => {
    const hoverVariants = {
      initial: { scale: 1 },
      hover: {
        scale,
        transition: {
          duration,
          ease: "easeOut"
        }
      }
    };

    return (
      <motion.div
        variants={hoverVariants}
        initial="initial"
        whileHover="hover"
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return HoverWrapper;
};

export default withHoverAnimations; 