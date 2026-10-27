import { useState, useRef } from 'react';
import Modal from '../../../components/feedback/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import bookingService from '../services/bookingService.js';
import {
  formatBookingReference,
  formatBookingStatus,
} from '../utils/bookingFormatters.js';
import { formatDate, formatTimeRange } from '../../../utils/date.js';
import { normalizeError } from '../../../utils/error.js';
import { getPolicyViolationMessage } from '../utils/bookingPolicyUtils.js';

/**
 * CancelBookingDialog Component
 *
 * Confirmation dialog for cancelling an eligible reservation.
 * Submits to PATCH /api/v1/bookings/:bookingId/cancel with optional reason.
 * Employs synchronous submission guards to prevent duplicate requests.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {() => void} props.onClose - Dismiss callback
 * @param {object} props.booking - Authoritative booking record to cancel
 * @param {(updatedBooking: object) => void} props.onSuccess - Callback invoked on server-confirmed cancellation
 */
export default function CancelBookingDialog({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Synchronous guard against rapid double-clicks or repeated keyboard Enter activations
  const isSubmittingRef = useRef(false);

  if (!booking) return null;

  const resource = booking.resource || {};
  const reference = formatBookingReference(booking.id);
  const formattedDate = formatDate(booking.startAt, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTimeRange = formatTimeRange(booking.startAt, booking.endAt);
  const { label: statusLabel } = formatBookingStatus(booking.status);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing mid-request
    setError(null);
    setReason('');
    onClose();
  };

  const handleConfirmCancel = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedBooking = await bookingService.cancelBooking({
        bookingId: booking.id,
        reason: reason.trim() || null,
      });

      // Reset local state and notify parent
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setReason('');
      if (onSuccess) {
        onSuccess(updatedBooking);
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
      title="Confirm Cancellation"
      size="md"
      className="cancel-booking-dialog"
    >
      <div className="cancel-booking-dialog__content">
        {/* Booking Summary Card */}
        <div className="cancel-booking-dialog__summary">
          <div className="cancel-booking-dialog__summary-header">
            <span className="cancel-booking-dialog__ref">{reference}</span>
            <span className="cancel-booking-dialog__resource-name">
              {resource.name || 'Campus Facility'}
            </span>
          </div>

          <div className="cancel-booking-dialog__summary-details">
            <div className="cancel-booking-dialog__detail-row">
              <span className="cancel-booking-dialog__detail-label">Schedule:</span>
              <span className="cancel-booking-dialog__detail-value">
                {formattedDate} • {formattedTimeRange}
              </span>
            </div>
            {resource.location && (
              <div className="cancel-booking-dialog__detail-row">
                <span className="cancel-booking-dialog__detail-label">Location:</span>
                <span className="cancel-booking-dialog__detail-value">{resource.location}</span>
              </div>
            )}
            <div className="cancel-booking-dialog__detail-row">
              <span className="cancel-booking-dialog__detail-label">Status:</span>
              <span className="cancel-booking-dialog__detail-value">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Policy Warning Banner */}
        <Alert variant="warning" className="cancel-booking-dialog__warning">
          Cancelling will immediately release your reserved time slot for other campus users.
          Historical records are preserved, but this cancellation cannot be undone.
        </Alert>

        {/* Optional Reason Textarea */}
        <div className="cancel-booking-dialog__reason-field">
          <label htmlFor="cancellation-reason" className="cancel-booking-dialog__label">
            Reason for Cancellation <span className="cancel-booking-dialog__optional">(optional)</span>
          </label>
          <textarea
            id="cancellation-reason"
            rows="3"
            maxLength={500}
            className="cancel-booking-dialog__textarea"
            placeholder="Let us know why you are cancelling (e.g. schedule conflict, meeting moved)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="cancel-booking-dialog__char-count">
            {reason.length} / 500 characters
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <Alert variant="danger" className="cancel-booking-dialog__error">
            {getPolicyViolationMessage(error, error.message)}
          </Alert>
        )}

        {/* Actions Button Bar */}
        <div className="cancel-booking-dialog__actions">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Keep Reservation
          </Button>

          <Button
            variant="danger"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="cancel-booking-dialog__confirm-btn"
          >
            {isSubmitting ? (
              <span className="cancel-booking-dialog__spinner-label">
                <svg className="spinner-icon" viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Cancelling Reservation...
              </span>
            ) : (
              'Yes, Cancel Reservation'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
