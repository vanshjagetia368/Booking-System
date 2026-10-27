import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import BookingCard from './BookingCard.jsx';
import Button from '../../../components/ui/Button.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';

/**
 * BookingList Component
 *
 * Renders the responsive list/grid of reservation cards, empty states, and pagination controls.
 *
 * @param {object} props
 * @param {Array<object>} props.bookings - Array of booking objects
 * @param {object} props.pagination - Pagination metadata { page, totalPages, hasNextPage, hasPrevPage, totalItems }
 * @param {Function} props.onPageChange - Callback when switching pages
 * @param {boolean} [props.hasActiveFilters=false] - Whether any filters are currently active
 * @param {Function} [props.onResetFilters] - Reset filters callback
 * @param {Function} [props.onCancelClick] - Optional cancellation callback
 * @param {Function} [props.onRescheduleClick] - Optional rescheduling callback
 */
export default function BookingList({
  bookings = [],
  pagination = {},
  onPageChange,
  hasActiveFilters = false,
  onResetFilters,
  onCancelClick,
  onRescheduleClick,
}) {
  const { page = 1, totalPages = 1, hasNextPage = false, hasPrevPage = false } = pagination;

  // Empty State Handling
  if (bookings.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          title="No Matching Reservations"
          description="None of your bookings match the selected status or date filters."
          action={
            onResetFilters && (
              <Button variant="secondary" onClick={onResetFilters}>
                Clear All Filters
              </Button>
            )
          }
        />
      );
    }

    return (
      <EmptyState
        title="No Reservations Yet"
        description="You have not created any facility or equipment reservations. Browse our campus resources to book a slot."
        action={
          <Link to={ROUTES.RESOURCES}>
            <Button variant="primary">Explore Resources</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="booking-list-container">
      {/* Cards Grid */}
      <div className="booking-list" role="feed" aria-label="My Bookings List">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onCancelClick={onCancelClick}
            onRescheduleClick={onRescheduleClick}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="booking-list__pagination" aria-label="Bookings pagination">
          <div className="booking-list__pagination-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="booking-list__pagination-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrevPage}
              aria-label="Go to previous page"
            >
              Previous
            </Button>

            {/* Page number indicators */}
            <div className="booking-list__page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const isCurrent = p === page;
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="booking-list__page-pill-wrapper">
                      {showEllipsis && <span className="booking-list__pagination-ellipsis">…</span>}
                      <button
                        type="button"
                        className={`booking-list__page-btn ${isCurrent ? 'booking-list__page-btn--active' : ''}`}
                        onClick={() => onPageChange(p)}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
