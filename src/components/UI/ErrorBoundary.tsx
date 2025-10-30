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
        <div className="error-card" role="alert" aria-live="assertive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-1">
                Hiba történt
              </h3>
              <p className="error-message">
                {this.state.error?.message || 'Ismeretlen hiba történt. Kérjük, próbálja újra.'}
              </p>
              <button
                onClick={this.handleReset}
                className="error-retry-button"
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
