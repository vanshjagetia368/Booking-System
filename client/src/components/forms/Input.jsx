import { forwardRef } from 'react';

/**
 * Reusable Accessible Form Input Primitive
 *
 * @param {object} props
 * @param {string} [props.type='text'] - Standard HTML input type
 * @param {boolean} [props.hasError=false] - Whether to apply error styling and aria-invalid
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 */
export const Input = forwardRef(function Input(
  {
    type = 'text',
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

  const inputClasses = [
    'form-input',
    hasError ? 'form-input--error' : '',
    disabled ? 'form-input--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      ref={ref}
      id={id}
      type={type}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={combinedDescribedBy}
      className={inputClasses}
      {...restProps}
    />
  );
});

export default Input;
