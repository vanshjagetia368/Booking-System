import LoadingSpinner from '../ui/LoadingSpinner.jsx';

/**
 * Reusable Loading State Component
 *
 * Displays a centered loading indicator with an accessible message.
 * Supports inline, container, or full-viewport display.
 *
 * @param {object} props
 * @param {string} [props.message='Loading...']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullPage=false]
 * @param {string} [props.className='']
 */
export default function LoadingState({
  message = 'Loading, please wait...',
  size = 'md',
  fullPage = false,
  className = '',
}) {
  const containerClasses = [
    'loading-state',
    fullPage ? 'loading-state--full-page' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size={size} label={message} />
      {message && <p className="loading-state__message">{message}</p>}
    </div>
  );
}
