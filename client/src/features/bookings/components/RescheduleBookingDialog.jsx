import { useState, useRef } from 'react';
import Modal from '../../../components/feedback/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import RescheduleAvailabilityPicker from '../../availability/components/RescheduleAvailabilityPicker.jsx';
import bookingService from '../services/bookingService.js';
import {
  formatBookingReference,
  calculateBookingDurationMinutes,
} from '../utils/bookingFormatters.js';
import { formatDate, formatTimeRange, formatDuration } from '../../../utils/date.js';
import { normalizeError } from '../../../utils/error.js';
import { getPolicyViolationMessage } from '../utils/bookingPolicyUtils.js';

/**
 * RescheduleBookingDialog Component
 *
 * Full-featured modal dialog allowing authenticated users to select an
 * alternative valid time interval on the same facility and submit an atomic
 * rescheduling request to PATCH /api/v1/bookings/:bookingId/reschedule.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {() => void} props.onClose - Dismiss callback
 * @param {object} props.booking - Authoritative booking record to reschedule
 * @param {(updatedBooking: object) => void} props.onSuccess - Callback invoked on server-confirmed rescheduling
 */
export default function RescheduleBookingDialog({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) {
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Synchronous guard against double-clicks and repeated keyboard activation
  const isSubmittingRef = useRef(false);

  if (!booking) return null;

  const resource = booking.resource || {};
  const resourceId = booking.resourceId?._id || booking.resourceId?.id || booking.resourceId;
  const reference = formatBookingReference(booking.id);
  const origDuration = calculateBookingDurationMinutes(booking.startAt, booking.endAt);

  const formattedCurrentDate = formatDate(booking.startAt, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedCurrentTime = formatTimeRange(booking.startAt, booking.endAt);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing mid-flight
    setError(null);
    setSelectedInterval(null);
    onClose();
  };

  const handleConfirmReschedule = async () => {
    if (!selectedInterval || isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await bookingService.rescheduleBooking({
        bookingId: booking.id,
        startAt: selectedInterval.startAt,
        endAt: selectedInterval.endAt,
      });

      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSelectedInterval(null);

      if (onSuccess) {
        onSuccess(result.booking || result);
      }
      onClose();
    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      const normalized = normalizeError(err);
      setError(normalized);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reschedule Reservation"
      size="lg"
      className="reschedule-booking-dialog"
    >
      <div className="reschedule-booking-dialog__content">
        {/* Existing Booking Overview */}
        <div className="reschedule-booking-dialog__current-banner">
          <div className="reschedule-booking-dialog__current-meta">
            <span className="reschedule-booking-dialog__ref">{reference}</span>
            <span className="reschedule-booking-dialog__resource-name">
              {resource.name || 'Campus Facility'}
            </span>
          </div>

          <div className="reschedule-booking-dialog__current-schedule">
            <span className="reschedule-booking-dialog__label">Current Schedule:</span>
            <span className="reschedule-booking-dialog__schedule-text">
              {formattedCurrentDate} • {formattedCurrentTime} ({formatDuration(origDuration)})
            </span>
          </div>
        </div>

        {/* Real Availability Picker */}
        <div className="reschedule-booking-dialog__picker-wrapper">
          <RescheduleAvailabilityPicker
            resourceId={resourceId}
            resource={resource}
            currentStartAt={booking.startAt}
            currentEndAt={booking.endAt}
            selectedInterval={selectedInterval}
            onSelectInterval={setSelectedInterval}
          />
        </div>

        {/* Server Error / Conflict Feedback */}
        {error && (
          <Alert variant="danger" className="reschedule-booking-dialog__error">
            {getPolicyViolationMessage(error, error.message)}
          </Alert>
        )}

        {/* Action Controls */}
        <div className="reschedule-booking-dialog__actions">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Keep Current Booking
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirmReschedule}
            disabled={!selectedInterval || isSubmitting}
            className="reschedule-booking-dialog__confirm-btn"
          >
            {isSubmitting ? (
              <span className="reschedule-booking-dialog__spinner-label">
                <svg className="spinner-icon" viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Confirming Reschedule...
              </span>
            ) : (
              'Confirm Reschedule'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
