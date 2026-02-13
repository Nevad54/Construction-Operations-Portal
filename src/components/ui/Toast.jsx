import React, { useState, useEffect } from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

const toastVariants = {
  success: 'bg-brand-subtle dark:bg-brand-900/30 border-brand/30 dark:border-brand-700/40 text-brand-active dark:text-brand-300',
  error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300',
  warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
  info: 'bg-surface-muted dark:bg-gray-800 border-stroke dark:border-gray-700 text-text-primary dark:text-gray-100',
  loading: 'bg-surface-muted dark:bg-gray-800 border-stroke dark:border-gray-700 text-text-primary dark:text-gray-100',
};

const toastIcons = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

export default function Toast({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  className = '',
  ...props 
}) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration === 0) return; // Don't auto-close for loading toasts

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = 100 / (duration / 100);
        return Math.max(0, prev - decrement);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 max-w-md w-full',
        'transform transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        className
      )}
      {...props}
    >
      <div className={cn(
        'rounded-xl border shadow-lg p-4',
        'flex items-start gap-3',
        toastVariants[type]
      )}>
        <div className="flex-shrink-0 mt-0.5">
          {toastIcons[type]}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          {message && (
            <p className="text-sm leading-relaxed">{message}</p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 text-current/60 hover:text-current transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {duration > 0 && (
        <div className="mt-2 h-1 bg-current/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Toast container for managing multiple toasts
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (options) => {
    const id = Date.now().toString();
    const newToast = { id, ...options };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (options.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, options.duration || 5000);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message, options = {}) => addToast({ type: 'success', message, ...options });
  const error = (message, options = {}) => addToast({ type: 'error', message, ...options });
  const warning = (message, options = {}) => addToast({ type: 'warning', message, ...options });
  const info = (message, options = {}) => addToast({ type: 'info', message, ...options });
  const loading = (message, options = {}) => addToast({ type: 'loading', message, duration: 0, ...options });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    loading,
  };
}
