import { Component, ReactNode } from 'react';

type AnalysisErrorBoundaryProps = {
  children: ReactNode;
  onClose?: () => void;
};

type AnalysisErrorBoundaryState = {
  error: Error | null;
};

export class AnalysisErrorBoundary extends Component<
  AnalysisErrorBoundaryProps,
  AnalysisErrorBoundaryState
> {
  state: AnalysisErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AnalysisErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, maxWidth: 480 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
            Analysis could not be opened.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
            {this.state.error.message ||
              'An unexpected error occurred. If you use a wallet browser extension, try disabling it for this site.'}
          </p>
          {this.props.onClose ? (
            <button
              type="button"
              onClick={this.props.onClose}
              style={{ marginTop: 12, cursor: 'pointer' }}
            >
              Close
            </button>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
