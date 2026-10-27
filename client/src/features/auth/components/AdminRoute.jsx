import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import ROUTES from '../../../app/routes.js';

/**
 * Administrator Route Guard
 *
 * Ensures only authenticated users with the backend 'admin' role can access nested child routes.
 * 1. While session resolution is in progress, renders a full-page loading indicator.
 * 2. If unauthenticated, redirects to /login preserving the intended target path in router state.
 * 3. If authenticated as a non-admin, presents a clear, accessible 403 Forbidden Access Denied screen
 *    with options to return to safe user routes or switch accounts.
 * 4. If confirmed admin, renders the nested route Outlet.
 */
export default function AdminRoute() {
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState message="Verifying administrative privileges..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <PageContainer size="md">
        <div className="access-denied-card" role="alert">
          <div className="access-denied-card__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="48"
              height="48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>

          <div className="access-denied-card__badge">
            <Badge variant="warning" size="sm">403 Forbidden</Badge>
          </div>

          <h1 className="access-denied-card__title">Administrator Privileges Required</h1>
          <p className="access-denied-card__description">
            You are currently signed in as <strong>{user?.name || user?.email}</strong> with role{' '}
            <Badge variant="neutral" size="sm">{user?.role || 'user'}</Badge>. This area is restricted
            to system administrators only.
          </p>

          <div className="access-denied-card__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.HOME)}
            >
              Back to Home
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(ROUTES.RESOURCES)}
            >
              Explore Resources
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={async () => {
                await logout();
                navigate(ROUTES.LOGIN);
              }}
            >
              Sign Out & Switch Account
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return <Outlet />;
}
