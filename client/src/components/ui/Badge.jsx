/**
 * Reusable Badge / Status Tag Component
 *
 * @param {object} props
 * @param {'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral'} [props.variant='default']
 * @param {'sm' | 'md'} [props.size='md']
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export default function Badge({
  variant = 'default',
  size = 'md',
  icon = null,
  children,
  className = '',
}) {
  return (
    <span
      className={`badge badge--${variant} badge--${size} ${className}`.trim()}
    >
      {icon && <span className="badge__icon" aria-hidden="true">{icon}</span>}
      <span className="badge__text">{children}</span>
    </span>
  );
}
