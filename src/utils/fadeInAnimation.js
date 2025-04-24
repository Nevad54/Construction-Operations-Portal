/**
 * Initializes fade-in animations for elements with the 'fade-in-section' class
 * This function should be called when the DOM is loaded
 */
export const initFadeInAnimations = () => {
  // Get all elements with the fade-in-section class
  const fadeElements = document.querySelectorAll('.fade-in-section');
  
  // Create an Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Add the is-visible class when the element is in the viewport
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Unobserve the element after it becomes visible
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Trigger when at least 10% of the element is visible
    threshold: 0.1,
    // Start observing slightly before the element enters the viewport
    rootMargin: '0px 0px -50px 0px'
  });
  
  // Start observing each element
  fadeElements.forEach(element => {
    observer.observe(element);
  });
  
  // Return a cleanup function
  return () => {
    fadeElements.forEach(element => {
      observer.unobserve(element);
    });
  };
}; 