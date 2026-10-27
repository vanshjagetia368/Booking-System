import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import LoginForm from '../components/LoginForm.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import ROUTES from '../../../app/routes.js';

/**
 * Authentication Login Page
 *
 * Provides page layout, heading structure, registration navigation link,
 * and handles post-authentication redirection to the previously attempted route.
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || ROUTES.HOME;

  useEffect(() => {
    // Redirect if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate(from, {
        replace: true,
        state: { bookingIntent: location.state?.bookingIntent },
      });
    }
  }, [isAuthenticated, isLoading, navigate, from, location.state]);

  const handleSuccess = () => {
    navigate(from, {
      replace: true,
      state: { bookingIntent: location.state?.bookingIntent },
    });
  };

  return (
    <PageContainer size="sm">
      <div className="auth-card">
        <header className="auth-card__header">
          <div className="auth-card__badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="28"
              height="28"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
          </div>
          <h1 className="auth-card__title">Sign In to Your Account</h1>
          <p className="auth-card__subtitle">
            Enter your credentials to access your bookings and reserve university resources.
          </p>
        </header>

        <div className="auth-card__body">
          <LoginForm onSuccess={handleSuccess} />
        </div>

        <footer className="auth-card__footer">
          <p className="auth-card__footer-text">
            Don&apos;t have an account yet?{' '}
            <Link to={ROUTES.REGISTER} className="auth-card__link">
              Create an account
            </Link>
          </p>
        </footer>
      </div>
    </PageContainer>
  );
}
