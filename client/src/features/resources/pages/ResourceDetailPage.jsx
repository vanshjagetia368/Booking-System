import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import resourceService from '../services/resourceService.js';
import {
  availabilityService,
  AvailabilityCalendar,
  AvailabilityStatus,
  AvailabilitySlotList,
  SlotSelectionSummary,
  getTodayDateString,
} from '../../availability/index.js';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import LoadingState from '../../../components/feedback/LoadingState.jsx';
import ErrorState from '../../../components/feedback/ErrorState.jsx';
import { formatDuration } from '../../../utils/date.js';
import { normalizeErrorMessage } from '../../../utils/error.js';
import ROUTES from '../../../app/routes.js';

const DAYS_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function getCategoryBadge(category) {
  switch (category) {
    case 'study-room':
      return <Badge variant="info" size="md">Study Room</Badge>;
    case 'meeting-room':
      return <Badge variant="primary" size="md">Meeting Room</Badge>;
    case 'lab-equipment':
      return <Badge variant="warning" size="md">Lab Equipment</Badge>;
    case 'other':
    default:
      return <Badge variant="neutral" size="md">Resource Space</Badge>;
  }
}

/**
 * Resource Detail and Interactive Availability Booking Page
 *
 * Implements Prompt 15 Sections 7–12:
 * - Detailed resource specifications and weekly operating hours
 * - Calendar date selection with 90-day booking boundary
 * - Real-time slot availability queries via Express API
 * - Interactive slot selection with half-open interval presentation
 * - Authentication-aware transition to booking creation
 */
