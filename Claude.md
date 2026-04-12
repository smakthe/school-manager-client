# School Manager — Frontend Agent Reference

This document is written for the AI coding agent building the frontend for a Rails API-only backend.
It covers **only what is relevant to the frontend**: authentication, API endpoints, request/response shapes, role-based access rules, and data flow.

---

## Frontend Tech Stack

| Concern         | Choice                            |
| --------------- | --------------------------------- |
| Framework       | React 19                          |
| Runtime & tools | Bun                               |
| Language        | TypeScript (strict mode)          |
| Routing         | React Router v7 (SPA mode)        |
| HTTP client     | Bun's built-in `fetch` API        |
| Global state    | Zustand                           |
| UI components   | shadcn/ui                         |
| Styling         | Tailwind CSS (required by shadcn) |
| Charts          | Chart.js and/or D3.js             |
| Linting         | ESLint + Prettier                 |

### Key conventions

- **Separate repository** — The frontend lives in its own standalone repo (`school-manager-client`). It has **no awareness** of the Rails project. The only coupling is the `VITE_API_BASE_URL` environment variable pointing at the running Rails server.

- **Project scaffold** — Bootstrap with Vite + React + TypeScript via Bun:

  ```bash
  bun create vite school-manager-client --template react-ts
  cd school-manager-client
  bun install
  ```

  Then:
  1. Initialise shadcn/ui per the [Vite setup guide](https://ui.shadcn.com/docs/installation/vite).
  2. Install React Router v7: `bun add react-router-dom`
  3. Install Zustand: `bun add zustand`
  4. Install Chart.js: `bun add chart.js react-chartjs-2`
  5. Install D3: `bun add d3 @types/d3`
  6. Install ESLint + Prettier: `bun add -d eslint prettier eslint-config-prettier`

- **Environment variable** — Store the API base URL in `.env`:

  ```
  VITE_API_BASE_URL=http://localhost:3000/api/v1
  ```

  Access it as `import.meta.env.VITE_API_BASE_URL` throughout the app.

- **Bun `fetch`** — Use the global `fetch` that Bun exposes natively. Do **not** install Axios, `node-fetch`, or any other HTTP library. All API communication must go through `fetch`. Do **not** use TanStack Query — manage all fetch calls manually.

- **shadcn/ui** — Use shadcn components (e.g. `Button`, `Input`, `Dialog`, `Table`, `Select`, `Badge`, `Card`, `Form`, `Skeleton`, `DropdownMenu`, `Sheet`, `Tabs`) wherever possible. Pull in only what you need with `bunx --bun shadcn@latest add <component>`. Do not hand-roll UI primitives that shadcn already covers.

- **Zustand** — Use a single Zustand store (or slices) for global client state: the authenticated user session, the JWT token, and any cross-page state (e.g. selected school filter for admin). Do **not** use React Context for auth — Zustand is the single source of truth.

- **React Router v7** — Use the SPA (client-side) mode. Define all routes in a central `router.tsx` file. Protect role-specific routes with a `<PrivateRoute>` wrapper component that reads from the Zustand auth store.

- **TypeScript** — All files must be `.tsx` / `.ts`. Define explicit types for every API response shape. Do not use `any`.

- **ESLint + Prettier** — Configure ESLint with the React and TypeScript plugins. Configure Prettier with `eslint-config-prettier` to avoid conflicts. Add `lint` and `format` scripts to `package.json`.

---

## Base URL

```
http://localhost:3000/api/v1
```

All responses are in **JSON** (the API sets `defaults: { format: :json }`).

---

## Authentication

### How it works

The API uses **JWT (JSON Web Token)** bearer authentication with a **24-hour expiry**.

- Every request (except login) **must** include the token in the `Authorization` header:
  ```
  Authorization: Bearer <token>
  ```
- If the token is missing, expired, or invalid, the API returns:
  ```json
  { "error": "Unauthorized" }
  ```
  with HTTP status **401**.

### Login

**`POST /api/v1/login`** — Public, no token required.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Success response (200):**

```json
{
  "token": "<jwt_string>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "userable_id": 1
  }
}
```

**Failed login (401):**

```json
{ "error": "Invalid email or password" }
```

### Key login response fields

| Field         | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `token`       | Persist in `localStorage`. Read on app mount to rehydrate the Zustand auth store.                   |
| `role`        | One of `"admin"`, `"teacher"`, `"principal"`. Use this to drive frontend routing and UI visibility. |
| `userable_id` | The ID of the underlying `Admin`, `Teacher`, or `Principal` record (not the `User` ID).             |

### Session behaviour

- **Remember Me** — The login page must include a "Remember Me" checkbox.
  - **Checked:** persist the token in `localStorage` (survives browser close).
  - **Unchecked:** persist the token in `sessionStorage` (cleared on browser close).
  - The Zustand auth store must read from both locations on app boot (check `localStorage` first, then `sessionStorage`).

- **Token expiry (24 h)** — When any API request returns **401**, do **not** silently log the user out. Instead:
  1. Show a **Session Expired modal** (built with shadcn `Dialog`) with the message: _"Your session has expired. Please log in again."_ and a single "Log In" button.
  2. When the user dismisses the modal (or clicks "Log In"), clear the token from storage, reset the Zustand auth store, and redirect to `/login`.
  3. The modal must be triggered globally — wire it up at the root layout level so any page can surface it.

- **On app boot** — If a token exists in storage, the app should treat the user as authenticated immediately (optimistic rehydration). If the first API call returns 401, the session-expired modal will handle the rest.

---

## Role-Based Access & URL Namespacing

The backend enforces three completely separate role tiers. Each role has its own URL namespace and its own set of permitted operations. **The frontend must route users to the correct namespace based on the `role` field returned at login.**

| Role        | URL prefix              | Forbidden response                     |
| ----------- | ----------------------- | -------------------------------------- |
| `admin`     | `/api/v1/admin/...`     | 403 if non-admin hits these routes     |
| `principal` | `/api/v1/principal/...` | 403 if non-principal hits these routes |
| `teacher`   | `/api/v1/teacher/...`   | 403 if non-teacher hits these routes   |

**Forbidden response (403):**

```json
{ "error": "Forbidden: Admin access required" }
```

(Message varies by role.)

### Role capabilities summary

| Capability                          | Admin        | Principal    | Teacher                         |
| ----------------------------------- | ------------ | ------------ | ------------------------------- |
| Manage schools                      | ✅ Full CRUD | ❌           | ❌                              |
| Manage teachers (all schools)       | ✅ Full CRUD | ❌           | ❌                              |
| Manage teachers (own school only)   | ✅           | ✅ Full CRUD | ❌                              |
| Manage students (all schools)       | ✅ Full CRUD | ❌           | ❌                              |
| Manage students (own school only)   | ✅           | ✅ Full CRUD | Read + update homeroom only     |
| Manage classrooms (all schools)     | ✅ Full CRUD | ❌           | ❌                              |
| Manage classrooms (own school only) | ✅           | ✅ Full CRUD | Read-only                       |
| Submit/edit marks                   | ❌           | ❌           | ✅ (own assigned subjects only) |

> **Important:** A `Principal` is a special type of `Teacher` (STI). At login, their `role` will be `"principal"`. The frontend should treat them as a distinct role, not a teacher.

---

## Response Envelope (JSON:API format)

All list and detail responses use the **`jsonapi-serializer`** format.

**Single resource:**

```json
{
  "data": {
    "id": "1",
    "type": "school",
    "attributes": {
      "name": "Springfield Elementary",
      "subdomain": "springfield",
      "board": "cbse",
      "phone": "...",
      "address": "...",
      "timezone": "...",
      "subscription_status": "active"
    }
  }
}
```

**Collection (paginated):**

```json
{
  "data": [
    /* array of resource objects */
  ],
  "meta": {
    "page": 1,
    "items": 20,
    "count": 47,
    "pages": 3
  }
}
```

**Validation errors (422):**

```json
{
  "errors": ["Name can't be blank", "Email has already been taken"]
}
```

**Create success:** HTTP **201 Created** with the new resource object.
**Delete success:** HTTP **204 No Content** (empty body).

---

## API Endpoints

### Admin Namespace `/api/v1/admin/`

Requires role: `admin`.

---

#### Schools

| Method      | URL                         | Description                  |
| ----------- | --------------------------- | ---------------------------- |
| `GET`       | `/api/v1/admin/schools`     | List all schools (paginated) |
| `GET`       | `/api/v1/admin/schools/:id` | Get a single school          |
| `POST`      | `/api/v1/admin/schools`     | Create a school              |
| `PATCH/PUT` | `/api/v1/admin/schools/:id` | Update a school              |
| `DELETE`    | `/api/v1/admin/schools/:id` | Delete a school              |

**School attributes (in `data.attributes`):**

| Field                 | Type          | Notes                                                               |
| --------------------- | ------------- | ------------------------------------------------------------------- |
| `name`                | string        | Required                                                            |
| `subdomain`           | string        | Required, unique. Used for staff email domain (`@subdomain.co.edu`) |
| `board`               | string (enum) | `"cbse"`, `"icse"`, `"state"`, `"ib"`                               |
| `phone`               | string        |                                                                     |
| `address`             | string        |                                                                     |
| `timezone`            | string        |                                                                     |
| `subscription_status` | string (enum) | `"trial"`, `"active"`, `"suspended"`, `"cancelled"`                 |

**Create/Update request body:**

```json
{
  "school": {
    "name": "Springfield Elementary",
    "subdomain": "springfield",
    "board": "cbse",
    "phone": "555-0100",
    "address": "742 Evergreen Terrace",
    "timezone": "Asia/Kolkata",
    "subscription_status": "active"
  }
}
```

---

#### Teachers (Admin)

| Method      | URL                          | Description                                |
| ----------- | ---------------------------- | ------------------------------------------ |
| `GET`       | `/api/v1/admin/teachers`     | List all teachers. Filter by `?school_id=` |
| `GET`       | `/api/v1/admin/teachers/:id` | Get a single teacher                       |
| `POST`      | `/api/v1/admin/teachers`     | Create a teacher with login credentials    |
| `PATCH/PUT` | `/api/v1/admin/teachers/:id` | Update a teacher                           |
| `DELETE`    | `/api/v1/admin/teachers/:id` | Delete a teacher                           |

**Teacher attributes (in `data.attributes`):**

| Field           | Type        | Notes             |
| --------------- | ----------- | ----------------- |
| `name`          | string      |                   |
| `school_id`     | integer     |                   |
| `employee_code` | string      | Unique per school |
| `doj`           | date string | Date of joining   |
| `salary`        | decimal     |                   |
| `is_active`     | boolean     |                   |

**Teacher serializer also includes a `relationships.user` block** with the linked `User` record (email).

**Create request body** — note the nested `user` for login credentials:

```json
{
  "teacher": {
    "school_id": 1,
    "name": "John Smith",
    "employee_code": "TCH-001",
    "doj": "2024-06-01",
    "salary": 45000,
    "is_active": true,
    "user": {
      "email": "jsmith@springfield.co.edu",
      "password": "secret123"
    }
  }
}
```

> **Email domain rule:** Teacher emails must end with `@<school_subdomain>.co.edu`.
> If the subdomain is `springfield`, the email must be `anything@springfield.co.edu`.
> Show this constraint as a hint in the frontend form.

---

#### Students (Admin)

| Method      | URL                          | Description                                |
| ----------- | ---------------------------- | ------------------------------------------ |
| `GET`       | `/api/v1/admin/students`     | List all students. Filter by `?school_id=` |
| `GET`       | `/api/v1/admin/students/:id` | Get a single student                       |
| `POST`      | `/api/v1/admin/students`     | Create a student                           |
| `PATCH/PUT` | `/api/v1/admin/students/:id` | Update a student                           |
| `DELETE`    | `/api/v1/admin/students/:id` | Delete a student                           |

**Student attributes (in `data.attributes`):**

| Field              | Type          | Notes                           |
| ------------------ | ------------- | ------------------------------- |
| `name`             | string        |                                 |
| `school_id`        | integer       |                                 |
| `admission_number` | string        | Unique per school               |
| `dob`              | date string   | Date of birth                   |
| `gender`           | string (enum) | `"male"`, `"female"`, `"other"` |
| `is_active`        | boolean       |                                 |

**Create/Update request body:**

```json
{
  "student": {
    "school_id": 1,
    "name": "Alice Johnson",
    "admission_number": "ADM-2024-001",
    "dob": "2012-03-15",
    "gender": "female",
    "is_active": true
  }
}
```

---

#### Classrooms (Admin)

| Method      | URL                            | Description                                  |
| ----------- | ------------------------------ | -------------------------------------------- |
| `GET`       | `/api/v1/admin/classrooms`     | List all classrooms. Filter by `?school_id=` |
| `GET`       | `/api/v1/admin/classrooms/:id` | Get a single classroom                       |
| `POST`      | `/api/v1/admin/classrooms`     | Create a classroom                           |
| `PATCH/PUT` | `/api/v1/admin/classrooms/:id` | Update a classroom                           |
| `DELETE`    | `/api/v1/admin/classrooms/:id` | Delete a classroom                           |

**Classroom attributes (in `data.attributes`):**

| Field              | Type          | Notes                                                                                             |
| ------------------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `school_id`        | integer       |                                                                                                   |
| `academic_year_id` | integer       |                                                                                                   |
| `class_teacher_id` | integer       | FK to a `Teacher`. Each teacher can be class teacher for at most one classroom per academic year. |
| `grade`            | integer       | 1 to 10                                                                                           |
| `section`          | string (enum) | `"a"`, `"b"`, `"c"`                                                                               |
| `display_name`     | string        | Computed. e.g. `"VII-B"`, `"IX-A"`. Use this for display.                                         |

**Create/Update request body:**

```json
{
  "classroom": {
    "school_id": 1,
    "academic_year_id": 3,
    "class_teacher_id": 7,
    "grade": 7,
    "section": "b"
  }
}
```

---

### Principal Namespace `/api/v1/principal/`

Requires role: `principal`.

**Key difference from Admin:** A principal operates **within their own school only**. You do not pass a `school_id` in the request body — the backend infers it automatically from the logged-in principal's record. Do not expose `school_id` in principal forms.

The principal has the same CRUD operations as the admin for their school's **teachers, students, and classrooms**.

Endpoints and response shapes are identical to Admin, with these URL prefixes:

| Resource   | URL                            |
| ---------- | ------------------------------ |
| Teachers   | `/api/v1/principal/teachers`   |
| Students   | `/api/v1/principal/students`   |
| Classrooms | `/api/v1/principal/classrooms` |

**Creating a teacher as Principal** — the principal can also promote a teacher to `Principal` using the `type` field:

```json
{
  "teacher": {
    "name": "Jane Doe",
    "employee_code": "TCH-002",
    "doj": "2024-08-01",
    "salary": 60000,
    "type": "Principal",
    "user": {
      "email": "jdoe@springfield.co.edu",
      "password": "secret123"
    }
  }
}
```

---

### Teacher Namespace `/api/v1/teacher/`

Requires role: `teacher` (and `principal`, since Principal inherits from Teacher — but principal should use the principal namespace).

Teachers operate within their school only. All data is automatically scoped.

---

#### Classrooms (Teacher) — Read-only

| Method | URL                              | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| `GET`  | `/api/v1/teacher/classrooms`     | List all classrooms in the school |
| `GET`  | `/api/v1/teacher/classrooms/:id` | Get a single classroom            |

Response shape is identical to the Admin classroom shape.

---

#### Students (Teacher) — Read + Homeroom Update Only

| Method      | URL                            | Description                                          |
| ----------- | ------------------------------ | ---------------------------------------------------- |
| `GET`       | `/api/v1/teacher/students`     | List all students in the school                      |
| `GET`       | `/api/v1/teacher/students/:id` | Get a student                                        |
| `PATCH/PUT` | `/api/v1/teacher/students/:id` | Update a student — **only if in teacher's homeroom** |

**Update request body** (restricted fields for a teacher):

```json
{
  "student": {
    "name": "Alice Johnson",
    "dob": "2012-03-15",
    "gender": "female",
    "is_active": true
  }
}
```

> ⚠️ A teacher trying to update a student **not in their homeroom class** will receive a **403 Forbidden** error. The frontend should ideally only show the edit button for homeroom students.

---

#### Marks (Teacher) — Create & Update for Assigned Subjects Only

| Method      | URL                         | Description                                  |
| ----------- | --------------------------- | -------------------------------------------- |
| `GET`       | `/api/v1/teacher/marks`     | List marks for a given classroom and subject |
| `POST`      | `/api/v1/teacher/marks`     | Submit a mark                                |
| `PATCH/PUT` | `/api/v1/teacher/marks/:id` | Update a mark                                |

**`GET` requires query parameters** — both are mandatory:

```
GET /api/v1/teacher/marks?classroom_id=3&subject_id=5
```

If either is missing, the API returns **400 Bad Request**:

```json
{ "error": "classroom_id and subject_id parameters are required" }
```

**Mark attributes (in `data.attributes`):**

| Field           | Type          | Notes                                                              |
| --------------- | ------------- | ------------------------------------------------------------------ |
| `enrollment_id` | integer       | The enrollment record tying a student to a classroom/academic year |
| `subject_id`    | integer       |                                                                    |
| `term`          | string (enum) | `"term1"`, `"term2"`, `"term3"`                                    |
| `score`         | decimal       | Must be ≥ 0 and ≤ `max_score`                                      |
| `max_score`     | decimal       | Must be > 0                                                        |
| `percentage`    | decimal       | Computed. `(score / max_score) * 100`                              |
| `subject_name`  | string        | Delegated, convenient for display                                  |
| `subject_grade` | integer       | Delegated                                                          |

**Create/Update request body:**

```json
{
  "mark": {
    "enrollment_id": 12,
    "subject_id": 5,
    "term": "term1",
    "score": 78.5,
    "max_score": 100
  }
}
```

> ⚠️ A teacher can only submit/edit marks for subjects they are **assigned to teach** in that classroom. The backend validates this via `teacher_subject_assignments`. Attempting to mark an unassigned subject returns **403 Forbidden**.

---

## Data Model Overview

This diagram shows how the key entities relate to each other:

```
Admin ──────────────── User (polymorphic via userable)
Teacher ────────────── User (polymorphic via userable)
  └── Principal (STI of Teacher)

School
  ├── AcademicYear
  ├── Teacher (belongs_to School)
  ├── Student (belongs_to School)
  ├── Subject (belongs_to School, has grade: 1-10)
  └── Classroom (belongs_to School, AcademicYear, class_teacher → Teacher)
        └── Enrollment (joins Student ↔ Classroom/AcademicYear)
              └── Mark (belongs_to Enrollment + Subject)

TeacherSubjectAssignment (joins Teacher ↔ Classroom ↔ Subject)
```

### Key relationships to understand for UI flows

1. **To display a classroom's students**, find all `Enrollment` records for that `Classroom` and retrieve their associated `Student` records.
2. **To enter marks for a class**, the teacher selects a `Classroom` and a `Subject` they teach there. Query `GET /api/v1/teacher/marks?classroom_id=X&subject_id=Y` to get existing marks, then `POST` new ones per enrollment.
3. **One mark per student per subject per term.** Attempting to create a duplicate returns a 422 validation error.
4. **A teacher is the "class teacher" of at most one classroom** per academic year (their `homeroom`). They can update only their homeroom students.

---

## Pagination

All list endpoints are paginated using [Pagy](https://github.com/ddnexus/pagy).

**Pagination metadata lives in `meta`:**

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "items": 20,
    "count": 47,
    "pages": 3
  }
}
```

To request a specific page, use the `?page=` query parameter:

```
GET /api/v1/admin/schools?page=2
```

---

## Health Check

```
GET /up  →  200 OK  (no auth required)
```

Use this to check if the backend server is running before making API calls.

---

## Error Reference

| HTTP Status | Meaning              | When it happens                                     |
| ----------- | -------------------- | --------------------------------------------------- |
| 200         | OK                   | Successful GET / PATCH                              |
| 201         | Created              | Successful POST                                     |
| 204         | No Content           | Successful DELETE                                   |
| 400         | Bad Request          | Missing required query params (e.g. marks endpoint) |
| 401         | Unauthorized         | Missing/invalid/expired JWT                         |
| 403         | Forbidden            | Authenticated but lacks role permission             |
| 422         | Unprocessable Entity | Validation failed — see `errors` array in body      |

---

## Frontend Routing

All routes are defined in a central `router.tsx`. Role-specific routes are wrapped in a `<PrivateRoute role="...">` component that reads from the Zustand store and redirects unauthorized users to `/login`.

```
/login                          → LoginPage

