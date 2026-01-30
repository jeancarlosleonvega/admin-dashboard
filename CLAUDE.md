# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack admin dashboard platform built as a monorepo with npm workspaces. It features a Fastify backend with PostgreSQL/Prisma and a React frontend with Vite/TypeScript/Tailwind. The system implements JWT authentication with refresh tokens and a comprehensive RBAC (Role-Based Access Control) system.

## Common Commands

### Development

```bash
# Start both frontend and backend concurrently
npm run dev

# Start backend only (runs on http://localhost:3000)
npm run dev:backend

# Start frontend only (runs on http://localhost:5173)
npm run dev:frontend
```

### Backend Operations

```bash
# Run backend tests
npm run test -w backend

# Run tests with coverage
npm run test:coverage -w backend

# Lint backend code
npm run lint -w backend

# Database operations
npm run db:generate -w backend   # Generate Prisma client
npm run db:migrate -w backend    # Run migrations
npm run db:push -w backend       # Push schema changes
npm run db:studio -w backend     # Open Prisma Studio
npm run db:seed -w backend       # Seed database

# Build for production
npm run build -w backend
```

### Frontend Operations

```bash
# Run frontend linter
npm run lint -w frontend

# Build frontend for production
npm run build -w frontend

# Preview production build
npm run preview -w frontend
```

### Monorepo-wide

```bash
# Run all tests across workspaces
npm run test

# Lint all workspaces
npm run lint

# Build all workspaces
npm run build
```

## Architecture

### Backend Architecture (Modular Clean Architecture)

The backend follows a layered architecture pattern:

- **Routes Layer**: Define endpoints, attach middlewares, call controllers
- **Controllers**: Parse requests, call services, format responses
- **Services**: Business logic, orchestration, validation
- **Repositories**: Data access, database queries
- **Schemas**: Request/response validation with Zod

**Module Structure**:
```
src/modules/<module-name>/
├── <module>.routes.ts      # Route definitions
├── <module>.controller.ts  # Request handlers
├── <module>.service.ts     # Business logic
├── <module>.repository.ts  # Data access
├── <module>.schema.ts      # Zod validation
├── <module>.types.ts       # TypeScript types
└── __tests__/              # Tests
```

**Current Modules**:
- `auth/` - Authentication endpoints (register, login, logout, refresh, me)
- `users/` - User CRUD operations with RBAC

### Frontend Architecture

The frontend uses a feature-based architecture:

- **Features**: Self-contained modules with pages, components, and logic
- **State Management**:
  - Zustand for client state (auth, UI)
  - TanStack Query for server state (API data, caching)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router with protected routes

**Key Directories**:
- `src/features/` - Feature modules (auth, dashboard, users)
- `src/components/` - Reusable UI components and layouts
- `src/stores/` - Zustand stores
- `src/api/` - Axios client with interceptors
- `src/routes/` - Route guards and definitions

### Authentication & Authorization

**Token Strategy**:
- **Access Token**: Stored in memory (Zustand), expires in 15 minutes
- **Refresh Token**: Stored in httpOnly cookie, expires in 7 days
- **Token Refresh**: Automatic via Axios interceptor on 401 responses
- **Logout**: Increments `tokenVersion` in database to invalidate all refresh tokens

**RBAC Permission Format**:
- Format: `resource.action` (e.g., `users.view`, `users.create`)
- Roles contain multiple permissions
- Users have multiple roles
- Backend middleware checks permissions per request
- Frontend components use permission checks for conditional rendering

**Database Models**:
- `User` - with status (ACTIVE/INACTIVE/SUSPENDED) and tokenVersion
- `Role` - system roles supported
- `Permission` - resource.action format
- `UserRole` - many-to-many junction
- `RolePermission` - many-to-many junction

### API Response Formats

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "requestId": "uuid-here"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "requestId": "uuid-here",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Key Files

### Backend

- `backend/src/app.ts` - Fastify app initialization with plugins and routes
- `backend/src/server.ts` - Server startup and shutdown handling
- `backend/src/config/env.ts` - Environment variable validation (Zod)
- `backend/src/infrastructure/database/prisma/schema.prisma` - Database schema
- `backend/src/infrastructure/database/client.ts` - Prisma client singleton
- `backend/src/shared/middlewares/authenticate.ts` - JWT verification
- `backend/src/shared/middlewares/authorize.ts` - RBAC permission checks
- `backend/src/shared/utils/jwt.ts` - Token generation/verification
- `backend/src/shared/utils/password.ts` - Bcrypt hashing

