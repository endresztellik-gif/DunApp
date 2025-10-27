/**
 * EmptyState Component
 *
 * Displays an empty state with icon and message when no data is available.
 * Used for handling cases where data hasn't loaded yet or doesn't exist.
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  message,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`} role="status" aria-live="polite">
      <Icon className="empty-state-icon" aria-hidden="true" />
      <p className="text-base font-medium text-gray-900 mb-1">{message}</p>
      {description && (
        <p className="empty-state-text">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
