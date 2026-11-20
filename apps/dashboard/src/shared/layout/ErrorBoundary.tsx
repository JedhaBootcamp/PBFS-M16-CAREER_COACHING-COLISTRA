import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes (e.g. the current page), the boundary resets. */
  resetKey?: string;
}

/**
 * Last line of defence: if a page crashes while rendering, show a message
 * instead of unmounting the whole app (a blank white page).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: unknown; resetKey?: string }> {
  state: { error: unknown; resetKey?: string } = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: { error: unknown; resetKey?: string }) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unexpected error in the dashboard', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Card>
          <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
        </Card>
      );
    }
    return this.props.children;
  }
}
