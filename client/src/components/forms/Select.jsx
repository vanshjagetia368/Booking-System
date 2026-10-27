import { forwardRef } from 'react';

/**
 * Reusable Accessible Form Select Primitive
 *
 * @param {object} props
 * @param {Array<{ value: string | number, label: string, disabled?: boolean }> | string[]} [props.options]
 * @param {string} [props.placeholder] - Default unselected label
 * @param {boolean} [props.hasError=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.children] - Optional custom <option> children
 * @param {string} [props.className='']
 */
export const Select = forwardRef(function Select(
  {
    options = [],
    placeholder,
    hasError = false,
    disabled = false,
    children,
    className = '',
    id,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  },
  ref,
) {
  const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
  const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy].filter(Boolean).join(' ') || undefined;

  const selectClasses = [
    'form-select',
    hasError ? 'form-select--error' : '',
    disabled ? 'form-select--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <select
      ref={ref}
      id={id}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={combinedDescribedBy}
      className={selectClasses}
      {...restProps}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {children
        ? children
        : options.map((option) => {
            const isObject = typeof option === 'object' && option !== null;
            const value = isObject ? option.value : option;
            const label = isObject ? option.label : option;
            const isDisabled = isObject ? Boolean(option.disabled) : false;

            return (
              <option key={String(value)} value={value} disabled={isDisabled}>
                {label}
              </option>
            );
          })}
    </select>
  );
});

export default Select;
