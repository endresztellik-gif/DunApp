/**
 * ErrorBoundary Component
 *
 * React error boundary that catches and displays errors gracefully.
 * Provides a retry mechanism to recover from errors.
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            background: 'var(--status-alert-bg)',
            color: 'var(--status-alert-text)',
            border: '0.5px solid var(--status-alert-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              style={{ color: 'var(--color-dun-alert-500)', flexShrink: 0, width: '24px', height: '24px' }}
            />
            <div className="flex-1">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--status-alert-text)', marginBottom: 'var(--space-1)' }}>
                Hiba történt
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--status-alert-text)' }}>
                {this.state.error?.message || 'Ismeretlen hiba történt. Kérjük, próbálja újra.'}
              </p>
              <button
                onClick={this.handleReset}
                style={{
                  marginTop: 'var(--space-3)',
                  padding: '4px var(--space-3)',
                  background: 'var(--color-dun-alert-500)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Újrapróbálkozás"
              >
                Újrapróbálkozás
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
