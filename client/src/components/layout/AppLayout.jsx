import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/**
 * Base Application Layout
 *
 * Provides the persistent shell (Navbar, Main Content Area, and Footer)
 * along with accessibility enhancements like a skip-to-content link.
 */
export default function AppLayout() {
  return (
    <div className="app-shell">
      {/* Accessibility: Skip link for keyboard and screen-reader navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Persistent Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
}
