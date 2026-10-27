import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import ROUTES from '../../../app/routes.js';

/**
 * Protected Route Guard
 *
 * Ensures only authenticated users can access nested child routes.
 * While session initialization is pending, displays a loading state to prevent flash redirects.
 * If unauthenticated, redirects to /login preserving the intended destination in router state.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying authentication session..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
