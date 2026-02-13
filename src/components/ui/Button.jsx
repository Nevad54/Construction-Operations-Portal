import React from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

const buttonVariants = {
  // Primary - action buttons
  primary: 'bg-brand dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-700 active:bg-brand-700 dark:active:bg-brand-800 text-white shadow-sm hover:shadow-md dark:shadow-md focus:ring-2 focus:ring-brand/30',
  
  // Secondary - alternative actions
  secondary: 'bg-surface-muted dark:bg-gray-800 text-text-primary dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 shadow-sm hover:shadow-md focus:ring-2 focus:ring-brand/20',
  
  // Outline - de-emphasized actions
  outline: 'border border-stroke dark:border-gray-600 bg-transparent text-text-primary dark:text-gray-100 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 focus:ring-2 focus:ring-brand/20',
  
  // Ghost - subtle actions (for text-only buttons in toolbars)
  ghost: 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 active:bg-surface-interactive dark:active:bg-gray-700 focus:ring-2 focus:ring-brand/20',
  
  // Success - positive actions
  success: 'bg-feedback-success dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 active:bg-green-700 dark:active:bg-green-800 text-white shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500/30',
  
  // Danger - destructive actions
  danger: 'bg-feedback-error dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 active:bg-red-700 dark:active:bg-red-800 text-white shadow-sm hover:shadow-md focus:ring-2 focus:ring-red-500/30',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm font-medium rounded-md',
  md: 'px-4 py-2 text-sm font-medium rounded-lg',
  lg: 'px-6 py-3 text-base font-medium rounded-lg',
  xl: 'px-8 py-4 text-base font-medium rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
  type = 'button',
  ...props
}) {
  const baseClasses = [
    'inline-flex items-center justify-center whitespace-nowrap',
    'transition-all duration-fast',
    'focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <span className={cn('flex-shrink-0', iconPosition === 'left' ? 'mr-2' : 'ml-2')}>
        {icon}
      </span>
    );
  };

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            style={{ marginRight: children ? '0.5rem' : '0' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          {children}
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
}
