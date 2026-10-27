import { formatSlotInterval, getSlotReasonDescription } from '../utils/availabilityUtils.js';
import Alert from '../../../components/ui/Alert.jsx';
import Badge from '../../../components/ui/Badge.jsx';

/**
 * Interactive Slot List for Resource Availability
 *
 * Renders the real candidate slots returned by the backend availability engine.
 * Distinguishes available slots, booked slots, maintenance blackouts, and past times.
 *
 * @param {object} props
 * @param {Array<object>} props.slots - Server-evaluated slot records
 * @param {object} props.operatingHours
 * @param {string} [props.timeZone='UTC']
 * @param {boolean} [props.isLoading=false]
 * @param {object | null} props.selectedSlot - Currently selected slot
 * @param {(slot: object) => void} props.onSelectSlot
 */
export default function AvailabilitySlotList({
  slots = [],
  operatingHours = {},
  timeZone = 'UTC',
  isLoading = false,
  selectedSlot = null,
  onSelectSlot,
}) {
  if (isLoading) {
    return (
      <div className="availability-slot-list" aria-busy="true" aria-label="Loading available slots">
        <div className="availability-slot-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="availability-slot availability-slot--skeleton">
              <span className="skeleton skeleton--text" style={{ width: '60%' }} />
              <span className="skeleton skeleton--badge" style={{ width: '30%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle closed schedule day
  if (operatingHours.isOpen === false) {
    return (
      <div className="availability-slot-empty">
        <Alert variant="info" title="Facility Closed">
          This facility is closed on this calendar day according to its weekly operating schedule.
          Please select another date using the date selector above.
        </Alert>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="availability-slot-empty">
        <Alert variant="warning" title="No Time Slots Available">
          No bookable time slots could be generated for this date. Check another calendar date.
        </Alert>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="availability-slot-list">
      {availableCount === 0 && (
        <Alert
          variant="warning"
          title="All Slots Unavailable"
          className="availability-slot-list__alert"
        >
          All time slots on this date are currently booked, in the past, or blocked for maintenance.
          Please select an upcoming date to find open availability.
        </Alert>
      )}

      <div
        className="availability-slot-grid"
        role="group"
        aria-label="Available time slots"
      >
        {slots.map((slot) => {
          const isSelected = Boolean(
            selectedSlot &&
              selectedSlot.startAt === slot.startAt &&
              selectedSlot.endAt === slot.endAt,
          );

          const timeIntervalLabel = formatSlotInterval(slot.startAt, slot.endAt, timeZone);
          const reasonLabel = getSlotReasonDescription(slot.reason);

          if (!slot.available) {
            return (
              <div
                key={`${slot.startAt}-${slot.endAt}`}
                className="availability-slot availability-slot--unavailable"
                aria-disabled="true"
                title={`${timeIntervalLabel} (${reasonLabel})`}
              >
                <div className="availability-slot__time">{timeIntervalLabel}</div>
                <div className="availability-slot__status">
                  <Badge variant="neutral" size="sm">
                    {reasonLabel}
                  </Badge>
                </div>
              </div>
            );
          }

          return (
            <button
              key={`${slot.startAt}-${slot.endAt}`}
              type="button"
              className={`availability-slot availability-slot--available ${
                isSelected ? 'availability-slot--selected' : ''
              }`}
              onClick={() => onSelectSlot(slot)}
              aria-pressed={isSelected}
              aria-label={`Select slot ${timeIntervalLabel}, Available`}
            >
              <div className="availability-slot__time">{timeIntervalLabel}</div>

              <div className="availability-slot__status">
                {isSelected ? (
                  <Badge variant="success" size="sm" className="availability-slot__selected-badge">
                    <span className="availability-slot__check" aria-hidden="true">✓</span>
                    Selected
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Available
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
