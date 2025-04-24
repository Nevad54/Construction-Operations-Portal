import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds text animations
 * @param {React.ComponentType} WrappedComponent - The component to wrap with animations
 * @returns {React.ComponentType} - Wrapped component with text animations
 */
const withTextAnimations = (WrappedComponent) => {
  const TextWrapper = (props) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return TextWrapper;
};

export default withTextAnimations; 