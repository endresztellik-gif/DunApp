/**
 * LoadingSpinner Component — Redesign v2
 */

import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Betöltés...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
        style={{
          borderColor: 'var(--accent-primary)',
          borderTopColor: 'transparent',
        }}
        aria-hidden="true"
      />
      {message && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};
