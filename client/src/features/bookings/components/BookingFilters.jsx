import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';

/**
 * BookingFilters Component
 *
 * Provides status tab selection, date range filtering, and reset controls
 * strictly aligned with the backend query contract for GET /api/v1/bookings/my.
 *
 * Supported backend parameters:
 * - status: 'confirmed' | 'cancelled' | 'completed' | ''
 * - fromDate: YYYY-MM-DD
 * - toDate: YYYY-MM-DD
 *
 * @param {object} props
 * @param {object} props.filters - Active filter values { status, fromDate, toDate }
 * @param {Function} props.onFilterChange - Callback invoked when any filter changes
 * @param {Function} props.onResetFilters - Callback invoked when clearing all filters
 * @param {number} [props.totalItems=0] - Total count of matching bookings
 * @param {boolean} [props.isLoading=false] - Whether a query is currently in flight
 */
export default function BookingFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalItems = 0,
  isLoading = false,
}) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleStatusClick = (statusValue) => {
    onFilterChange({ status: statusValue, page: 1 });
  };

  const handleDateChange = (field, value) => {
    onFilterChange({ [field]: value, page: 1 });
  };

  const hasActiveFilters = Boolean(filters.status || filters.fromDate || filters.toDate);

  return (
    <div className="booking-filters" aria-label="Filter bookings">
      {/* Status Segmented Tabs */}
      <div className="booking-filters__status-tabs" role="tablist" aria-label="Filter by booking status">
        {statusOptions.map((opt) => {
          const isActive = (filters.status || '') === opt.value;
          return (
            <button
              key={opt.value || 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`booking-filters__tab ${isActive ? 'booking-filters__tab--active' : ''}`}
              onClick={() => handleStatusClick(opt.value)}
              disabled={isLoading}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Date Range & Reset Bar */}
      <div className="booking-filters__controls-row">
        <div className="booking-filters__dates-group">
          <div className="booking-filters__date-field">
            <label htmlFor="booking-filter-from-date" className="booking-filters__label">
              From Date
            </label>
            <input
              id="booking-filter-from-date"
              type="date"
              className="booking-filters__date-input"
              value={filters.fromDate || ''}
              onChange={(e) => handleDateChange('fromDate', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="booking-filters__date-field">
            <label htmlFor="booking-filter-to-date" className="booking-filters__label">
              To Date
            </label>
            <input
              id="booking-filter-to-date"
              type="date"
              className="booking-filters__date-input"
              value={filters.toDate || ''}
              min={filters.fromDate || undefined}
              onChange={(e) => handleDateChange('toDate', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="booking-filters__meta-group">
          <span className="booking-filters__count-text" aria-live="polite">
            Found <strong>{totalItems}</strong> {totalItems === 1 ? 'reservation' : 'reservations'}
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isLoading}
              className="booking-filters__reset-btn"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="booking-filters__chips" aria-label="Active filters">
          {filters.status && (
            <Badge variant="primary" size="sm" className="booking-filters__chip">
              Status: {filters.status}
              <button
                type="button"
                className="booking-filters__chip-remove"
                onClick={() => onFilterChange({ status: '', page: 1 })}
                aria-label="Remove status filter"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.fromDate && (
            <Badge variant="neutral" size="sm" className="booking-filters__chip">
              From: {filters.fromDate}
              <button
                type="button"
                className="booking-filters__chip-remove"
                onClick={() => onFilterChange({ fromDate: '', page: 1 })}
                aria-label="Remove start date filter"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.toDate && (
            <Badge variant="neutral" size="sm" className="booking-filters__chip">
              To: {filters.toDate}
              <button
                type="button"
                className="booking-filters__chip-remove"
                onClick={() => onFilterChange({ toDate: '', page: 1 })}
                aria-label="Remove end date filter"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
