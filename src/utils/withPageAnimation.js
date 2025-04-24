import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds page transition animations
 * @param {React.ComponentType} WrappedComponent - The component to wrap with animations
 * @returns {React.ComponentType} - Wrapped component with page animations
 */
const withPageAnimation = (WrappedComponent) => {
  const PageWrapper = (props) => {
    useEffect(() => {
      // Scroll to top on page change
      window.scrollTo(0, 0);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return PageWrapper;
};

export default withPageAnimation; 