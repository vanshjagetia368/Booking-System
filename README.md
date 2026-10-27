# Smart Resource Booking System

Smart Resource Booking System is a web application for discovering and booking shared facilities such as study rooms, meeting rooms, and laboratory equipment. It is intended to give users a clear booking experience while providing administrators with tools to manage resources and reservations.

This repository is the foundation for a full-stack application. Feature implementation and complete setup instructions will be added as the project progresses.

## Planned technology stack

- **Client:** React, Vite, JavaScript/JSX, React Router, and a centralized API service layer.
- **Server:** Node.js, Express, JavaScript ES modules, and Mongoose.
- **Database:** MongoDB.
- **Configuration:** Environment variables; local secret-bearing environment files are excluded from Git.
- **Package manager:** npm workspaces.

## Repository structure

```text
client/       React application and Vite configuration
server/       Express application and server-side modules
docs/
  requirements/       Product scope and roles
  architecture/       Application and booking architecture
  database-design/    Planned MongoDB collections and relationships
  api-specification/  Planned versioned HTTP API
```

The client and server are intentionally separate npm workspaces. The client can be run independently during development, and the server is structured into configuration, routes, controllers, services, middleware, validators, models, utilities, and jobs as those modules are implemented.

## Current status

The initial project scaffolding and design documentation are in place. The user-facing booking and administration features, database schemas, and API routes are not implemented yet. Consult the documents under `docs/` for the agreed requirements and invariants.
