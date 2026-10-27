import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import ErrorState from '../../../components/feedback/ErrorState.jsx';
import BookingFilters from '../components/BookingFilters.jsx';
import BookingList from '../components/BookingList.jsx';
import CancelBookingDialog from '../components/CancelBookingDialog.jsx';
import RescheduleBookingDialog from '../components/RescheduleBookingDialog.jsx';
import bookingService from '../services/bookingService.js';
import { normalizeError } from '../../../utils/error.js';
import { formatDate, formatTimeRange } from '../../../utils/date.js';

/**
 * MyBookingsPage
 *
 * Authenticated user personal booking-management view.
 * Connects to GET /api/v1/bookings/my, synchronizes filter/pagination state with URL
 * search parameters, and provides status filtering, date range filtering, pagination,
 * and direct cancellation and rescheduling dialog workflows.
 */
export default function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state from URL search params
  const statusParam = searchParams.get('status') || '';
  const fromDateParam = searchParams.get('fromDate') || '';
  const toDateParam = searchParams.get('toDate') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '10', 10);

  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: pageParam,
    limit: limitParam,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & Action Feedback states
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingToReschedule, setBookingToReschedule] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Load user bookings from server
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: pageParam,
        limit: limitParam,
      };

      if (statusParam) queryParams.status = statusParam;
      if (fromDateParam) queryParams.fromDate = fromDateParam;
      if (toDateParam) queryParams.toDate = toDateParam;

      const result = await bookingService.getUserBookings(queryParams);
      setBookings(result.bookings);
      setPagination(result.pagination);
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, [pageParam, limitParam, statusParam, fromDateParam, toDateParam]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Update query filters in URL
  const handleFilterChange = (newFilters) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, String(val));
      } else {
        updated.delete(key);
      }
    });

    // Reset to page 1 whenever filters change unless explicit page provided
    if (!newFilters.page) {
      updated.set('page', '1');
    }

    setSearchParams(updated, { replace: true });
  };

  const handlePageChange = (newPage) => {
    const updated = new URLSearchParams(searchParams);
    updated.set('page', String(newPage));
    setSearchParams(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const updated = new URLSearchParams();
    updated.set('page', '1');
    setSearchParams(updated, { replace: true });
  };

  const handleCancelSuccess = () => {
    setBookingToCancel(null);
    setActionFeedback({
      variant: 'success',
      title: 'Reservation Cancelled',
      message: 'Your reservation was cancelled and the time slot was released back to the facility schedule.',
    });
    fetchBookings();
  };

  const handleRescheduleSuccess = (updatedBooking) => {
    setBookingToReschedule(null);
    const dateFormatted = formatDate(updatedBooking.startAt, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = formatTimeRange(updatedBooking.startAt, updatedBooking.endAt);

    setActionFeedback({
      variant: 'success',
      title: 'Reservation Rescheduled',
      message: `Your reservation has been rescheduled to ${dateFormatted} (${timeFormatted}).`,
    });
    fetchBookings();
  };

  const hasActiveFilters = Boolean(statusParam || fromDateParam || toDateParam);

  return (
    <PageContainer className="my-bookings-page">
      <PageHeader
        title="My Reservations"
        subtitle="Review, monitor, and manage your booked campus study rooms, labs, and equipment."
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'My Bookings', path: '/bookings' },
        ]}
      />

      {/* Action Notification Banner */}
      {actionFeedback && (
        <Alert
          variant={actionFeedback.variant}
          title={actionFeedback.title}
          onClose={() => setActionFeedback(null)}
          className="my-bookings-page__action-banner"
        >
          {actionFeedback.message}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <section className="my-bookings-page__filters-section" aria-label="Reservation filters">
        <BookingFilters
          filters={{
            status: statusParam,
            fromDate: fromDateParam,
            toDate: toDateParam,
          }}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalItems={pagination.totalItems}
          isLoading={isLoading}
        />
      </section>

      {/* Content State: Loading, Error, or List */}
      <section className="my-bookings-page__content" aria-live="polite">
        {isLoading ? (
          <LoadingState message="Loading your reservations..." />
        ) : error ? (
          <ErrorState
            title="Failed to Load Reservations"
            message={error.message || 'We encountered an error retrieving your bookings.'}
            errorCode={error.code}
            onRetry={fetchBookings}
          />
        ) : (
          <BookingList
            bookings={bookings}
            pagination={pagination}
            onPageChange={handlePageChange}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            onCancelClick={(b) => setBookingToCancel(b)}
            onRescheduleClick={(b) => setBookingToReschedule(b)}
          />
        )}
      </section>

      {/* Direct Cancellation Dialog */}
      {bookingToCancel && (
        <CancelBookingDialog
          isOpen={Boolean(bookingToCancel)}
          onClose={() => setBookingToCancel(null)}
          booking={bookingToCancel}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Direct Rescheduling Dialog */}
      {bookingToReschedule && (
        <RescheduleBookingDialog
          isOpen={Boolean(bookingToReschedule)}
          onClose={() => setBookingToReschedule(null)}
          booking={bookingToReschedule}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </PageContainer>
  );
}
