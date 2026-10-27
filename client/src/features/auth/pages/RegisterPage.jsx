import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import RegisterForm from '../components/RegisterForm.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import ROUTES from '../../../app/routes.js';

/**
 * User Registration Page
 *
 * Provides page layout, heading structure, link back to sign-in,
 * and handles post-registration redirect to the application home.
 */
export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSuccess = () => {
    // Backend sets the auth_token cookie on successful registration and returns user
    navigate(ROUTES.HOME, { replace: true });
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
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.765Z"
              />
            </svg>
          </div>
          <h1 className="auth-card__title">Create Your Account</h1>
          <p className="auth-card__subtitle">
            Join the Smart Resource Booking System to discover, schedule, and manage campus facilities.
          </p>
        </header>

        <div className="auth-card__body">
          <RegisterForm onSuccess={handleSuccess} />
        </div>

        <footer className="auth-card__footer">
          <p className="auth-card__footer-text">
            Already registered?{' '}
            <Link to={ROUTES.LOGIN} className="auth-card__link">
              Sign in to your account
            </Link>
          </p>
        </footer>
      </div>
    </PageContainer>
  );
}
