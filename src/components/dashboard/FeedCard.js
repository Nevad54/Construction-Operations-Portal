import React from 'react';

/**
 * Reusable feed-style card: white bg, rounded-lg, shadow-sm, hover:shadow-md.
 * Use for project cards, announcements, stats, etc.
 */
export default function FeedCard({ 
  title, 
  children, 
  className = '', 
  actions,
  interactive = false,
  ...rest 
}) {
  return (
    <div
      {...rest}
      className={`
        bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700
        hover:shadow-md transition-all duration-fast
        overflow-hidden
        ${interactive ? 'cursor-pointer hover:border-brand/20 dark:hover:border-brand-400/30' : ''}
        ${className}
      `}
    >
      {(title || actions) && (
        <div className="px-5 py-4 border-b border-stroke dark:border-gray-700 flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-text-primary dark:text-gray-100">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
