import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes.js';
import { useAuth } from '../../features/auth/index.js';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

/**
 * Role-Aware Application Navigation Header
 *
 * Implements accessible navigation, keyboard-visible focus states,
 * dynamic role-based navigation links, user identity chip, and functional logout.
 */
export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  // Close mobile navigation drawer whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setIsMobileMenuOpen(false);
      navigate(ROUTES.HOME);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Compose navigation links dynamically based on resolved authentication & role
  const navLinks = [
    { label: 'Explore Resources', path: ROUTES.RESOURCES },
  ];

  if (isAuthenticated) {
    navLinks.push({ label: 'My Bookings', path: ROUTES.BOOKINGS });

    if (isAdmin) {
      navLinks.push({ label: 'Admin Portal', path: ROUTES.ADMIN_DASHBOARD });
    }
  }

  return (
    <header className="navbar-container">
      <div className="navbar">
        {/* Brand Identity */}
        <Link to={ROUTES.HOME} className="navbar__brand" aria-label="Smart Resource Booking Home">
          <span className="navbar__logo" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M2 10h24" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="7" r="1" fill="currentColor" />
              <circle cx="12" cy="7" r="1" fill="currentColor" />
              <circle cx="8" cy="15" r="1.5" fill="currentColor" />
              <circle cx="14" cy="15" r="1.5" fill="currentColor" />
              <circle cx="20" cy="15" r="1.5" fill="currentColor" />
              <circle cx="8" cy="19" r="1.5" fill="currentColor" />
              <circle cx="14" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="navbar__title">Smart Resource Booking</span>
          <Badge variant="primary" size="sm" className="navbar__stage-badge">
            Full-Stack Foundation
          </Badge>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar__nav navbar__nav--desktop" aria-label="Primary navigation">
          <ul className="navbar__menu">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? 'navbar__link--active' : ''}`.trim()
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Header Actions - Desktop */}
        <div className="navbar__actions navbar__actions--desktop">
          {isLoading ? (
            <div className="navbar__loading-state" aria-hidden="true">
              <span className="navbar__loading-skeleton" />
            </div>
          ) : isAuthenticated ? (
            <div className="navbar__user-area">
              <div className="navbar__user-identity" title={user?.email}>
                <span className="navbar__user-name">{user?.name || user?.email}</span>
                {isAdmin ? (
                  <Badge variant="warning" size="sm" className="navbar__role-badge">
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm" className="navbar__role-badge">
                    User
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                aria-label="Sign out of your account"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="navbar__auth-actions">
              <Link to={ROUTES.LOGIN} className="btn btn--outline btn--sm">
                Sign In
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn--primary btn--sm">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Toggle Button */}
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="navbar__toggle-icon" aria-hidden="true">
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="navbar__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <nav className="navbar__drawer-nav" aria-label="Mobile menu navigation">
            <ul className="navbar__drawer-menu">
              <li>
                <NavLink
                  to={ROUTES.HOME}
                  className={({ isActive }) =>
                    `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`.trim()
                  }
                  end
                >
                  Home
                </NavLink>
              </li>

              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`.trim()
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}

              <li className="navbar__drawer-divider" aria-hidden="true" />

              {isLoading ? (
                <li className="navbar__drawer-item navbar__drawer-item--loading">
                  <span>Checking session...</span>
                </li>
              ) : isAuthenticated ? (
                <>
                  <li className="navbar__drawer-user-info">
                    <span className="navbar__drawer-user-label">Signed in as:</span>
                    <strong className="navbar__drawer-user-name">{user?.name}</strong>
                    <span className="navbar__drawer-user-email">{user?.email}</span>
                    <div className="navbar__drawer-user-role">
                      <Badge variant={isAdmin ? 'warning' : 'neutral'} size="sm">
                        {user?.role || 'user'}
                      </Badge>
                    </div>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="navbar__drawer-link navbar__drawer-link--logout"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink
                      to={ROUTES.LOGIN}
                      className={({ isActive }) =>
                        `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`.trim()
                      }
                    >
                      Sign In
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to={ROUTES.REGISTER}
                      className={({ isActive }) =>
                        `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`.trim()
                      }
                    >
                      Register Account
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