export default function ResourceDetailPage() {
  const { resourceId } = useParams();

  // Resource state
  const [resource, setResource] = useState(null);
  const [isResourceLoading, setIsResourceLoading] = useState(true);
  const [resourceError, setResourceError] = useState(null);

  // Availability state
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [availability, setAvailability] = useState(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  // Selected slot state
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Race condition counter for availability queries
  const latestAvailabilityReq = useRef(0);

  // 1. Fetch resource details
  const fetchResource = useCallback(async () => {
    setIsResourceLoading(true);
    setResourceError(null);

    try {
      const data = await resourceService.getResourceById(resourceId);
      setResource(data);
    } catch (err) {
      setResourceError(err);
    } finally {
      setIsResourceLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  // 2. Fetch availability for selected date
  const fetchAvailability = useCallback(
    async (targetDate) => {
      if (!resourceId) return;

      const reqId = ++latestAvailabilityReq.current;
      setIsAvailabilityLoading(true);
      setAvailabilityError(null);
      // Clear previous slot selection when date changes
      setSelectedSlot(null);

      try {
        const data = await availabilityService.getAvailability(resourceId, targetDate);
        if (reqId === latestAvailabilityReq.current) {
          setAvailability(data);
        }
      } catch (err) {
        if (reqId === latestAvailabilityReq.current) {
          setAvailabilityError(err);
        }
      } finally {
        if (reqId === latestAvailabilityReq.current) {
          setIsAvailabilityLoading(false);
        }
      }
    },
    [resourceId],
  );

  // Trigger availability load once resource is active
  useEffect(() => {
    if (resource && resource.status === 'active') {
      fetchAvailability(selectedDate);
    }
  }, [resource, selectedDate, fetchAvailability]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleSelectSlot = (slot) => {
    // If user clicks the already selected slot, toggle it off; otherwise select it
    if (selectedSlot && selectedSlot.startAt === slot.startAt && selectedSlot.endAt === slot.endAt) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleClearSlot = () => {
    setSelectedSlot(null);
  };

  // Loading state for resource details
  if (isResourceLoading) {
    return <LoadingState message="Loading resource specifications and calendar..." fullPage />;
  }

  // Error state for resource details
  if (resourceError) {
    const isNotFound = resourceError?.status === 404 || resourceError?.code === 'RESOURCE_NOT_FOUND';
    return (
      <PageContainer size="md" className="resource-detail-page">
        <ErrorState
          error={resourceError}
          title={isNotFound ? 'Resource Not Found' : 'Unable to load resource'}
          message={
            isNotFound
              ? 'The requested facility does not exist or has been removed from active service.'
              : normalizeErrorMessage(resourceError, 'Failed to fetch resource information.')
          }
          action={
            <Button as={Link} to={ROUTES.RESOURCES} variant="primary" size="md">
              ← Return to Resource Catalog
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const isInactive = resource?.status !== 'active';

  return (
    <PageContainer size="xl" className="resource-detail-page">
      {/* Navigation Breadcrumb */}
      <nav className="resource-detail-page__breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.RESOURCES} className="resource-detail-page__back-link">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Resource Catalog
        </Link>
      </nav>

      {/* Inactive Resource Notice */}
      {isInactive && (
        <Alert
          variant="warning"
          title="Resource Currently Inactive"
          className="resource-detail-page__inactive-alert"
        >
          This facility is currently inactive and is not accepting reservations. You can inspect its
          specifications, but new bookings cannot be scheduled at this time.
        </Alert>
      )}

      {/* Resource Header and Overview */}
      <header className="resource-detail-page__header">
        <div className="resource-detail-page__title-area">
          <div className="resource-detail-page__badges">
            {getCategoryBadge(resource?.category)}
            <Badge variant={isInactive ? 'warning' : 'success'} size="md">
              {resource?.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <h1 className="resource-detail-page__title">{resource?.name}</h1>
          <p className="resource-detail-page__location">
            <span aria-hidden="true">📍</span> {resource?.location || 'Campus Facility'}
          </p>
        </div>

        {/* Quick Highlights Bar */}
        <div className="resource-detail-page__highlights">
          <div className="resource-highlight-card">
            <span className="resource-highlight-card__label">Seating Capacity</span>
            <strong className="resource-highlight-card__value">{resource?.capacity} attendees</strong>
          </div>

          <div className="resource-highlight-card">
            <span className="resource-highlight-card__label">Slot Duration</span>
            <strong className="resource-highlight-card__value">
              {formatDuration(resource?.slotDurationMinutes || 30)} intervals
            </strong>
          </div>

          <div className="resource-highlight-card">
            <span className="resource-highlight-card__label">Schedule Time Zone</span>
            <strong className="resource-highlight-card__value">{resource?.timeZone || 'UTC'}</strong>
          </div>
        </div>
      </header>

      {/* Main Layout Grid: Resource Info & Operating Hours + Availability & Slots */}
      <div className="resource-detail-page__grid">
        {/* Left Column: Description & Operating Hours */}
        <section className="resource-detail-page__info" aria-label="Facility information">
          <div className="resource-detail-card">
            <h2 className="resource-detail-card__heading">About this Facility</h2>
            <p className="resource-detail-card__text">
              {resource?.description ||
                'No detailed description has been provided for this resource space.'}
            </p>
          </div>

          {/* Operating Hours Weekly Grid */}
          <div className="resource-detail-card">
            <h2 className="resource-detail-card__heading">Operating Schedule</h2>
            <div className="resource-schedule-table-wrapper">
              <table className="resource-schedule-table">
                <thead>
                  <tr>
                    <th>Day of Week</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS_ORDER.map((dayKey) => {
                    const sched = resource?.operatingHours?.[dayKey];
                    const isOpen = Boolean(sched && sched.isOpen);

                    return (
                      <tr key={dayKey} className={isOpen ? '' : 'resource-schedule-table__row--closed'}>
                        <td className="resource-schedule-table__day">{DAY_LABELS[dayKey]}</td>
                        <td className="resource-schedule-table__hours">
                          {isOpen ? `${sched.openTime} – ${sched.closeTime}` : 'Closed'}
                        </td>
                        <td>
                          <Badge variant={isOpen ? 'success' : 'neutral'} size="sm">
                            {isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Availability Calendar & Interactive Slot Selection */}
        <section className="resource-detail-page__availability" aria-label="Bookable time slots">
          <div className="availability-panel">
            <h2 className="availability-panel__heading">Check Availability & Reserve</h2>

            {isInactive ? (
              <div className="availability-panel__disabled-message">
                <p>This resource is inactive. Availability calendars are disabled.</p>
              </div>
            ) : (
              <>
                {/* 1. Date Selector Controls */}
                <AvailabilityCalendar
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  timeZone={resource?.timeZone || 'UTC'}
                  isLoading={isAvailabilityLoading}
                />

                {/* 2. Availability Status Summary */}
                {availability && (
                  <AvailabilityStatus
                    operatingHours={availability.operatingHours}
                    summary={availability.summary}
                  />
                )}

                {/* 3. Slot List or Error State */}
                {availabilityError ? (
                  <ErrorState
                    error={availabilityError}
                    title="Could not retrieve availability"
                    message={normalizeErrorMessage(
                      availabilityError,
                      'Unable to query schedule availability for this date.',
                    )}
                    onRetry={() => fetchAvailability(selectedDate)}
                    retryLabel="Retry Availability"
                  />
                ) : (
                  <AvailabilitySlotList
                    slots={availability?.slots || []}
                    operatingHours={availability?.operatingHours || {}}
                    timeZone={resource?.timeZone || 'UTC'}
                    isLoading={isAvailabilityLoading}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSelectSlot}
                  />
                )}

                {/* 4. Slot Selection Summary & Booking Transition */}
                <SlotSelectionSummary
                  resource={resource}
                  date={selectedDate}
                  selectedSlot={selectedSlot}
                  timeZone={resource?.timeZone || 'UTC'}
                  onClearSelection={handleClearSlot}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
