import { Link } from 'react-router-dom';
import { ROUTES } from '../../app/routes.js';

/**
 * Shared Application Footer
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand Info */}
          <div className="footer__brand-section">
            <div className="footer__brand-title">
              <span className="footer__logo-mark" aria-hidden="true">■</span>
              Smart Resource Booking
            </div>
            <p className="footer__brand-desc">
              Campus and shared facility management system. Discover, verify availability,
              and reserve rooms, labs, and equipment with concurrency-safe booking logic.
            </p>
            <p className="footer__version-note">
              Current Stage: <strong>Frontend Foundation (Prompt 2/22)</strong>
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="footer__nav-group">
            <h4 className="footer__group-title">User Services</h4>
            <ul className="footer__links">
              <li>
                <Link to={ROUTES.HOME} className="footer__link">Home & Overview</Link>
              </li>
              <li>
                <Link to={ROUTES.RESOURCES} className="footer__link">Resource Directory</Link>
              </li>
              <li>
                <Link to={ROUTES.MY_BOOKINGS} className="footer__link">My Reservations</Link>
              </li>
              <li>
                <Link to={ROUTES.LOGIN} className="footer__link">Authentication</Link>
              </li>
            </ul>
          </div>

          {/* Administration & System */}
          <div className="footer__nav-group">
            <h4 className="footer__group-title">Administration</h4>
            <ul className="footer__links">
              <li>
                <Link to={ROUTES.ADMIN_DASHBOARD} className="footer__link">Admin Dashboard</Link>
              </li>
              <li>
                <Link to={ROUTES.ADMIN_RESOURCES} className="footer__link">Resource Inventory</Link>
              </li>
              <li>
                <Link to={ROUTES.ADMIN_BOOKINGS} className="footer__link">Reservation Management</Link>
              </li>
            </ul>
          </div>

          {/* Architecture Notes */}
          <div className="footer__nav-group">
            <h4 className="footer__group-title">Architecture Invariants</h4>
            <ul className="footer__notes-list">
              <li>Decoupled React / Express architecture</li>
              <li>Half-open intervals: <code>[start, end)</code></li>
              <li>Server-authoritative conflict validation</li>
              <li>Atomic fixed-duration slot allocations</li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {currentYear} Smart Resource Booking System. All rights reserved.
          </p>
          <p className="footer__architecture-badge">
            React 19 &bull; Vite &bull; Node.js Express &bull; MongoDB
          </p>
        </div>
      </div>
    </footer>
  );
}
