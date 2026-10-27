/**
 * Reusable Loading Spinner Component
 *
 * @param {object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {string} [props.className='']
 * @param {string} [props.label='Loading...']
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  label = 'Loading...',
}) {
  return (
    <span
      className={`loading-spinner-wrapper loading-spinner-wrapper--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`loading-spinner loading-spinner--${size}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner__track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="loading-spinner__indicator"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
