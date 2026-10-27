import Button from '../../../components/ui/Button.jsx';

/**
 * Booking Submission Button Component
 *
 * Implements accessible submission states and guards against duplicate clicks.
 *
 * @param {object} props
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {() => void} props.onClick
 */
export default function BookingSubmitButton({
  isLoading = false,
  disabled = false,
  onClick,
}) {
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      isLoading={isLoading}
      disabled={disabled || isLoading}
      onClick={onClick}
      className="booking-submit-button"
      aria-label={isLoading ? 'Allocating booking slots...' : 'Confirm and complete reservation'}
    >
      {isLoading ? 'Allocating Slots...' : 'Confirm & Complete Reservation'}
    </Button>
  );
}
