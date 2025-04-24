import React from 'react';
import { motion } from 'framer-motion';

/**
 * HOC that adds loading states to components with skeleton loaders
 * @param {React.ComponentType} WrappedComponent - The component to wrap with loading state
 * @param {Object} options - Configuration options for the loading state
 * @param {React.ComponentType} options.SkeletonComponent - Custom skeleton component to use
 * @param {number} options.count - Number of skeleton items to show (default: 1)
 * @param {number} options.delay - Delay between skeleton items in seconds (default: 0.1)
 * @returns {React.ComponentType} - Wrapped component with loading state
 */
const withLoadingState = (WrappedComponent, options = {}) => {
  const {
    SkeletonComponent,
    count = 1,
    delay = 0.1
  } = options;

  const LoadingWrapper = ({ isLoading, ...props }) => {
    if (!isLoading) {
      return <WrappedComponent {...props} />;
    }

    if (SkeletonComponent) {
      return (
        <div className="skeleton-container">
          {Array.from({ length: count }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * delay }}
            >
              <SkeletonComponent />
            </motion.div>
          ))}
        </div>
      );
    }

    // Default skeleton animation if no custom component provided
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className="skeleton-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * delay }}
          >
            <div className="skeleton-shimmer" />
          </motion.div>
        ))}
      </div>
    );
  };

  return LoadingWrapper;
};

export default withLoadingState; 