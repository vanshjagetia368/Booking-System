import { Component } from 'react';
import Button from '../ui/Button.jsx';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';

/**
 * Global React Error Boundary Component
 *
 * Catches unhandled JavaScript errors in child component trees, logs error details
 * safely to the console, and displays an accessible recovery interface.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error cleanly for developers without leaking sensitive data to the user
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="page-container error-boundary-container" role="alert">
          <Card className="error-boundary-card">
            <CardHeader>
              <div className="error-boundary-header">
                <span className="error-boundary-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div>
                  <CardTitle>Application Error</CardTitle>
                  <p className="card__description">
                    An unexpected client-side error occurred while rendering this view.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="error-boundary-message">
                {this.state.error?.message || 'A client component encountered an unhandled exception.'}
              </p>
              <p className="text-subtle">
                You can try re-rendering the component or refreshing the page. Your session and saved data remain intact.
              </p>
            </CardContent>
            <CardFooter className="error-boundary-footer">
              <Button variant="primary" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload}>
                Reload Application
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
