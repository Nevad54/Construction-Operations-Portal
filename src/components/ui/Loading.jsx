import React from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default function Loading({ 
  size = 'md', 
  className = '', 
  text = 'Loading...',
  showText = true 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <svg 
        className={cn('animate-spin text-brand', sizeClasses[size])}
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
      {showText && (
        <span className="text-sm text-text-secondary">{text}</span>
      )}
    </div>
  );
}

export function SkeletonCard({ className = '', ...props }) {
  return (
    <div className={cn('bg-surface-card rounded-xl border border-stroke p-6', className)} {...props}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className = '', ...props }) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '',
  ...props 
}) {
  return (
    <div className={cn('text-center py-12', className)} {...props}>
      {icon && (
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-surface-muted text-gray-400 mb-4">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
