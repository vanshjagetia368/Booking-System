import Badge from '../../../components/ui/Badge.jsx';

/**
 * Availability Status & Summary Metrics Display
 *
 * Displays slot breakdown counters returned by the availability engine.
 *
 * @param {object} props
 * @param {object} props.operatingHours
 * @param {boolean} props.operatingHours.isOpen
 * @param {string} [props.operatingHours.openTime]
 * @param {string} [props.operatingHours.closeTime]
 * @param {object} props.summary
 * @param {number} props.summary.totalSlots
 * @param {number} props.summary.availableSlots
 * @param {number} props.summary.reservedSlots
 * @param {number} props.summary.maintenanceSlots
 * @param {number} props.summary.pastSlots
 */
export default function AvailabilityStatus({ operatingHours = {}, summary = {} }) {
  const { isOpen = true, openTime, closeTime } = operatingHours;
  const {
    totalSlots = 0,
    availableSlots = 0,
    reservedSlots = 0,
    maintenanceSlots = 0,
    pastSlots = 0,
  } = summary;

  return (
    <div className="availability-status" aria-label="Slot availability metrics">
      <div className="availability-status__schedule">
        <span className="availability-status__label">Daily Schedule:</span>
        {isOpen ? (
          <Badge variant="success" size="sm">
            Open: {openTime} – {closeTime}
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            Facility Closed
          </Badge>
        )}
      </div>

      {isOpen && totalSlots > 0 && (
        <div className="availability-status__counts">
          <Badge variant="success" size="sm">
            {availableSlots} Available
          </Badge>

          {reservedSlots > 0 && (
            <Badge variant="danger" size="sm">
              {reservedSlots} Booked
            </Badge>
          )}

          {maintenanceSlots > 0 && (
            <Badge variant="warning" size="sm">
              {maintenanceSlots} Maintenance
            </Badge>
          )}

          {pastSlots > 0 && (
            <Badge variant="neutral" size="sm">
              {pastSlots} Past
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
