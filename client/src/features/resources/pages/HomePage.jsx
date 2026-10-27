import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.js';
import { config } from '../../../app/config.js';
import apiClient, { ApiError } from '../../../services/apiClient.js';
import { normalizeErrorMessage } from '../../../utils/error.js';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import { FormField, Input, Select, Textarea } from '../../../components/forms/index.js';
import { LoadingState, ErrorState, Modal } from '../../../components/feedback/index.js';

/**
 * Main Application Home / Landing Overview
 *
 * Provides a clear overview of the Smart Resource Booking System,
 * routes navigation, and an interactive demonstration of the
 * reusable UI foundation primitives and API service layer.
 */
export default function HomePage() {
  // Interactive UI Demo States
  const [buttonsLoading, setButtonsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [apiTestMessage, setApiTestMessage] = useState(null);

  // Form Demo State
  const [demoInput, setDemoInput] = useState('');
  const [demoCategory, setDemoCategory] = useState('');
  const [demoNotes, setDemoNotes] = useState('');
  const [showFormError, setShowFormError] = useState(false);

  const handleTestApi = async () => {
    setApiTestStatus('loading');
    setApiTestMessage(null);

    try {
      // Calls the centralized API client against the backend base URL
      const data = await apiClient.get('/health');
      setApiTestStatus('success');
      setApiTestMessage(
        typeof data === 'object' && data !== null
          ? JSON.stringify(data, null, 2)
          : String(data),
      );
    } catch (err) {
      setApiTestStatus('error');
      const normalized = normalizeErrorMessage(
        err,
        'Backend server is not reachable. Start the Express server with `npm run dev:server` to connect.',
      );
      setApiTestMessage(
        err instanceof ApiError && err.status === 0
          ? `${normalized} (Configured endpoint: ${config.apiBaseUrl})`
          : normalized,
      );
    }
  };

  const featureCards = [
    {
      title: 'Resource Discovery',
      path: ROUTES.RESOURCES,
      stage: 'Prompt 15',
      badgeVariant: 'primary',
      description:
        'Browse and filter active campus resources including study rooms, lecture halls, and lab equipment.',
    },
    {
      title: 'Resource Details & Slots',
      path: ROUTES.RESOURCE_DETAILS('demo-lab-101'),
      stage: 'Prompt 16',
      badgeVariant: 'primary',
      description:
        'Inspect equipment specs, view bookable hours, and check interval availability.',
    },
    {
      title: 'Authentication & Security',
      path: ROUTES.LOGIN,
      stage: 'Prompt 14',
      badgeVariant: 'warning',
      description:
        'Secure user registration, credential validation, session handling, and role permissions.',
    },
    {
      title: 'Personal Bookings',
      path: ROUTES.BOOKINGS,
      stage: 'Prompt 18',
      badgeVariant: 'success',
      description:
        'Track upcoming reservations, inspect past bookings, reschedule times, or cancel slots.',
    },
    {
      title: 'Booking Details',
      path: ROUTES.BOOKING_DETAILS('demo-res-001'),
      stage: 'Prompt 18',
      badgeVariant: 'success',
      description:
        'Review reservation summaries, confirmation identifiers, and schedule details.',
    },
    {
      title: 'Administrator Portal',
      path: ROUTES.ADMIN_DASHBOARD,
      stage: 'Prompt 20',
      badgeVariant: 'danger',
      description:
        'Manage resource inventory, operating schedules, maintenance blackouts, and system metrics.',
    },
  ];

  return (
    <div className="page-container home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__eyebrow">
          <Badge variant="primary" size="md">
            Full-Stack Backend Integrated &bull; Frontend Foundation Complete
          </Badge>
          <span className="hero__stage-text">React 19 &bull; Vite 6 &bull; Express 5 &bull; MongoDB / Mongoose 8</span>
        </div>

        <h1 className="hero__title">
          Smart Resource Booking System
        </h1>

        <p className="hero__lead">
          A modern reservation platform designed for shared campus facilities, study spaces,
          and research laboratories. Built on strict interval conflict prevention, decoupled
          architecture, and server-authoritative validations.
        </p>

        <div className="hero__actions">
          <Button as={Link} to={ROUTES.RESOURCES} variant="primary" size="lg">
            Explore Resource Catalog
          </Button>
          <Button as={Link} to={ROUTES.BOOKINGS} variant="outline" size="lg">
            View My Bookings
          </Button>
          <Button as={Link} to={ROUTES.ADMIN_DASHBOARD} variant="ghost" size="lg">
            Admin Console &rarr;
          </Button>
        </div>
      </section>

      {/* Architecture Alert */}
      <section className="home-alert-section">
        <Alert variant="info" title="Architecture Milestones (Prompts 1–13)">
          Backend APIs, schemas, transactional slot allocation, and documentation are complete (Prompts 1–12).
          Prompt 13 establishes the React frontend foundation, application routing, shared layout, API client,
          accessible form primitives, and global feedback states.
        </Alert>
      </section>

      {/* Feature Domain Navigation */}
      <section className="features-section">
        <PageHeader
          title="Application Navigation & Features"
          description="Access the core functional modules planned across subsequent implementation prompts."
        />

        <div className="features-grid">
          {featureCards.map((card) => (
            <Card key={card.title} className="feature-card">
              <CardHeader>
                <div className="feature-card__meta">
                  <Badge variant={card.badgeVariant} size="sm">
                    {card.stage}
                  </Badge>
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button as={Link} to={card.path} variant="outline" size="sm">
                  Open View &rarr;
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Reusable UI Primitives Showcase */}
      <section className="showcase-section">
        <PageHeader
          title="Shared UI Primitives & Design System"
          description="Consistent, accessible, and responsive components built with vanilla CSS tokens and semantic HTML."
        />

        <div className="showcase-grid">
          {/* Button Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Button Primitives</CardTitle>
              <CardDescription>
                Accessible buttons supporting primary, secondary, outline, danger, ghost variants, and loading spinners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="showcase-group">
                <div className="showcase-row">
                  <Button variant="primary" isLoading={buttonsLoading}>
                    Primary
                  </Button>
                  <Button variant="secondary" isLoading={buttonsLoading}>
                    Secondary
                  </Button>
                  <Button variant="outline" isLoading={buttonsLoading}>
                    Outline
                  </Button>
                  <Button variant="danger" isLoading={buttonsLoading}>
                    Danger
                  </Button>
                  <Button variant="ghost" isLoading={buttonsLoading}>
                    Ghost
                  </Button>
                </div>
                <div className="showcase-row">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setButtonsLoading(!buttonsLoading)}
              >
                {buttonsLoading ? 'Stop Loading State' : 'Toggle Loading Animation'}
              </Button>
            </CardFooter>
          </Card>

          {/* Status Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Status Badges & Tags</CardTitle>
              <CardDescription>
                Standardized tags for resource categories and reservation statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="showcase-group">
                <div className="showcase-row">
                  <Badge variant="success">Confirmed</Badge>
                  <Badge variant="warning">In Maintenance</Badge>
                  <Badge variant="danger">Cancelled</Badge>
                  <Badge variant="primary">Active</Badge>
                  <Badge variant="neutral">Completed</Badge>
                  <Badge variant="default">Study Room</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls & Fields</CardTitle>
              <CardDescription>
                Accessible form primitives with associated labels, validation error states, and helper hints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="showcase-group">
                <FormField
                  id="demo-resource-name"
                  label="Facility Name"
                  required
                  helperText="Enter the name of the campus room or lab."
                  error={showFormError ? 'Facility name is required.' : null}
                >
                  <Input
                    id="demo-resource-name"
                    placeholder="e.g. Science Library Room 302"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    hasError={showFormError}
                  />
                </FormField>

                <FormField
                  id="demo-category"
                  label="Category"
                  required
                  helperText="Choose the asset category."
                >
                  <Select
                    id="demo-category"
                    placeholder="Select a category..."
                    value={demoCategory}
                    onChange={(e) => setDemoCategory(e.target.value)}
                    options={[
                      { value: 'study-room', label: 'Study Room' },
                      { value: 'meeting-room', label: 'Meeting Room' },
                      { value: 'lab-equipment', label: 'Laboratory Equipment' },
                      { value: 'other', label: 'Other Facility' },
                    ]}
                  />
                </FormField>

                <FormField
                  id="demo-notes"
                  label="Booking Notes"
                  helperText="Optional reservation instructions."
                >
                  <Textarea
                    id="demo-notes"
                    placeholder="State any specific requirements or setup needed..."
                    value={demoNotes}
                    onChange={(e) => setDemoNotes(e.target.value)}
                    rows={2}
                  />
                </FormField>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormError(!showFormError)}
              >
                {showFormError ? 'Clear Form Validation Error' : 'Trigger Validation Error State'}
              </Button>
            </CardFooter>
          </Card>

          {/* Feedback & Confirmation Modal */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Modal Dialog</CardTitle>
              <CardDescription>
                Accessible modal dialog with backdrop blur, focus trapping, and Escape key dismissal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="showcase-note">
                Modal dialogs implement WAI-ARIA modal guidelines, including background scroll locking
                and keyboard navigation.
              </p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Open Confirmation Dialog
              </Button>
            </CardContent>
          </Card>

          {/* Feedback Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback & Notification Alerts</CardTitle>
              <CardDescription>
                Accessible alerts with semantic icons for all system feedback channels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="showcase-group">
                <Alert variant="success" title="Success State">
                  Your reservation request was processed cleanly without conflict.
                </Alert>
                <Alert variant="warning" title="Schedule Warning">
                  This facility closes at 20:00. Time slot was clamped to closing hours.
                </Alert>
                <Alert variant="error" title="Validation Conflict">
                  The requested interval overlaps an existing confirmed booking [10:00 – 11:30).
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* API Client Live Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Centralized API Client Verification</CardTitle>
              <CardDescription>
                Test live communication with the configured API URL (<code>{config.apiBaseUrl}</code>).
                Demonstrates honest handling of loading, network errors, and server responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="showcase-note">
                Clicking the button invokes <code>apiClient.get('/health')</code>.
                If the backend is not running, the client catches the error, parses the status,
                and displays a clear, normalized feedback message without throwing unhandled exceptions.
              </p>

              {apiTestStatus === 'loading' && (
                <div className="api-test-loading">
                  <LoadingState message="Connecting to Express backend API..." />
                </div>
              )}

              {apiTestStatus === 'success' && (
                <Alert variant="success" title="Server Connected">
                  <pre className="code-snippet">{apiTestMessage}</pre>
                </Alert>
              )}

              {apiTestStatus === 'error' && (
                <ErrorState
                  title="Backend Not Reachable"
                  message={apiTestMessage}
                  onRetry={handleTestApi}
                  retryLabel="Retry Connection"
                />
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                onClick={handleTestApi}
                isLoading={apiTestStatus === 'loading'}
              >
                Test API Connectivity
              </Button>
            </CardFooter>
          </Card>

          {/* Empty State Component */}
          <Card>
            <CardHeader>
              <CardTitle>Empty State Primitive</CardTitle>
              <CardDescription>
                Structured fallback when search filters or user reservations return no records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Reservations Recorded"
                description="You haven't scheduled any campus facilities or equipment yet. Explore the resource directory to book a slot."
                action={
                  <Button as={Link} to={ROUTES.RESOURCES} variant="secondary" size="sm">
                    Browse Available Facilities
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Confirmation Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Reservation Cancellation"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Keep Reservation
            </Button>
            <Button variant="danger" onClick={() => setIsModalOpen(false)}>
              Cancel Booking
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to cancel your confirmed booking for <strong>Science Library Study Room 302</strong> on <strong>October 29, 2026 [10:00 – 11:30)</strong>?
        </p>
        <p className="text-subtle" style={{ marginTop: '0.75rem' }}>
          This will release your allocated slots immediately for other students while preserving a permanent historical cancellation audit record.
        </p>
      </Modal>
    </div>
  );
}
