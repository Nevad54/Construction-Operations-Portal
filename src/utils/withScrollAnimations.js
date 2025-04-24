import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds scroll-triggered animations to components
 * @param {React.ComponentType} WrappedComponent - The component to wrap with scroll animations
 * @param {Object} options - Configuration options for the scroll animation
 * @param {string} options.direction - Animation direction ('up', 'down', 'left', 'right') (default: 'up')
 * @param {number} options.distance - Distance to animate in pixels (default: 50)
 * @param {number} options.duration - Animation duration in seconds (default: 0.5)
 * @param {number} options.delay - Delay before animation starts in seconds (default: 0)
 * @returns {React.ComponentType} - Wrapped component with scroll animations
 */
const withScrollAnimations = (WrappedComponent, options = {}) => {
  const {
    direction = 'up',
    distance = 50,
    duration = 0.5,
    delay = 0
  } = options;

  const getDirectionalOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return { y: distance };
    }
  };

  const ScrollWrapper = (props) => {
    const offset = getDirectionalOffset();
    
    const scrollVariants = {
      hidden: {
        ...offset,
        opacity: 0
      },
      visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: "easeOut"
        }
      }
    };

    return (
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return ScrollWrapper;
};

export default withScrollAnimations; 