import React from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Badge component for labels, statuses, and tags
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const variantClasses = {
    default: 'bg-brand-subtle text-brand border border-brand/20',
    success: 'bg-feedback-success-light text-feedback-success border border-feedback-success/20',
    warning: 'bg-feedback-warning-light text-feedback-warning border border-feedback-warning/20',
    error: 'bg-feedback-error-light text-feedback-error border border-feedback-error/20',
    info: 'bg-feedback-info-light text-feedback-info border border-feedback-info/20',
    secondary: 'bg-surface-muted text-text-secondary border border-stroke/50',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-md',
    md: 'px-2.5 py-1 text-sm font-medium rounded-md',
    lg: 'px-3 py-1.5 text-base font-medium rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Divider component for visual separation
 */
export function Divider({
  direction = 'horizontal',
  className = '',
  text = '',
  ...props
}) {
  if (direction === 'vertical') {
    return (
      <div
        className={cn('h-full w-px bg-stroke', className)}
        {...props}
      />
    );
  }

  if (text) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className="flex-1 h-px bg-stroke" />
        <span className="px-2 text-sm text-text-muted">{text}</span>
        <div className="flex-1 h-px bg-stroke" />
      </div>
    );
  }

  return (
    <div
      className={cn('w-full h-px bg-stroke', className)}
      {...props}
    />
  );
}

/**
 * Alert component for important messages
 */
export function Alert({
  children,
  variant = 'info',
  title,
  icon,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) {
  const [isVisible, setIsVisible] = React.useState(true);

  const variantClasses = {
    info: 'bg-feedback-info-light border border-feedback-info/30 text-feedback-info',
    success: 'bg-feedback-success-light border border-feedback-success/30 text-feedback-success',
    warning: 'bg-feedback-warning-light border border-feedback-warning/30 text-feedback-warning',
    error: 'bg-feedback-error-light border border-feedback-error/30 text-feedback-error',
  };

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  };

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex gap-3',
        variantClasses[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {icon || defaultIcons[variant]}
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Status indicator for project/item status
 */
export function StatusIndicator({
  status = 'pending',
  size = 'md',
  className = '',
  label = '',
  ...props
}) {
  const statusClasses = {
    pending: 'bg-gray-300',
    ongoing: 'bg-brand',
    completed: 'bg-feedback-success',
    paused: 'bg-feedback-warning',
    failed: 'bg-feedback-error',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div
        className={cn(
          'rounded-full animate-pulse-soft',
          statusClasses[status],
          sizeClasses[size],
        )}
        title={status}
      />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}

/**
 * Avatar component for profile pictures
 */
export function Avatar({
  src,
  initials = '?',
  size = 'md',
  className = '',
  alt = 'Avatar',
  ...props
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-subtle text-brand flex items-center justify-center font-semibold flex-shrink-0',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
}

/**
 * Chip component for removable tags/filters
 */
export function Chip({
  children,
  onRemove,
  variant = 'default',
  icon,
  className = '',
  ...props
}) {
  const variantClasses = {
    default: 'bg-surface-muted text-text-primary border border-stroke/50',
    brand: 'bg-brand-subtle text-brand border border-brand/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 flex-shrink-0 rounded-full hover:bg-black/10 transition-colors p-0.5"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
