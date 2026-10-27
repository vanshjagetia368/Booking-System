/**
 * Accessible Form Field Container Component
 *
 * Wraps a form control with a linked label, optional helper hint,
 * and inline validation error message with full ARIA linkage.
 *
 * @param {object} props
 * @param {string} props.id - Control element identifier (for htmlFor binding)
 * @param {string} [props.label] - Field label text
 * @param {boolean} [props.required=false] - Whether the field is mandatory
 * @param {string | null} [props.error] - Validation error message to display
 * @param {string} [props.helperText] - Supplementary hint text for user guidance
 * @param {React.ReactNode} props.children - Input, Select, or Textarea control
 * @param {string} [props.className='']
 */
export default function FormField({
  id,
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) {
  const errorId = error && id ? `${id}-error` : undefined;
  const helperId = helperText && id ? `${id}-helper` : undefined;

  return (
    <div className={`form-group ${error ? 'form-group--error' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="form-label__required" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}

      <div className="form-control-wrapper">
        {children}
      </div>

      {helperText && !error && (
        <p id={helperId} className="form-helper-text">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="form-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
