import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../app/routes.js';
import Badge from '../ui/Badge.jsx';

/**
 * Main application navigation header.
 *
 * Implements accessible navigation, keyboard-visible focus states,
 * and responsive mobile drawer navigation.
 */
export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  const navLinks = [
    { label: 'Explore Resources', path: ROUTES.RESOURCES },
    { label: 'My Bookings', path: ROUTES.MY_BOOKINGS },
    { label: 'Admin Portal', path: ROUTES.ADMIN_DASHBOARD },
  ];

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
            Prompt 2 Shell
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

        {/* Header Actions */}
        <div className="navbar__actions navbar__actions--desktop">
          <Link to={ROUTES.LOGIN} className="btn btn--outline btn--sm">
            Sign In
          </Link>
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
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
