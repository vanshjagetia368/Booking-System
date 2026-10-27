import { useState, useEffect, useCallback } from 'react';
import availabilityService from '../services/availabilityService.js';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import { formatTime, formatTimeRange, formatDuration, formatDate } from '../../../utils/date.js';
import { calculateBookingDurationMinutes } from '../../bookings/utils/bookingFormatters.js';

/**
 * RescheduleAvailabilityPicker Component
 *
 * Provides date navigation and real server-calculated slot availability
 * for selecting a replacement interval during reservation rescheduling.
 *
 * @param {object} props
 * @param {string} props.resourceId - 24-character hexadecimal MongoDB ObjectId
 * @param {object} [props.resource] - Resource specifications
 * @param {string | Date} props.currentStartAt - Current booking start timestamp
 * @param {string | Date} props.currentEndAt - Current booking end timestamp
 * @param {{ startAt: string, endAt: string } | null} props.selectedInterval - Currently selected replacement interval
 * @param {(interval: { startAt: string, endAt: string } | null) => void} props.onSelectInterval - Selection callback
 */
export default function RescheduleAvailabilityPicker({
  resourceId,
  resource,
  currentStartAt,
  currentEndAt,
  selectedInterval,
  onSelectInterval,
}) {
  // Format today's date as YYYY-MM-DD
  const today = new Date();
  const formatYmd = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYmd(today);
  const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const maxDateStr = formatYmd(maxDate);

  // Initialize date to current booking date (or today if current booking is today/past)
  const currentBookingDate = new Date(currentStartAt);
  const initialDateStr = currentBookingDate > today ? formatYmd(currentBookingDate) : todayStr;

  const [selectedDate, setSelectedDate] = useState(initialDateStr);
  const [availability, setAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate target duration from original booking
  const targetDurationMinutes = calculateBookingDurationMinutes(currentStartAt, currentEndAt);

  // Fetch real availability from backend
  const fetchAvailability = useCallback(async () => {
    if (!resourceId || !selectedDate) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await availabilityService.getAvailability(resourceId, selectedDate);
      setAvailability(data);
    } catch (err) {
      setError(err?.message || 'Unable to retrieve availability for this date.');
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Handle slot click
  const handleSlotClick = (slot) => {
    if (!slot.available) return;

    // By default, select this slot's interval
    // If the original booking was multi-slot, check if consecutive slots exist to match target duration
    const slotDuration = resource?.slotDurationMinutes || availability?.slotDurationMinutes || 30;
    const slotsNeeded = Math.max(1, Math.round(targetDurationMinutes / slotDuration));

    if (slotsNeeded > 1 && availability?.slots) {
      const slotIndex = availability.slots.findIndex((s) => s.startAt === slot.startAt);
      if (slotIndex !== -1 && slotIndex + slotsNeeded <= availability.slots.length) {
        const potentialSlots = availability.slots.slice(slotIndex, slotIndex + slotsNeeded);
        const allAvailable = potentialSlots.every((s) => s.available);

        if (allAvailable) {
          const finalEnd = potentialSlots[potentialSlots.length - 1].endAt;
          onSelectInterval({
            startAt: slot.startAt,
            endAt: finalEnd,
          });
          return;
        }
      }
    }

    // Default to the clicked slot's interval
    onSelectInterval({
      startAt: slot.startAt,
      endAt: slot.endAt,
    });
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    onSelectInterval(null); // Clear selected interval on date change
  };

  const setDateOffset = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    handleDateChange(formatYmd(target));
  };

  // Check if a slot is currently selected
  const isSlotSelected = (slot) => {
    if (!selectedInterval) return false;
    const selStart = new Date(selectedInterval.startAt).getTime();
    const selEnd = new Date(selectedInterval.endAt).getTime();
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    return slotStart >= selStart && slotEnd <= selEnd;
  };

  // Check if a slot matches the original booking
  const isOriginalBookingSlot = (slot) => {
    const origStart = new Date(currentStartAt).getTime();
    const origEnd = new Date(currentEndAt).getTime();
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    return slotStart >= origStart && slotEnd <= origEnd;
  };

  return (
    <div className="reschedule-picker">
      {/* Date Navigation Toolbar */}
      <div className="reschedule-picker__date-nav">
        <div className="reschedule-picker__date-input-wrapper">
          <label htmlFor="reschedule-date-picker" className="reschedule-picker__date-label">
            Replacement Date:
          </label>
          <input
            id="reschedule-date-picker"
            type="date"
            className="reschedule-picker__date-input"
            min={todayStr}
            max={maxDateStr}
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div className="reschedule-picker__quick-dates">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateOffset(0)}
            className={selectedDate === todayStr ? 'reschedule-picker__quick-btn--active' : ''}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateOffset(1)}
          >
            Tomorrow
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateOffset(7)}
          >
            +1 Week
          </Button>
        </div>
      </div>

      {/* Target Duration Hint */}
      <div className="reschedule-picker__target-hint">
        Original duration: <strong>{formatDuration(targetDurationMinutes)}</strong>. Click an available slot to allocate your replacement interval.
      </div>

      {/* Slots Section */}
      <div className="reschedule-picker__slots-container">
        {isLoading ? (
          <div className="reschedule-picker__loading">
            <LoadingSpinner size="md" />
            <p>Loading real availability for {formatDate(selectedDate)}...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="reschedule-picker__alert">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAvailability}>
              Retry Availability
            </Button>
          </Alert>
        ) : !availability?.operatingHours?.isOpen ? (
          <div className="reschedule-picker__closed-notice">
            <p>The facility is closed on {formatDate(selectedDate)}.</p>
            <p className="reschedule-picker__closed-sub">Please select another date to view available hours.</p>
          </div>
        ) : availability?.slots?.length === 0 ? (
          <div className="reschedule-picker__empty-notice">
            <p>No available time slots configured for this date.</p>
          </div>
        ) : (
          <div className="reschedule-picker__grid" role="group" aria-label="Available replacement slots">
            {availability.slots.map((slot) => {
              const isSelected = isSlotSelected(slot);
              const isCurrent = isOriginalBookingSlot(slot);

              let statusText = 'Available';
              let badgeVariant = 'success';

              if (!slot.available) {
                switch (slot.reason) {
                  case 'PAST_TIME':
                    statusText = 'Past';
                    badgeVariant = 'neutral';
                    break;
                  case 'MAINTENANCE':
                    statusText = 'Maintenance';
                    badgeVariant = 'danger';
                    break;
                  case 'RESERVED':
                    statusText = isCurrent ? 'Current Slot' : 'Reserved';
                    badgeVariant = isCurrent ? 'primary' : 'warning';
                    break;
                  default:
                    statusText = 'Unavailable';
                    badgeVariant = 'neutral';
                }
              }

              return (
                <button
                  key={slot.startAt}
                  type="button"
                  className={`reschedule-slot-btn ${
                    slot.available ? 'reschedule-slot-btn--available' : 'reschedule-slot-btn--unavailable'
                  } ${isSelected ? 'reschedule-slot-btn--selected' : ''} ${
                    isCurrent ? 'reschedule-slot-btn--current' : ''
                  }`}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.available}
                  aria-pressed={isSelected}
                  aria-label={`${formatTime(slot.startAt)} to ${formatTime(slot.endAt)}, ${statusText}`}
                >
                  <span className="reschedule-slot-btn__time">
                    {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                  </span>
                  <Badge variant={isSelected ? 'primary' : badgeVariant} size="sm">
                    {isSelected ? 'Selected' : statusText}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Interval Summary */}
      {selectedInterval && (
        <div className="reschedule-picker__selection-summary">
          <div className="reschedule-picker__selection-badge">Proposed New Schedule</div>
          <div className="reschedule-picker__selection-text">
            <strong>{formatDate(selectedInterval.startAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong> •{' '}
            {formatTimeRange(selectedInterval.startAt, selectedInterval.endAt)} (
            {formatDuration(calculateBookingDurationMinutes(selectedInterval.startAt, selectedInterval.endAt))})
          </div>
        </div>
      )}
    </div>
  );
}
