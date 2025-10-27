/**
 * LoadingSpinner Component
 *
 * Displays a loading spinner with optional message.
 * Centered by default, can be customized with className.
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
      {/* Spinner */}
      <div
        className={`spinner border-cyan-600 ${sizeClasses[size]}`}
        aria-hidden="true"
      />

      {/* Message */}
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}

      {/* Screen reader text */}
      <span className="sr-only">{message}</span>
    </div>
  );
};