── Admin routes (role: "admin") ────────────────────────────────────
/admin                          → AdminDashboard (summary stats)
/admin/profile                  → ProfilePage
/admin/schools                  → SchoolsListPage
/admin/schools/:id              → SchoolDetailPage
/admin/teachers                 → TeachersListPage (filterable by school)
/admin/teachers/:id             → TeacherDetailPage
/admin/students                 → StudentsListPage (filterable by school)
/admin/students/:id             → StudentDetailPage
/admin/classrooms               → ClassroomsListPage (filterable by school)
/admin/classrooms/:id           → ClassroomDetailPage

── Principal routes (role: "principal") ────────────────────────────
/principal                      → PrincipalDashboard (summary stats)
/principal/profile              → ProfilePage
/principal/teachers             → TeachersListPage (school auto-scoped)
/principal/teachers/:id         → TeacherDetailPage
/principal/students             → StudentsListPage (school auto-scoped)
/principal/students/:id         → StudentDetailPage
/principal/classrooms           → ClassroomsListPage (school auto-scoped)
/principal/classrooms/:id       → ClassroomDetailPage

── Teacher routes (role: "teacher") ────────────────────────────────
/teacher                        → TeacherDashboard (homeroom summary + marks grid)
/teacher/profile                → ProfilePage
/teacher/classrooms             → ClassroomsListPage (read-only)
/teacher/students               → StudentsListPage (edit homeroom students only)
/teacher/marks                  → MarksEntryPage (spreadsheet grid)
```

**Redirect after login** based on the `role` field:

- `admin` → `/admin`
- `principal` → `/principal`
- `teacher` → `/teacher`

---

## Design System

- **Theme** — Professional, clean aesthetic befitting an educational institution. The agent should choose a harmonious color palette (suggested: a calm deep-blue/indigo primary with neutral grays). Avoid aggressive or overly playful colors.
- **Dark / Light mode** — Both modes are required. Implement a toggle button in the top navbar that switches between modes. Persist the user's preference in `localStorage` under the key `theme`. Use shadcn/ui's built-in `ThemeProvider` pattern with Tailwind's `dark:` variant.
- **Layout** — **Top navbar** across all authenticated pages. The navbar must contain:
  - App logo / name on the left
  - Primary navigation links in the centre (role-dependent)
  - Theme toggle + user avatar / name + logout button on the right
- No persistent sidebar. Navigation is entirely top-level.

---

## Pages & Features

### Dashboard (all roles)

Each role has a dedicated dashboard at their root route. It must show **summary stat cards** and **at least one chart**.

| Role      | Stat cards                                     | Chart                                                  |
| --------- | ---------------------------------------------- | ------------------------------------------------------ |
| Admin     | Total schools, total teachers, total students  | Schools by subscription status (pie — Chart.js)        |
| Principal | Teachers, students, classrooms in their school | Student enrollment by grade (bar — Chart.js)           |
| Teacher   | Students in homeroom, pending marks entries    | Marks distribution for their subjects (D3 or Chart.js) |

All stat cards should use shadcn `Card` components. Charts should be responsive.

### Profile Page (`/*/profile`)

A shared `ProfilePage` component usable by all roles. It must show:

- The logged-in user's email (read-only, sourced from the Zustand auth store)
- Editable fields relevant to their role (e.g. name for teachers/principals)
- A **Change Password** section with current password + new password + confirm fields
- A **Save** button that calls the appropriate update endpoint

> The backend does not yet have a dedicated `/me` or profile update endpoint. The agent should make a note of this in a `TODO` comment and wire up the form to call the existing teacher/principal update endpoints for now (e.g. `PATCH /api/v1/teacher/students/:id` pattern for the relevant resource).

### Marks Entry — Teacher (`/teacher/marks`)

This is a **spreadsheet-style grid**, not a form-per-student. Requirements:

- On page load, the teacher's **homeroom classroom and assigned subjects are fetched automatically** from the API. The teacher does not need to manually select a classroom — their homeroom is pre-selected.
- If the teacher teaches multiple subjects, a **subject selector** (shadcn `Tabs` or `Select`) is shown at the top to switch between subjects.
- The grid shows one **row per student** (enrollment) with columns: Student Name, Term 1 Score, Term 2 Score, Term 3 Score, Max Score.
- Cells are **inline-editable** (click to edit, shadcn `Input`). Unsaved changes are highlighted.
- A **Save All** button at the top submits all dirty cells via `POST /api/v1/teacher/marks` (new) or `PATCH /api/v1/teacher/marks/:id` (existing). Show a success toast using shadcn `Sonner` / `Toast`.
- Scores that exceed `max_score` must be flagged inline in red before submission.

### Export

Both the Admin and Principal dashboards / list pages must include an **Export** button on the following pages:

| Page                 | Export format | Content                                                           |
| -------------------- | ------------- | ----------------------------------------------------------------- |
| Students list        | CSV           | Student name, admission number, grade, gender                     |
| Teachers list        | CSV           | Teacher name, employee code, DOJ, salary                          |
| Marks (teacher view) | PDF           | Report-card style: student name, subject, term scores, percentage |

- CSV exports should be generated entirely client-side (no extra library needed — construct a Blob from data).
- PDF exports should use a lightweight client-side library such as **`jsPDF`** (`bun add jspdf`) with `jspdf-autotable` for table rendering.
- Export buttons should show a loading spinner while generating.

---

## Teacher Marks UX — Detailed Flow

This flow starts immediately after a teacher logs in:

1. **Login** (`POST /api/v1/login`) → receive `token`, `role: "teacher"`, `userable_id`.
2. **Redirect to `/teacher`** (TeacherDashboard).
3. On dashboard mount, fetch:
   - `GET /api/v1/teacher/classrooms` → find the classroom where `class_teacher_id === userable_id` — this is the homeroom.
   - `GET /api/v1/teacher/marks?classroom_id=<homeroom_id>&subject_id=<first_assigned_subject_id>` → load existing marks.
4. Display the **marks entry grid** pre-populated with homeroom students and any existing marks.
5. The teacher can switch between their assigned subjects using the subject selector — each switch triggers a new `GET /api/v1/teacher/marks?classroom_id=<homeroom_id>&subject_id=<new_subject_id>` call.
6. Dirty (edited) cells are tracked locally in component state. On **Save All**, iterate dirty cells and fire `POST` or `PATCH` as appropriate.

> **Note:** The backend endpoint `GET /api/v1/teacher/marks` requires **both** `classroom_id` and `subject_id`. Never call it without both params.
