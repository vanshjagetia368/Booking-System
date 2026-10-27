import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import { normalizeErrorMessage, getErrorCode } from '../../utils/error.js';

/**
 * Reusable Error State Component
 *
 * Displays a friendly, accessible error view with an optional retry button.
 * Avoids leaking raw internal stack traces while presenting stable machine-readable error codes.
 *
 * @param {object} props
 * @param {unknown} [props.error] - Error object, ApiError, or string
 * @param {string} [props.title='Unable to load content']
 * @param {string} [props.message] - Custom message overriding automatic error normalization
 * @param {() => void} [props.onRetry] - Optional retry handler
 * @param {string} [props.retryLabel='Try Again']
 * @param {React.ReactNode} [props.action] - Supplementary action element
 * @param {string} [props.className='']
 */
export default function ErrorState({
  error = null,
  title = 'Something went wrong',
  message = null,
  onRetry = null,
  retryLabel = 'Try Again',
  action = null,
  className = '',
}) {
  const displayMessage = message || normalizeErrorMessage(error, 'An unexpected error occurred. Please try again.');
  const errorCode = getErrorCode(error);

  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <div className="error-state__icon" aria-hidden="true">
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className="error-state__title">{title}</h2>
      <p className="error-state__message">{displayMessage}</p>

      {errorCode && errorCode !== 'UNKNOWN_ERROR' && (
        <div className="error-state__code-wrapper">
          <Badge variant="neutral" size="sm">
            Error Code: <code>{errorCode}</code>
          </Badge>
        </div>
      )}

      {(onRetry || action) && (
        <div className="error-state__actions">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
