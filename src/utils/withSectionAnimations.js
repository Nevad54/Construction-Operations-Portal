import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds section animations
 * @param {React.ComponentType} WrappedComponent - The component to wrap with animations
 * @returns {React.ComponentType} - Wrapped component with section animations
 */
const withSectionAnimations = (WrappedComponent) => {
  const SectionWrapper = (props) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <WrappedComponent {...props} />
      </motion.div>
    );
  };

  return SectionWrapper;
};

export default withSectionAnimations; 