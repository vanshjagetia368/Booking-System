import ErrorBoundary from '../../components/feedback/ErrorBoundary.jsx';
import { AuthProvider } from '../../features/auth/index.js';

/**
 * Root Application Providers Composition
 *
 * Centralizes all global context providers and top-level error boundaries
 * so that main.jsx and App.jsx remain concise and maintainable.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}

