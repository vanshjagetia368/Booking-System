import { forwardRef } from 'react';

/**
 * Reusable Accessible Form Textarea Primitive
 *
 * @param {object} props
 * @param {number} [props.rows=3]
 * @param {boolean} [props.hasError=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 */
export const Textarea = forwardRef(function Textarea(
  {
    rows = 3,
    hasError = false,
    disabled = false,
    className = '',
    id,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  },
  ref,
) {
  const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
  const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy].filter(Boolean).join(' ') || undefined;

  const textareaClasses = [
    'form-textarea',
    hasError ? 'form-textarea--error' : '',
    disabled ? 'form-textarea--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={combinedDescribedBy}
      className={textareaClasses}
      {...restProps}
    />
  );
});

export default Textarea;
