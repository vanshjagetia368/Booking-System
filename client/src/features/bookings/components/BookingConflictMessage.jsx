import { Link } from 'react-router-dom';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import ROUTES from '../../../app/routes.js';

/**
 * Maps API conflict and schedule rejection codes to user-friendly explanations.
 */
function getConflictDetails(error) {
  const code = error?.code;
  const message = error?.message;

  switch (code) {
    case 'BOOKING_CONFLICT':
      return {
        title: 'Time Slot No Longer Available',
        description:
          'Another user has reserved one or more time slots in this interval just moments ago. Please return to the calendar and select an alternative time slot.',
      };
    case 'MAINTENANCE_CONFLICT':
      return {
        title: 'Maintenance Blackout Scheduled',
        description:
          'This resource has been scheduled for facility maintenance during the requested interval. Please check alternative available dates.',
      };
    case 'OUTSIDE_OPERATING_HOURS':
      return {
        title: 'Outside Operating Hours',
        description:
          message || 'The selected interval extends outside the facility’s operating schedule for this day.',
      };
    case 'RESOURCE_INACTIVE':
      return {
        title: 'Resource Currently Inactive',
        description:
          'This campus facility was recently set to inactive status and is no longer accepting new bookings.',
      };
    case 'INVALID_BOOKING_INTERVAL':
      return {
        title: 'Invalid Booking Interval',
        description:
          message || 'The selected interval has either already started or violates resource slot duration boundaries.',
      };
    case 'TRANSACTIONS_UNAVAILABLE':
      return {
        title: 'Service Temporarily Unavailable',
        description:
          'The booking database transaction engine is temporarily unavailable. Please retry your request in a few moments.',
      };
    default:
      return {
        title: 'Reservation Could Not Be Completed',
        description:
          message || 'The requested reservation could not be allocated. Please check availability and select a different slot.',
      };
  }
}

/**
 * Displays conflict details and recovery actions when a slot cannot be allocated.
 *
 * @param {object} props
 * @param {object} props.error - ApiError from backend
 * @param {string} props.resourceId - Target resource ObjectId
 * @param {() => void} [props.onDismiss]
 */
export default function BookingConflictMessage({ error, resourceId, onDismiss }) {
  if (!error) return null;

  const { title, description } = getConflictDetails(error);

  return (
    <div className="booking-conflict-message" role="alert">
      <Alert variant="warning" title={title} onDismiss={onDismiss}>
        <p className="booking-conflict-message__text">{description}</p>

        {resourceId && (
          <div className="booking-conflict-message__actions">
            <Button
              as={Link}
              to={ROUTES.RESOURCE_DETAILS(resourceId)}
              variant="outline"
              size="sm"
            >
              ← Back to Calendar to Pick Another Slot
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
}
