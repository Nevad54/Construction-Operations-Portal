import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds button animations
 * @param {React.ComponentType} WrappedComponent - The component to wrap with animations
 * @returns {React.ComponentType} - Wrapped component with button animations
 */
const withButtonAnimations = (WrappedComponent) => {
  const ButtonWrapper = (props) => {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return ButtonWrapper;
};

export default withButtonAnimations; 