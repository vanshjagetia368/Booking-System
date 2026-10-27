import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import FeaturePlaceholder from '../components/layout/FeaturePlaceholder.jsx';
import HomePage from '../features/resources/pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/**
 * Centralized Route Hierarchy
 *
 * Defines all route paths, layout wrappers, and view handlers.
 * Unimplemented feature domains display structured, honest FeaturePlaceholder views
 * until their corresponding implementation prompts.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Landing Overview */}
        <Route path={ROUTES.HOME} element={<HomePage />} />

        {/* Resource Discovery & Catalog */}
        <Route
          path={ROUTES.RESOURCES}
          element={
            <FeaturePlaceholder
              title="Resource Discovery & Catalog"
              promptStage="Prompt 4/22: Resource Discovery & Filtering"
              description="Browse active study rooms, conference spaces, and laboratory instruments with category and capacity filtering."
              plannedCapabilities={[
                'Search and filter by category (study rooms, labs, media equipment)',
                'Filter by capacity, equipment features, and location',
                'Status indicators for active, inactive, and under-maintenance resources',
                'Fast client-side query string synchronization',
              ]}
            />
          }
        />

        {/* Resource Details & Availability */}
        <Route
          path={ROUTES.RESOURCE_DETAILS()}
          element={
            <FeaturePlaceholder
              title="Resource Details & Availability Calendar"
              promptStage="Prompt 5/22: Resource Availability & Details"
              description="Inspect specifications, operating hours, and bookable time slots on an interactive calendar."
              plannedCapabilities={[
                'Detailed specifications, equipment inventory, and rules',
                'Visual date picker and daily schedule breakdown',
                'Half-open [start, end) time interval slot selection',
                'Real-time conflict detection against maintenance blackouts and bookings',
              ]}
            />
          }
        />

        {/* Authentication - Login */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <FeaturePlaceholder
              title="User Authentication — Sign In"
              promptStage="Prompt 3/22: Authentication & Session Management"
              description="Secure authentication supporting ordinary users and administrators."
              plannedCapabilities={[
                'Credential validation with password hashing (bcrypt)',
                'JWT session management and secure authorization headers',
                'Role-based permissions (User vs. Administrator)',
                'Graceful session expiry and renewal handling',
              ]}
            />
          }
        />

        {/* Authentication - Registration */}
        <Route
          path={ROUTES.REGISTER}
          element={
            <FeaturePlaceholder
              title="User Registration — Create Account"
              promptStage="Prompt 3/22: Authentication & Session Management"
              description="Register new user accounts with input validation and role assignment."
              plannedCapabilities={[
                'Form validation for name, institutional email, and secure password',
                'Duplicate account prevention',
                'Automatic session initialization upon successful registration',
              ]}
            />
          }
        />

        {/* Personal Bookings */}
        <Route
          path={ROUTES.MY_BOOKINGS}
          element={
            <FeaturePlaceholder
              title="My Reservations & Booking History"
              promptStage="Prompt 6/22: Booking Workflow & History"
              description="Track current reservations, view booking history, and manage existing allocations."
              plannedCapabilities={[
                'List active upcoming bookings and past historical records',
                'Eligible booking cancellation with automatic slot release',
                'Reschedule reservation with atomic interval reassignment',
                'Filter bookings by status: confirmed, cancelled, completed',
              ]}
            />
          }
        />

        {/* Booking Confirmation / Details */}
        <Route
          path={ROUTES.BOOKING_DETAILS()}
          element={
            <FeaturePlaceholder
              title="Booking Confirmation & Receipt"
              promptStage="Prompt 6/22: Booking Workflow & History"
              description="Detailed view of a specific reservation with confirmation code and schedule."
              plannedCapabilities={[
                'Unique reservation identifier and timestamped receipt',
                'Resource details and allocated time interval [start, end)',
                'Cancellation policy verification and action controls',
              ]}
            />
          }
        />

        {/* Administrator Portal - Dashboard */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <FeaturePlaceholder
              title="Administrator Operations Console"
              promptStage="Prompt 7/22: Administrator Resource & Booking Management"
              description="Central dashboard for campus facility coordinators and system administrators."
              plannedCapabilities={[
                'System metrics: active resources, current reservations, utilization rates',
                'Quick links to resource inventory and reservation audit logs',
                'Maintenance schedule overview and alert notices',
              ]}
            />
          }
        />

        {/* Administrator Portal - Resource Inventory */}
        <Route
          path={ROUTES.ADMIN_RESOURCES}
          element={
            <FeaturePlaceholder
              title="Admin: Resource Inventory Management"
              promptStage="Prompt 7/22: Administrator Resource & Booking Management"
              description="Create, update, activate, deactivate, and configure operating schedules for campus assets."
              plannedCapabilities={[
                'Create new bookable resource with custom slot durations (e.g. 30m, 60m)',
                'Define operating hours and advance booking limits',
                'Schedule maintenance blackout intervals',
                'Toggle active/inactive status to temporarily prevent bookings',
              ]}
            />
          }
        />

        {/* Administrator Portal - Reservation Oversight */}
        <Route
          path={ROUTES.ADMIN_BOOKINGS}
          element={
            <FeaturePlaceholder
              title="Admin: Reservation Oversight & Audit"
              promptStage="Prompt 7/22: Administrator Resource & Booking Management"
              description="Comprehensive reservation oversight across all resources and users."
              plannedCapabilities={[
                'Search and filter reservations across all facilities and users',
                'Administrative cancellation with reason logging',
                'Conflict resolution and override controls',
              ]}
            />
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
