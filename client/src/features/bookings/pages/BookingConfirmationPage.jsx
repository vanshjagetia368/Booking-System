import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import bookingService from '../services/bookingService.js';
import BookingConfirmation from '../components/BookingConfirmation.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import ErrorState from '../../../components/feedback/ErrorState.jsx';
import Button from '../../../components/ui/Button.jsx';
import { normalizeErrorMessage } from '../../../utils/error.js';
import ROUTES from '../../../app/routes.js';

/**
 * Booking Confirmation Page
 *
 * Implements Prompt 16 Section 11:
 * - Displays verified booking confirmation based on authoritative server response
 * - Supports direct URL navigation and page refreshes by fetching via getBookingById
 * - Defends against unverified or falsified success displays
 */
export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();

  // Use state-passed booking if available and ID matches
  const stateBooking = location.state?.booking;
  const isMatchingStateBooking = Boolean(
    stateBooking && (stateBooking.id === bookingId || stateBooking._id === bookingId),
  );

  const [booking, setBooking] = useState(isMatchingStateBooking ? stateBooking : null);
  const [isLoading, setIsLoading] = useState(!isMatchingStateBooking);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If not already populated from navigation state, fetch from server
    if (!isMatchingStateBooking && bookingId) {
      setIsLoading(true);
      setError(null);

      bookingService
        .getBookingById(bookingId)
        .then((data) => {
          setBooking(data);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [bookingId, isMatchingStateBooking]);

  if (isLoading) {
    return <LoadingState message="Verifying booking confirmation receipt..." fullPage />;
  }

  if (error || !booking) {
    const isNotFound = error?.status === 404 || error?.code === 'BOOKING_NOT_FOUND';

    return (
      <PageContainer size="md" className="booking-confirmation-page">
        <ErrorState
          error={error}
          title={isNotFound ? 'Booking Receipt Not Found' : 'Unable to Retrieve Booking'}
          message={
            isNotFound
              ? 'We could not locate a reservation corresponding to this reference code under your account.'
              : normalizeErrorMessage(error, 'Failed to retrieve confirmed reservation details.')
          }
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button as={Link} to={ROUTES.BOOKINGS} variant="primary" size="md">
                View My Bookings
              </Button>
              <Button as={Link} to={ROUTES.RESOURCES} variant="outline" size="md">
                Browse Resources
              </Button>
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md" className="booking-confirmation-page">
      <BookingConfirmation booking={booking} />
    </PageContainer>
  );
}
