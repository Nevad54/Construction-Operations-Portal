import React from 'react';
import withPageAnimation from './withPageAnimation';
import withSectionAnimations from './withSectionAnimations';
import withTextAnimations from './withTextAnimations';
import withImageAnimations from './withImageAnimations';
import withButtonAnimations from './withButtonAnimations';

/**
 * Utility to combine multiple animation HOCs
 * @param {React.ComponentType} Component - The component to wrap with animations
 * @param {Object} options - Animation options
 * @param {boolean} options.page - Whether to add page animations
 * @param {boolean} options.section - Whether to add section animations
 * @param {boolean} options.text - Whether to add text animations
 * @returns {React.ComponentType} - Wrapped component with combined animations
 */
const withAnimations = (Component, options = { page: true, section: true, text: true }) => {
  let WrappedComponent = Component;

  if (options.page) {
    WrappedComponent = withPageAnimation(WrappedComponent);
  }

  if (options.section) {
    WrappedComponent = withSectionAnimations(WrappedComponent);
  }

  if (options.text) {
    WrappedComponent = withTextAnimations(WrappedComponent);
  }

  return WrappedComponent;
};

export default withAnimations; 