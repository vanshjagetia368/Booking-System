import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth.js';
import bookingService from '../services/bookingService.js';
import resourceService from '../../resources/services/resourceService.js';
import BookingSummary from '../components/BookingSummary.jsx';
import BookingForm from '../components/BookingForm.jsx';
import BookingSubmitButton from '../components/BookingSubmitButton.jsx';
import BookingConflictMessage from '../components/BookingConflictMessage.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import { normalizeErrorMessage } from '../../../utils/error.js';
import ROUTES from '../../../app/routes.js';

/**
 * Booking Creation Page
 *
 * Implements Prompt 16 Sections 1, 5, 6, 8, 9, & 10:
 * - Receives and verifies selected resource and time interval
 * - Pre-validates half-open [startAt, endAt) duration and future timestamp
 * - Submits atomic booking creation request to backend
 * - Prevents accidental duplicate submissions with synchronous refs
 * - Handles scheduling conflicts (409) and network failures gracefully
 * - Navigates to verified booking confirmation upon server success
 */
export default function BookingCreatePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract booking intent from navigation state with fallback to URL query parameters
  const stateIntent = location.state?.bookingIntent;
  const resourceId = stateIntent?.resourceId || searchParams.get('resourceId');
  const startAt = stateIntent?.startAt || searchParams.get('startAt');
  const endAt = stateIntent?.endAt || searchParams.get('endAt');
  const date = stateIntent?.date || searchParams.get('date') || (startAt ? startAt.slice(0, 10) : '');
  const timeZone = stateIntent?.timeZone || 'UTC';

  // State
  const [resource, setResource] = useState(stateIntent?.resource || null);
  const [isLoadingResource, setIsLoadingResource] = useState(!stateIntent?.resource && Boolean(resourceId));
  const [resourceError, setResourceError] = useState(null);

  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Synchronous guard against immediate duplicate keyboard/mouse clicks
  const isSubmittingRef = useRef(false);

  // Load resource details if not fully present in navigation state
  useEffect(() => {
    if (resourceId && !resource) {
      setIsLoadingResource(true);
      resourceService
        .getResourceById(resourceId)
        .then((data) => setResource(data))
        .catch((err) => setResourceError(err))
        .finally(() => setIsLoadingResource(false));
    }
  }, [resourceId, resource]);

  // Handle case where user navigates directly without selecting a slot
  if (!resourceId || !startAt || !endAt) {
    return (
      <PageContainer size="md" className="booking-create-page">
        <div className="booking-missing-selection">
          <div className="booking-missing-selection__icon" aria-hidden="true">📅</div>
          <h2 className="booking-missing-selection__title">No Time Slot Selected</h2>
          <p className="booking-missing-selection__message">
            To make a reservation, please select an available time slot from a resource’s calendar first.
          </p>
          <Button as={Link} to={ROUTES.RESOURCES} variant="primary" size="md">
            Browse Available Resources
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isLoadingResource) {
    return <LoadingState message="Preparing reservation details..." fullPage />;
  }

  if (resourceError) {
    return (
      <PageContainer size="md" className="booking-create-page">
        <Alert variant="error" title="Resource Details Unavailable">
          {normalizeErrorMessage(resourceError, 'Unable to load resource information for this booking.')}
        </Alert>
        <div style={{ marginTop: '1rem' }}>
          <Button as={Link} to={ROUTES.RESOURCES} variant="primary" size="md">
            ← Return to Resources
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Pre-validate intervals
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  const isInvalidInterval = Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate;
  const isPastStart = startDate.getTime() <= Date.now();

  const handleNotesChange = (val) => {
    setNotes(val);
    if (val.length > 1000) {
      setNotesError('Notes cannot exceed 1000 characters.');
    } else if (notesError) {
      setNotesError(null);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // 1. Synchronous duplicate-submission barrier
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    // 2. Client-side sanity checks
    if (isInvalidInterval) {
      setGeneralError('Invalid time interval. Booking end time must be later than start time.');
      return;
    }
    if (isPastStart) {
      setGeneralError('The selected time slot has already started or elapsed. Please select an upcoming slot.');
      return;
    }
    if (notes.length > 1000) {
      setNotesError('Notes cannot exceed 1000 characters.');
      return;
    }

    setConflictError(null);
    setGeneralError(null);
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      // 3. Submit real booking creation request to Express API
      const booking = await bookingService.createBooking({
        resourceId,
        startAt,
        endAt,
        notes,
      });

      // 4. Navigate to verified confirmation view on server success
      const confirmedId = booking.id || booking._id;
      navigate(ROUTES.BOOKING_CONFIRMATION(confirmedId), {
        replace: true,
        state: { booking },
      });
    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      if (err.status === 409 || err.isConflict) {
        // Backend conflict: slot was taken by concurrent user or maintenance scheduled
        setConflictError(err);
      } else if (err.status === 401) {
        // Session expired during checkout
        navigate(ROUTES.LOGIN, {
          state: {
            from: location,
            bookingIntent: stateIntent,
          },
        });
      } else if (err.status === 0 || err.isNetworkError) {
        setGeneralError(
          'Network connection was lost while submitting your reservation. Please verify your connection or check "My Bookings" before trying again to avoid duplicate reservations.',
        );
      } else {
        setGeneralError(
          normalizeErrorMessage(
            err,
            'Unable to complete reservation. Please review details and try again.',
          ),
        );
      }
    }
  };

  return (
    <PageContainer size="md" className="booking-create-page">
      <header className="booking-create-page__header">
        <h1 className="booking-create-page__title">Confirm Your Reservation</h1>
        <p className="booking-create-page__subtitle">
          Review your chosen resource and scheduled interval before finalizing your booking.
        </p>
      </header>

      {/* Authenticated User Identity Banner */}
      <div className="booking-identity-banner">
        <span className="booking-identity-banner__icon" aria-hidden="true">👤</span>
        <span className="booking-identity-banner__text">
          Reserving as: <strong>{user?.name || user?.email}</strong>
        </span>
      </div>

      {/* Conflict or Interval Warning Alerts */}
      {isPastStart && (
        <Alert
          variant="warning"
          title="Slot Already Elapsed"
          className="booking-create-page__alert"
        >
          This time slot has already started. Please return to the resource calendar to select a future interval.
        </Alert>
      )}

      {conflictError && (
        <BookingConflictMessage
          error={conflictError}
          resourceId={resourceId}
          onDismiss={() => setConflictError(null)}
        />
      )}

      {generalError && (
        <Alert
          variant="error"
          title="Booking Submission Failed"
          onDismiss={() => setGeneralError(null)}
          className="booking-create-page__alert"
        >
          {generalError}
        </Alert>
      )}

      {/* Booking Summary Section */}
      <section className="booking-create-page__summary-section">
        <BookingSummary
          resource={resource || { _id: resourceId, name: stateIntent?.resourceName || 'Resource' }}
          date={date}
          startAt={startAt}
          endAt={endAt}
          timeZone={timeZone}
        />
      </section>

      {/* Booking Form (Notes) Section */}
      <section className="booking-create-page__form-section">
        <BookingForm
          notes={notes}
          onNotesChange={handleNotesChange}
          disabled={isSubmitting || isPastStart}
          error={notesError}
        />
      </section>

      {/* Final Submission Actions */}
      <div className="booking-create-page__actions">
        <BookingSubmitButton
          isLoading={isSubmitting}
          disabled={isPastStart || isInvalidInterval}
          onClick={handleSubmit}
        />

        <p className="booking-create-page__legal-notice">
          By completing this reservation, you agree to follow university facility guidelines and adhere to schedule boundaries.
        </p>
      </div>
    </PageContainer>
  );
}
