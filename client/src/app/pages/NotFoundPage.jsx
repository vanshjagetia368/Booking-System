import { Link } from 'react-router-dom';
import { ROUTES } from '../routes.js';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';

/**
 * 404 Not Found Page
 */
export default function NotFoundPage() {
  return (
    <div className="page-container not-found-page">
      <EmptyState
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="56"
            height="56"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        }
        title="Page Not Found (404)"
        description="The page you requested does not exist or may have been moved. Check the route URL or return to the main application."
        action={
          <Button as={Link} to={ROUTES.HOME} variant="primary">
            Return to Home Overview
          </Button>
        }
      />
    </div>
  );
}
