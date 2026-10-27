import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth.js';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { formatCalendarDate, formatSlotInterval } from '../utils/availabilityUtils.js';
import { formatDuration } from '../../../utils/date.js';
import ROUTES from '../../../app/routes.js';

/**
 * Slot Selection Summary & Booking Transition Component
 *
 * Implements Prompt 15 Sections 10, 11, & 12:
 * - Displays selected interval details [startAt, endAt)
 * - Highlights resource identity and calendar date
 * - Provides authentication-aware transition to booking workflow
 * - Preserves selection payload in router navigation state
 *
 * @param {object} props
 * @param {object} props.resource - Active resource entity
 * @param {string} props.date - YYYY-MM-DD
 * @param {object | null} props.selectedSlot - { startAt: string, endAt: string }
 * @param {string} [props.timeZone='UTC']
 * @param {() => void} [props.onClearSelection]
 */
export default function SlotSelectionSummary({
  resource,
  date,
  selectedSlot,
  timeZone = 'UTC',
  onClearSelection,
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!selectedSlot) {
    return (
      <div className="slot-selection-summary slot-selection-summary--empty">
        <div className="slot-selection-summary__hint">
          <span className="slot-selection-summary__hint-icon" aria-hidden="true">👆</span>
          <span>Click on any available time slot above to select a booking interval.</span>
        </div>
      </div>
    );
  }

  const timeRangeLabel = formatSlotInterval(selectedSlot.startAt, selectedSlot.endAt, timeZone);
  const durationLabel = formatDuration(resource?.slotDurationMinutes || 30);

  const handleContinue = () => {
    const bookingIntent = {
      resourceId: resource._id,
      resourceName: resource.name,
      date,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      slotDurationMinutes: resource.slotDurationMinutes,
      timeZone,
    };

    if (!isAuthenticated) {
      // Transition to login preserving both intended return path and booking intent
      navigate(ROUTES.LOGIN, {
        state: {
          from: { pathname: ROUTES.BOOKING_CREATE },
          bookingIntent,
        },
      });
    } else {
      // Transition to user booking workflow preserving selection in router state
      navigate(ROUTES.BOOKING_CREATE, {
        state: {
          bookingIntent,
        },
      });
    }
  };

  return (
    <aside
      className="slot-selection-summary slot-selection-summary--active"
      aria-labelledby="selected-slot-summary-title"
    >
      <div className="slot-selection-summary__header">
        <div className="slot-selection-summary__title-wrapper">
          <span className="slot-selection-summary__check-badge" aria-hidden="true">✓</span>
          <h4 id="selected-slot-summary-title" className="slot-selection-summary__title">
            Selected Time Slot
          </h4>
        </div>

        {onClearSelection && (
          <button
            type="button"
            className="slot-selection-summary__clear-btn"
            onClick={onClearSelection}
            aria-label="Deselect slot"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="slot-selection-summary__body">
        <div className="slot-selection-summary__item">
          <span className="slot-selection-summary__item-label">Resource:</span>
          <strong className="slot-selection-summary__item-value">{resource?.name}</strong>
        </div>

        <div className="slot-selection-summary__item">
          <span className="slot-selection-summary__item-label">Date:</span>
          <strong className="slot-selection-summary__item-value">{formatCalendarDate(date)}</strong>
        </div>

        <div className="slot-selection-summary__item">
          <span className="slot-selection-summary__item-label">Time:</span>
          <strong className="slot-selection-summary__item-value">
            {timeRangeLabel}{' '}
            <Badge variant="primary" size="sm">
              {durationLabel}
            </Badge>
          </strong>
        </div>
      </div>

      <div className="slot-selection-summary__notice">
        <p>
          Final availability is validated atomically when your reservation is submitted.
        </p>
      </div>

      <div className="slot-selection-summary__actions">
        {isAuthenticated ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleContinue}
            className="slot-selection-summary__submit-btn"
          >
            Continue to Reservation
          </Button>
        ) : (
          <div className="slot-selection-summary__auth-prompt">
            <p className="slot-selection-summary__auth-text">
              Sign in to finalize your booking for this time slot.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleContinue}
              className="slot-selection-summary__submit-btn"
            >
              Sign In to Continue
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