### Frontend

- `frontend/src/App.tsx` - Root component with routing
- `frontend/src/main.tsx` - React Query and app bootstrap
- `frontend/src/stores/authStore.ts` - Auth state and permission checks
- `frontend/src/api/client.ts` - Axios with auto-refresh interceptor
- `frontend/src/routes/ProtectedRoute.tsx` - Authentication guard
- `frontend/src/components/layout/Sidebar.tsx` - Navigation with permission checks
- `frontend/vite.config.ts` - Path aliases and proxy configuration

## Environment Variables

### Backend (.env)

Required:
```bash
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_ACCESS_SECRET=<random-32-bytes>
JWT_REFRESH_SECRET=<different-random-32-bytes>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

Optional:
```bash
REDIS_URL=redis://localhost:6379
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Admin Dashboard
```

## Development Workflow

### Adding a New Module (Backend)

1. Create module directory under `src/modules/<name>/`
2. Create: routes, controller, service, repository, schema, types files
3. Register routes in `src/app.ts`
4. Add database models to Prisma schema if needed
5. Run `npm run db:migrate -w backend` to create migration
6. Add permissions to seed data if RBAC is needed
7. Write tests in `__tests__/` directory

### Adding a New Feature (Frontend)

1. Create feature directory under `src/features/<name>/`
2. Create: pages, components, schemas directories
3. Add API client methods in `src/api/`
4. Add routes in `src/App.tsx` with appropriate guards
5. Add navigation links in `src/components/layout/Sidebar.tsx` if needed
6. Create TanStack Query hooks in `src/hooks/queries/` if needed

### Adding RBAC Permissions

1. Add permission to Prisma seed file (`backend/src/infrastructure/database/prisma/seed.ts`)
2. Run `npm run db:seed -w backend` to add to database
3. Backend: Use `authorize(['resource.action'])` middleware on routes
4. Frontend: Use `can('resource.action')` from authStore for conditional rendering
5. Frontend: Add permission check to Sidebar navigation items

## Important Notes

### Security

- Passwords are hashed with bcrypt (cost factor 12)
- JWT tokens use RS256 for production (HS256 for dev)
- All routes except auth endpoints require authentication
- RBAC permissions are checked on both frontend (UX) and backend (security)
- CORS is configured to whitelist specific origins only
- Rate limiting is enabled (100 req/15min for auth endpoints)
- Input validation uses Zod on both frontend and backend

### Database

- ORM: Prisma
- Connection pooling configured (min: 2, max: 20)
- Migrations in `backend/src/infrastructure/database/prisma/migrations/`
- Schema location: `backend/src/infrastructure/database/prisma/schema.prisma`
- Use `npm run db:studio -w backend` to inspect database visually

### Testing

- Backend: Vitest for unit and integration tests
- Test files in `__tests__/` directories within modules
- Run tests with `npm run test -w backend`

### Path Aliases (Frontend)

Vite is configured with these path aliases:
- `@components` → `src/components`
- `@features` → `src/features`
- `@stores` → `src/stores`
- `@api` → `src/api`
- `@lib` → `src/lib`
- `@types` → `src/types`

## Unimplemented Features

The following features have scaffolding but are not fully implemented:

- Password reset/recovery flow (DB schema exists, endpoints need implementation)
- Email/SMTP integration (config ready, no email service implementation)
- Users list API integration (UI exists, needs TanStack Query hooks)
- Dashboard stats API (placeholder values, needs real data)
- Roles management pages (routes defined, UI incomplete)
- Settings page (navigation exists, page not created)
- Redis caching (client configured, not actively used)

## Technical Decisions

- **Fastify over Express**: Better performance, TypeScript support, built-in validation
- **PostgreSQL over MySQL**: Better JSON support, superior pooling, ACID compliance
- **Prisma over TypeORM**: Type safety, excellent migrations, developer experience
- **Zustand + TanStack Query over Redux**: Simplicity, separation of concerns
- **Vitest over Jest**: Faster, better TypeScript support, modern API
