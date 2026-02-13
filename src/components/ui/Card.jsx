import React from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'default',
  shadow = 'soft',
  variant = 'default',
  interactive = false,
  ...props
}) {
  const paddingClasses = {
    none: '',
    xs: 'p-2',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: 'shadow-none',
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    soft: 'shadow-soft',
    'soft-lg': 'shadow-soft-lg',
    md: 'shadow-md',
    lg: 'shadow-lg',
    elevated: 'shadow-elevated',
  };

  const variantClasses = {
    default: 'bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700',
    elevated: 'bg-surface-elevated dark:bg-gray-800 border border-stroke dark:border-gray-700',
    subtle: 'bg-surface-muted dark:bg-gray-800 border border-stroke/50 dark:border-gray-700/50',
    interactive: 'bg-surface-card dark:bg-gray-900 border border-stroke/50 dark:border-gray-700/50 hover:border-stroke dark:hover:border-gray-600',
    outline: 'bg-transparent border-2 border-stroke dark:border-gray-700',
    flat: 'bg-surface-muted dark:bg-gray-800 border-0',
  };

  const baseClasses = [
    'rounded-lg transition-all duration-fast',
    paddingClasses[padding],
    shadowClasses[shadow],
    variantClasses[variant],
    (hover || interactive) && 'hover:shadow-lg',
    interactive && 'cursor-pointer hover:border-brand/20',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', divider = true, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pb-4',
        divider && 'border-b border-stroke dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', size = 'md', ...props }) {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
  };

  return (
    <h3 className={cn('text-text-primary dark:text-gray-100', sizeClasses[size], className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={cn('text-sm text-text-secondary dark:text-gray-400', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', divider = true, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pt-4',
        divider && 'border-t border-stroke dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
