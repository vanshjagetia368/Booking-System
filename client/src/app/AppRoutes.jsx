import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import FeaturePlaceholder from '../components/layout/FeaturePlaceholder.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import {
  ResourceDiscoveryPage,
  ResourceDetailPage,
} from '../features/resources/index.js';
import {
  LoginPage,
  RegisterPage,
  ProtectedRoute,
  AdminRoute,
} from '../features/auth/index.js';
import {
  BookingCreatePage,
  BookingConfirmationPage,
  MyBookingsPage,
  BookingDetailsPage,
} from '../features/bookings/index.js';

/**
 * Centralized Route Hierarchy
 *
 * Defines all route paths, layout wrappers, and view handlers.
 * Employs ProtectedRoute for authenticated user domains and AdminRoute for administrative operations.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Resource Discovery & Catalog */}
        <Route path={ROUTES.HOME} element={<ResourceDiscoveryPage />} />
        <Route path={ROUTES.RESOURCES} element={<ResourceDiscoveryPage />} />

        {/* Public Resource Details & Availability Calendar */}
        <Route path={ROUTES.RESOURCE_DETAILS(':resourceId')} element={<ResourceDetailPage />} />


        {/* Authentication Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Authenticated User Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Booking Creation Workflow (Prompt 16) */}
          <Route path={ROUTES.BOOKING_CREATE} element={<BookingCreatePage />} />

          {/* Booking Confirmation Receipt (Prompt 16) */}
          <Route path={ROUTES.BOOKING_CONFIRMATION(':bookingId')} element={<BookingConfirmationPage />} />

          {/* Personal Bookings History (Prompt 17) */}
          <Route path={ROUTES.BOOKINGS} element={<MyBookingsPage />} />

          {/* Backward-compatibility redirect for /my-bookings -> /bookings */}
          <Route path="/my-bookings" element={<Navigate to={ROUTES.BOOKINGS} replace />} />

          {/* Individual Booking Details (Prompt 17) */}
          <Route path={ROUTES.BOOKING_DETAILS(':bookingId')} element={<BookingDetailsPage />} />
        </Route>

        {/* Administrator-Only Protected Routes */}
        <Route element={<AdminRoute />}>
          {/* Administrator Portal - Overview Dashboard (Prompt 20) */}
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <FeaturePlaceholder
                title="Administrator Operations Console"
                promptStage="Prompt 20/22: Administrator Analytics & Operational Overview"
                description="Central dashboard for campus facility coordinators and system administrators."
                plannedCapabilities={[
                  'Real-time metrics: resource counts, upcoming bookings, in-effect maintenance blocks',
                  'Summary metrics powered by memory-efficient MongoDB aggregation pipelines',
                  'Quick navigation to resource inventory, booking oversight, and maintenance controls',
                ]}
              />
            }
          />

          {/* Administrator Portal - Resource Inventory (Prompt 19) */}
          <Route
            path={ROUTES.ADMIN_RESOURCES}
            element={
              <FeaturePlaceholder
                title="Admin: Resource Inventory Management"
                promptStage="Prompt 19/22: Administrator Resource & Booking Management"
                description="Create, update, activate, deactivate, and configure operating schedules for campus assets."
                plannedCapabilities={[
                  'Create new bookable resource with custom slot durations (multiples of 15 min)',
                  'Configure daily operating schedules with openTime and closeTime rules',
                  'Toggle active/inactive status to manage catalog visibility',
                  'Partial updates to capacity, location, and description',
                ]}
              />
            }
          />

          {/* Administrator Portal - Reservation Oversight (Prompt 19) */}
          <Route
            path={ROUTES.ADMIN_BOOKINGS}
            element={
              <FeaturePlaceholder
                title="Admin: Reservation Oversight & Audit"
                promptStage="Prompt 19/22: Administrator Resource & Booking Management"
                description="Comprehensive reservation oversight across all facilities, users, and statuses."
                plannedCapabilities={[
                  'Search and filter reservations across all facilities, users, and statuses',
                  'Controlled administrative cancellation with mandatory audit reason logging',
                  'Deterministic chronological sorting and pagination',
                ]}
              />
            }
          />

          {/* Administrator Portal - Maintenance Blackout Management (Prompt 19) */}
          <Route
            path={ROUTES.ADMIN_MAINTENANCE}
            element={
              <FeaturePlaceholder
                title="Admin: Resource Maintenance Blackout Management"
                promptStage="Prompt 19/22: Administrator Resource & Booking Management"
                description="Schedule and manage maintenance blackout periods to take resources temporarily offline."
                plannedCapabilities={[
                  'Schedule maintenance on half-open interval [startAt, endAt)',
                  'Conflict protection preventing overlap with existing confirmed user bookings',
                  'Automatic slot availability restoration upon maintenance block deletion',
                ]}
              />
            }
          />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
