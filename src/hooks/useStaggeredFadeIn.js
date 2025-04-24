import { useEffect, useRef, useState } from 'react';

export const useStaggeredFadeIn = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Add a small delay before setting visible to true
        const timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, delay);
        
        return () => clearTimeout(timeoutId);
      } else {
        setIsVisible(false);
      }
    }, {
      threshold: 0.1,
      ...options
    });

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options, delay]);

  const setStaggerDelay = (newDelay) => {
    setDelay(newDelay);
  };

  return [elementRef, isVisible, setStaggerDelay];
}; 