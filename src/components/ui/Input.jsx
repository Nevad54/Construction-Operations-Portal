import React, { useId } from 'react';

// Simple className utility
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  trailingElement,
  className = '',
  containerClassName = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = props.id || `input-${generatedId}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helperId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary dark:text-gray-200"
        >
          {label}
          {required && <span className="text-feedback-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex-shrink-0">
            {icon}
          </div>
        )}

        {trailingElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            {trailingElement}
          </div>
        )}
        
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border border-stroke dark:border-gray-600',
            'bg-surface-card dark:bg-gray-800 text-text-primary dark:text-gray-100 text-base',
            'placeholder:text-text-muted dark:placeholder:text-gray-500 transition-all duration-fast',
            'focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 focus:ring-offset-0',
            'disabled:bg-surface-muted dark:disabled:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed',
            icon && 'pl-10',
            trailingElement && 'pr-16',
            error && 'border-feedback-error dark:border-feedback-error/50 focus:ring-feedback-error/20 dark:focus:ring-feedback-error/20 focus:border-feedback-error',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-feedback-error font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-text-muted dark:text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = props.id || `textarea-${generatedId}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helperId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary dark:text-gray-200"
        >
          {label}
          {required && <span className="text-feedback-error ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg border border-stroke dark:border-gray-600',
          'bg-surface-card dark:bg-gray-800 text-text-primary dark:text-gray-100 text-base',
          'placeholder:text-text-muted dark:placeholder:text-gray-500 transition-all duration-fast',
          'focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 focus:ring-offset-0',
          'disabled:bg-surface-muted dark:disabled:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed',
          'resize-vertical min-h-[100px]',
          error && 'border-feedback-error dark:border-feedback-error/50 focus:ring-feedback-error/20 dark:focus:ring-feedback-error/20 focus:border-feedback-error',
          className
        )}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-feedback-error font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-text-muted dark:text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  className = '',
  containerClassName = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = props.id || `select-${generatedId}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helperId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary dark:text-gray-200"
        >
          {label}
          {required && <span className="text-feedback-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border border-stroke dark:border-gray-600',
            'bg-surface-card dark:bg-gray-800 text-text-primary dark:text-gray-100 text-base appearance-none',
            'transition-all duration-fast cursor-pointer',
            'focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 focus:ring-offset-0',
            'disabled:bg-surface-muted dark:disabled:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-feedback-error dark:border-feedback-error/50 focus:ring-feedback-error/20 focus:border-feedback-error',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-feedback-error font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-text-muted dark:text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
