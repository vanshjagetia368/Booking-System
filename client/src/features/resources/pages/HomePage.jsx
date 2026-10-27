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
  const [apiTestStatus, setApiTestStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [apiTestMessage, setApiTestMessage] = useState(null);

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
      stage: 'Prompt 4',
      badgeVariant: 'primary',
      description:
        'Browse and filter active campus resources including study rooms, lecture halls, and lab equipment.',
    },
    {
      title: 'Resource Details & Slots',
      path: ROUTES.RESOURCE_DETAILS('demo-lab-101'),
      stage: 'Prompt 5',
      badgeVariant: 'primary',
      description:
        'Inspect equipment specs, view bookable hours, and check interval availability.',
    },
    {
      title: 'Authentication & Security',
      path: ROUTES.LOGIN,
      stage: 'Prompt 3',
      badgeVariant: 'warning',
      description:
        'Secure user registration, credential validation, session handling, and role permissions.',
    },
    {
      title: 'Personal Bookings',
      path: ROUTES.MY_BOOKINGS,
      stage: 'Prompt 6',
      badgeVariant: 'success',
      description:
        'Track upcoming reservations, inspect past bookings, reschedule times, or cancel slots.',
    },
    {
      title: 'Booking Confirmation',
      path: ROUTES.BOOKING_DETAILS('demo-res-001'),
      stage: 'Prompt 6',
      badgeVariant: 'success',
      description:
        'Review reservation summaries, confirmation identifiers, and schedule details.',
    },
    {
      title: 'Administrator Portal',
      path: ROUTES.ADMIN_DASHBOARD,
      stage: 'Prompt 7',
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
            Prompt 2 / 22 Foundation
          </Badge>
          <span className="hero__stage-text">React 19 &bull; Vite &bull; React Router 7</span>
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
          <Button as={Link} to={ROUTES.MY_BOOKINGS} variant="outline" size="lg">
            View My Bookings
          </Button>
          <Button as={Link} to={ROUTES.ADMIN_DASHBOARD} variant="ghost" size="lg">
            Admin Console &rarr;
          </Button>
        </div>
      </section>

      {/* Architecture Alert */}
      <section className="home-alert-section">
        <Alert
          variant="info"
          title="Frontend Foundation Active"
        >
          The React client shell, centralized routing, semantic responsive layout,
          UI primitive library, and standardized API client are established. Later prompts
          will progressively implement authentication, inventory discovery, schedule availability,
          and transactional booking flows.
        </Alert>
      </section>

      {/* Planned Feature Routes Directory */}
      <section className="features-section">
        <PageHeader
          title="Application Route Navigation"
          description="Explore the centralized route hierarchy established for the Smart Resource Booking System."
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
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button as={Link} to={card.path} variant="secondary" size="sm">
                  View Route Shell &rarr;
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* UI Primitives & API Client Showcase */}
      <section className="showcase-section">
        <PageHeader
          title="Reusable UI Foundation & API Layer Showcase"
          description="Interactive verification of component primitives and error/state handling built for this foundation."
        />

        <div className="showcase-grid">
          {/* Button Primitives */}
          <Card>
            <CardHeader>
              <CardTitle>Button Primitives & States</CardTitle>
              <CardDescription>
                Accessible buttons supporting variants, sizes, disabled, and loading states.
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
                  <Badge variant="warning">Pending Review</Badge>
                  <Badge variant="danger">Cancelled</Badge>
                  <Badge variant="primary">Active</Badge>
                  <Badge variant="neutral">Completed</Badge>
                  <Badge variant="default">Study Room</Badge>
                </div>
              </div>
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
                  <Alert variant="info" title="Connecting...">
                    Sending HTTP request to <code>{config.apiBaseUrl}/health</code>...
                  </Alert>
                </div>
              )}

              {apiTestStatus === 'success' && (
                <Alert variant="success" title="Server Connected">
                  <pre className="code-snippet">{apiTestMessage}</pre>
                </Alert>
              )}

              {apiTestStatus === 'error' && (
                <Alert variant="error" title="Backend Not Reachable">
                  <p>{apiTestMessage}</p>
                  <p className="text-subtle">
                    Tip: Run <code>npm run dev:server</code> in a terminal to launch the Express API.
                  </p>
                </Alert>
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
    </div>
  );
}
