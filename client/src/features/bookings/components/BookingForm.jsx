import Textarea from '../../../components/forms/Textarea.jsx';
import FormField from '../../../components/forms/FormField.jsx';

/**
 * Booking Form Component
 *
 * Captures optional user notes/requirements before reservation creation.
 * Enforces the 1000-character backend limit.
 *
 * @param {object} props
 * @param {string} props.notes
 * @param {(notes: string) => void} props.onNotesChange
 * @param {boolean} [props.disabled=false]
 * @param {string | null} [props.error=null]
 */
export default function BookingForm({
  notes = '',
  onNotesChange,
  disabled = false,
  error = null,
}) {
  const maxLength = 1000;
  const remaining = maxLength - (notes?.length || 0);

  return (
    <div className="booking-form-section">
      <FormField
        id="booking-notes"
        label="Reservation Notes or Special Requirements"
        helperText="Optional: Provide meeting purpose, equipment needs, or attendee notes."
        error={error}
      >
        <Textarea
          id="booking-notes"
          name="notes"
          placeholder="e.g. Quarterly team planning session, projector required"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          disabled={disabled}
          hasError={Boolean(error)}
        />
        <div className="booking-form__char-count" aria-live="polite">
          {remaining} character{remaining === 1 ? '' : 's'} remaining
        </div>
      </FormField>
    </div>
  );
}
