import AppProviders from './app/providers/AppProviders.jsx';
import AppRoutes from './app/AppRoutes.jsx';

/**
 * Root Application Component
 *
 * Composes application providers and route hierarchy.
 */
export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
