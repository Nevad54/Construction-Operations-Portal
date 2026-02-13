import React, { useEffect, useRef, useCallback } from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

// Accessibility utilities
function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

function setFocusToFirst(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

const KEY_CODES = {
  ESCAPE: 'Escape',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  ...props
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Store the element that had focus before modal opened
  const storePreviousFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  // Restore focus to previously focused element
  const restorePreviousFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  // Handle escape key
  const handleEscape = useCallback((event) => {
    if (event.key === KEY_CODES.ESCAPE && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Setup modal when opened
  useEffect(() => {
    if (isOpen) {
      storePreviousFocus();
      
      // Add escape key listener
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus management
      setTimeout(() => {
        if (modalRef.current) {
          setFocusToFirst(modalRef.current);
          const cleanupFocusTrap = trapFocus(modalRef.current);
          
          return cleanupFocusTrap;
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      restorePreviousFocus();
    };
  }, [isOpen, handleEscape, storePreviousFocus, restorePreviousFocus]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-surface-card dark:bg-gray-900 rounded-xl shadow-elevated border border-stroke dark:border-gray-700',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'transform transition-all duration-300 ease-out',
          'animate-scale-in',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-gray-700">
            {title && (
              <h2 
                id="modal-title"
                className="text-lg font-semibold text-text-primary dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children, className = '', ...props }) {
  return (
    <div 
      className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-stroke dark:border-gray-700', className)} 
      role="group"
      aria-label="Modal actions"
      {...props}
    >
      {children}
    </div>
  );
}
