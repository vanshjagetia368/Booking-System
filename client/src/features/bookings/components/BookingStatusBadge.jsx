import Badge from '../../../components/ui/Badge.jsx';
import { formatBookingStatus } from '../utils/bookingFormatters.js';

/**
 * BookingStatusBadge Component
 *
 * Renders an accessible, standardized status indicator for reservations.
 * Does not rely on color alone — utilizes distinct icons, structured variants,
 * and clear semantic text labels.
 *
 * @param {object} props
 * @param {string} props.status - 'confirmed' | 'cancelled' | 'completed' | unknown
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Visual badge size
 * @param {string} [props.className=''] - Additional CSS classes
 */
export default function BookingStatusBadge({ status, size = 'md', className = '' }) {
  const { label, variant } = formatBookingStatus(status);

  // Render iconography alongside color for non-color dependent status discrimination
  const renderIcon = () => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return (
          <svg
            className="booking-status-badge__icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="12"
            height="12"
          >
            <polyline points="3 8.5 6.5 12 13 4" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg
            className="booking-status-badge__icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="12"
            height="12"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        );
      case 'completed':
        return (
          <svg
            className="booking-status-badge__icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="12"
            height="12"
          >
            <circle cx="8" cy="8" r="6" />
            <polyline points="8 4 8 8 10.5 10.5" />
          </svg>
        );
      default:
        return (
          <svg
            className="booking-status-badge__icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="12"
            height="12"
          >
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="5" x2="8" y2="8" />
            <line x1="8" y1="11" x2="8.01" y2="11" />
          </svg>
        );
    }
  };

  return (
    <Badge
      variant={variant}
      size={size}
      className={`booking-status-badge booking-status-badge--${status?.toLowerCase() || 'unknown'} ${className}`.trim()}
    >
      <span className="booking-status-badge__content">
        {renderIcon()}
        <span className="booking-status-badge__label">{label}</span>
      </span>
    </Badge>
  );
}
