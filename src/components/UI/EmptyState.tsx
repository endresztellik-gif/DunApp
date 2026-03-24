/**
 * EmptyState Component — Redesign v2
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
    <div
      className={`dun-card flex flex-col items-center justify-center text-center py-8 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        aria-hidden="true"
        style={{ color: 'var(--text-tertiary)', width: '48px', height: '48px', marginBottom: '12px' }}
      />
      <p style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {message}
      </p>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
