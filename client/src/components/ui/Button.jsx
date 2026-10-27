import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Reusable Button Component
 *
 * @param {object} props
 * @param {React.ElementType} [props.as='button'] - Custom component or element tag (e.g. Link, 'a')
 * @param {'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon = null,
  children,
  className = '',
  ...restProps
}) {
  const isButtonElement = Component === 'button';
  const isDisabled = disabled || isLoading;

  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    isLoading ? 'btn--loading' : '',
    isDisabled ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const componentProps = {
    className: buttonClasses,
    'aria-busy': isLoading ? 'true' : undefined,
    ...(isButtonElement
      ? { type, disabled: isDisabled }
      : { 'aria-disabled': isDisabled ? 'true' : undefined }),
    ...restProps,
  };

  return (
    <Component {...componentProps}>
      {isLoading && <LoadingSpinner size="sm" className="btn__spinner" />}
      {!isLoading && icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span className="btn__content">{children}</span>
    </Component>
  );
}
