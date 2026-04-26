# School Manager Client

React front end for School Manager, a role-based school administration system. The client provides separate experiences for administrators, principals, and teachers and communicates with the Rails JSON API in `../server`.

## Features

- JWT-backed login flow with protected routes by role.
- Admin dashboard and management screens for schools, teachers, students, classrooms, academic years, subjects, and assignments.
- Principal and teacher dashboards with scoped explore views.
- Global search, data tables, export actions, charts, dialogs, toasts, and theme state.
- API client with centralized auth headers and session-expiration handling.

## Tech Stack

- React 19 and TypeScript
- Vite 8
- React Router 7
- Zustand for client state
- Tailwind CSS 4 with shadcn-style UI components
- Chart.js, D3, jsPDF, and lucide-react
- ESLint and Prettier

## Prerequisites

- Node.js 20 or newer
- Bun, npm, pnpm, or Yarn
- Running School Manager API server from `../server`

The repository includes `bun.lock`, so Bun is the preferred package manager. The npm commands below also work if you install with npm.

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Configure the API URL:

   Set `VITE_API_BASE_URL` to the Rails API base URL. For local development:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

4. Open the URL printed by Vite, usually `http://localhost:5173`.

## Available Scripts

| Command           | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `bun run dev`     | Start the Vite development server with hot module replacement.   |
| `bun run build`   | Type-check the project and create a production build in `dist/`. |
| `bun run lint`    | Run ESLint across the codebase.                                  |
| `bun run preview` | Serve the production build locally for verification.             |

Use `npm run <script>` instead of `bun run <script>` if you install dependencies with npm.

## Environment Variables

| Variable            | Required | Default                        | Description                    |
| ------------------- | -------- | ------------------------------ | ------------------------------ |
| `VITE_API_BASE_URL` | No       | `http://localhost:3000/api/v1` | Base URL for all API requests. |

Only variables prefixed with `VITE_` are exposed to the browser by Vite. Do not put server secrets in client environment files.

## Project Structure

```text
src/
  api/                 API modules grouped by domain and role
  assets/              Static images used by the app
  components/layout/   Shared application shell and navigation
  components/shared/   Cross-feature components
  components/ui/       Reusable UI primitives
  lib/                 Utility helpers
  pages/               Route-level screens
  stores/              Zustand stores
  types/               Shared TypeScript types
  router.tsx           Application route configuration
```

## API Integration

The API helper in `src/api/client.ts` automatically:

- Adds `Accept: application/json` to requests.
- Adds `Content-Type: application/json` when a request has a body.
- Sends `Authorization: Bearer <token>` when a user is authenticated.
- Opens the session-expired flow on HTTP 401.
- Preserves structured validation errors from HTTP 422 responses.

The server must expose the `/api/v1` namespace expected by the client.

## Quality Checks

Before opening a pull request or deploying a build, run:

```bash
bun run lint
bun run build
```

There is currently no client-side test runner configured. Add one, such as Vitest with React Testing Library, before introducing behavior that needs automated UI or state coverage.

## Build and Deployment

Create a production build with:

```bash
bun run build
```

The static output is written to `dist/` and can be served by any static hosting platform. Configure `VITE_API_BASE_URL` at build time for the target environment.
