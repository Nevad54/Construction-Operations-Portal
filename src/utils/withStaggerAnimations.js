import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds stagger animations for lists or grids
 * @param {React.ComponentType} WrappedComponent - The component to wrap with animations
 * @returns {React.ComponentType} - Wrapped component with stagger animations
 */
const withStaggerAnimations = (WrappedComponent) => {
  const StaggerWrapper = (props) => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.3
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      }
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <WrappedComponent {...props} itemVariants={itemVariants} />
      </motion.div>
    );
  };

  return StaggerWrapper;
};

export default withStaggerAnimations; 