/**
 * Reusable Alert Component
 *
 * @param {object} props
 * @param {'info' | 'success' | 'warning' | 'error'} [props.variant='info']
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {() => void} [props.onDismiss]
 * @param {string} [props.className='']
 */
export default function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) {
  const isUrgent = variant === 'error' || variant === 'warning';
  const role = isUrgent ? 'alert' : 'status';

  return (
    <div
      className={`alert alert--${variant} ${className}`.trim()}
      role={role}
    >
      <div className="alert__icon" aria-hidden="true">
        {variant === 'info' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-9-3a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm1 3a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {variant === 'success' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {variant === 'warning' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {variant === 'error' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <div className="alert__body">
        {title && <h3 className="alert__title">{title}</h3>}
        <div className="alert__message">{children}</div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="alert__dismiss"
          aria-label="Dismiss message"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
