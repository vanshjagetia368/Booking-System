import {
  getTodayDateString,
  getMaxAdvanceDateString,
  addDaysToDateString,
  formatCalendarDate,
  isValidCalendarDate,
} from '../utils/availabilityUtils.js';
import Button from '../../../components/ui/Button.jsx';

/**
 * Interactive Date Selection for Resource Availability
 *
 * Enforces calendar boundaries:
 * - Cannot select dates in the past (min: today)
 * - Cannot select dates beyond the 90-day maximum advance booking policy (max: today + 90 days)
 * - Provides quick navigation buttons: "Previous Day", "Today", "Tomorrow", "Next Day"
 * - Displays operating schedule time zone
 *
 * @param {object} props
 * @param {string} props.selectedDate - YYYY-MM-DD
 * @param {(newDate: string) => void} props.onDateChange
 * @param {string} [props.timeZone='UTC']
 * @param {boolean} [props.isLoading=false]
 */
export default function AvailabilityCalendar({
  selectedDate,
  onDateChange,
  timeZone = 'UTC',
  isLoading = false,
}) {
  const today = getTodayDateString();
  const maxDate = getMaxAdvanceDateString(90);

  const canGoPrevious = selectedDate > today;
  const canGoNext = selectedDate < maxDate;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (isValidCalendarDate(val)) {
      if (val < today) {
        onDateChange(today);
      } else if (val > maxDate) {
        onDateChange(maxDate);
      } else {
        onDateChange(val);
      }
    }
  };

  const handleStepDay = (step) => {
    const nextDate = addDaysToDateString(selectedDate, step);
    if (nextDate >= today && nextDate <= maxDate) {
      onDateChange(nextDate);
    }
  };

  return (
    <div className="availability-calendar" aria-label="Select booking calendar date">
      <div className="availability-calendar__header">
        <div className="availability-calendar__title-group">
          <h3 className="availability-calendar__title">Select Date</h3>
          <span className="availability-calendar__timezone">
            Schedules and slots shown in <strong>{timeZone}</strong>
          </span>
        </div>

        {/* Quick Date Steppers */}
        <div className="availability-calendar__quick-nav">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(today)}
            disabled={selectedDate === today || isLoading}
          >
            Today
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(addDaysToDateString(today, 1))}
            disabled={selectedDate === addDaysToDateString(today, 1) || isLoading}
          >
            Tomorrow
          </Button>
        </div>
      </div>

      <div className="availability-calendar__controls">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleStepDay(-1)}
          disabled={!canGoPrevious || isLoading}
          aria-label="Previous day"
          className="availability-calendar__step-btn"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Previous
        </Button>

        <div className="availability-calendar__input-wrapper">
          <input
            id="availability-date-picker"
            type="date"
            className="availability-calendar__input"
            value={selectedDate}
            min={today}
            max={maxDate}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="Booking calendar date"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleStepDay(1)}
          disabled={!canGoNext || isLoading}
          aria-label="Next day"
          className="availability-calendar__step-btn"
        >
          Next
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Button>
      </div>

      <div className="availability-calendar__selected-label" aria-live="polite">
        <span className="availability-calendar__selected-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
          </svg>
        </span>
        <strong className="availability-calendar__selected-text">
          {formatCalendarDate(selectedDate)}
        </strong>
      </div>
    </div>
  );
}
