import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import { getPolicyViolationMessage } from '../utils/bookingPolicyUtils.js';

/**
 * BookingActionFeedback Component
 *
 * Renders status banners for cancellation and rescheduling outcomes.
 *
 * @param {object} props
 * @param {'success' | 'danger' | 'warning' | 'info'} [props.variant='info']
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {string} [props.errorCode]
 * @param {Function} [props.onDismiss]
 * @param {Function} [props.onRetry]
 * @param {Function} [props.onRefresh]
 * @param {string} [props.className='']
 */
export default function BookingActionFeedback({
  variant = 'info',
  title,
  message,
  errorCode,
  onDismiss,
  onRetry,
  onRefresh,
  className = '',
}) {
  if (!message && !title) return null;

  const displayMessage = errorCode ? getPolicyViolationMessage(errorCode, message) : message;

  return (
    <div className={`booking-action-feedback ${className}`.trim()}>
      <Alert
        variant={variant}
        title={title}
        onClose={onDismiss}
        className="booking-action-feedback__alert"
      >
        <div className="booking-action-feedback__body">
          <p className="booking-action-feedback__message">{displayMessage}</p>

          {(onRetry || onRefresh) && (
            <div className="booking-action-feedback__actions">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Try Again
                </Button>
              )}
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  Refresh Status
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}
