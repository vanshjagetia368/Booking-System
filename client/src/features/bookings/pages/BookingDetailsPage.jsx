import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Button from '../../../components/ui/Button.jsx';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import ErrorState from '../../../components/feedback/ErrorState.jsx';
import BookingDetailsPanel from '../components/BookingDetailsPanel.jsx';
import bookingService from '../services/bookingService.js';
import { formatBookingReference } from '../utils/bookingFormatters.js';
import { normalizeError } from '../../../utils/error.js';

/**
 * BookingDetailsPage Component
 *
 * Dedicated view for an individual reservation record at /bookings/:bookingId.
 * Retrieves authoritative data from GET /api/v1/bookings/:bookingId, handles ownership/not-found
 * error states without information leakage, and provides back-navigation to My Bookings.
 */
export default function BookingDetailsPage() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setError({
        message: 'No booking identifier was provided in the route.',
        code: 'MISSING_BOOKING_ID',
      });
      setIsLoading(false);
      return;
    }

    // Basic format validation: 24-character hex string
    const hexRegex = /^[0-9a-fA-F]{24}$/;
    if (!hexRegex.test(bookingId)) {
      setError({
        message: 'The requested reservation identifier is malformed or invalid.',
        code: 'INVALID_BOOKING_ID',
        status: 404,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const reference = formatBookingReference(bookingId);

  return (
    <PageContainer className="booking-details-page">
      <PageHeader
        title={booking ? `${booking.resource?.name || 'Reservation'} Details` : 'Reservation Details'}
        subtitle={`Booking Reference ${reference}`}
        breadcrumbs={[
          { label: 'Home', path: ROUTES.HOME },
          { label: 'My Bookings', path: ROUTES.BOOKINGS },
          { label: reference, path: ROUTES.BOOKING_DETAILS(bookingId) },
        ]}
      />

      <div className="booking-details-page__nav-back">
        <Link to={ROUTES.BOOKINGS}>
          <Button variant="ghost" size="sm">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <line x1="13" y1="8" x2="3" y2="8" />
              <polyline points="7 4 3 8 7 12" />
            </svg>
            Back to My Bookings
          </Button>
        </Link>
      </div>

      <section className="booking-details-page__content" aria-live="polite">
        {isLoading ? (
          <LoadingState message="Loading reservation details..." />
        ) : error ? (
          <ErrorState
            title={error.status === 404 || error.code === 'BOOKING_NOT_FOUND' ? 'Reservation Not Found' : 'Unable to Load Details'}
            message={
              error.status === 404 || error.code === 'BOOKING_NOT_FOUND'
                ? 'The requested booking could not be found, or you do not have permission to view it.'
                : error.message || 'An unexpected error occurred while loading this reservation.'
            }
            errorCode={error.code}
            onRetry={error.status !== 404 ? fetchBooking : undefined}
            action={
              <Link to={ROUTES.BOOKINGS}>
                <Button variant="secondary">Return to My Bookings</Button>
              </Link>
            }
          />
        ) : (
          <BookingDetailsPanel booking={booking} />
        )}
      </section>
    </PageContainer>
  );
}
