# Monitorias API Endpoints Documentation

This document contains all API endpoints available in the Monitorias monolith for testing in Postman.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents
1. [Availability](#availability)
2. [Calendar (Google OAuth)](#calendar-google-oauth)
3. [Calico Calendar](#calico-calendar)
4. [Courses](#courses)
5. [Majors](#majors)
6. [Tutoring Sessions](#tutoring-sessions)
7. [Users](#users)
8. [Diagnostics](#diagnostics)

---

## Availability

### Get Availabilities
**GET** `/availability`

Get availabilities with optional filters.

**Query Parameters:**
- `tutorId` (optional): Filter by tutor ID
- `course` (optional): Filter by course
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Limit results (default: 50)

**Example:**
```
GET /availability?tutorId=abc123&limit=20
```

---

### Check Event Exists
**GET** `/availability/check-event`

Check if an availability event exists.

**Query Parameters:**
- `eventId` (required): Google Calendar event ID

**Example:**
```
GET /availability/check-event?eventId=abc123xyz
```

---

### Create Availability Event
**POST** `/availability/create`

Create an availability event in Google Calendar and Firebase.

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "accessToken": "ya29.a0...",
  "title": "Disponibilidad Cálculo",
  "date": "2026-01-20",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Biblioteca",
  "description": "Sesión de tutoría de cálculo",
  "calendarId": "primary",
  "course": "Cálculo I"
}
```

---

### Delete Availability Event
**DELETE** `/availability/delete`

Delete an availability event from Google Calendar and Firebase.

**Query Parameters:**
- `eventId` (required): Event ID to delete
- `calendarId` (optional): Calendar ID

**Headers or Body:**
- `Authorization: Bearer <accessToken>` OR
- Body: `{ "accessToken": "ya29.a0..." }`

**Example:**
```
DELETE /availability/delete?eventId=abc123&calendarId=primary
```

---

### Get Multiple Tutors Availability
**POST** `/availability/joint/multiple`

Get joint availability for multiple tutors.

**Request Body:**
```json
{
  "tutorIds": ["tutor1", "tutor2", "tutor3"],
  "startDate": "2026-01-20",
  "endDate": "2026-01-27",
  "limit": 100
}
```

---

### Get Available Slots
**GET** `/availability/slots/available`

Get only available time slots (filtered and grouped by date).

**Query Parameters:**
- `tutorId` (required): Tutor ID
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Example:**
```
GET /availability/slots/available?tutorId=tutor123
```

---

### Check Slot Availability
**POST** `/availability/slots/check-availability`

Check slot availability in real-time before booking.

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "parentAvailabilityId": "avail456",
  "slotIndex": 0
}
```

---

### Get Consecutive Slots
**POST** `/availability/slots/consecutive`

Get consecutive available slots (useful for longer sessions).

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "count": 2,
  "startDate": "2026-01-20",
  "endDate": "2026-01-27"
}
```

---

### Generate Slots
**POST** `/availability/slots/generate`

Generate hourly slots from availabilities.

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "startDate": "2026-01-20",
  "endDate": "2026-01-27",
  "limit": 50
}
```

---

### Validate Slot
**POST** `/availability/slots/validate`

Validate a slot for booking (checks conflicts, past time, etc.).

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "parentAvailabilityId": "avail456",
  "slotIndex": 0
}
```

---

### Sync Availabilities
**POST** `/availability/sync`

Sync availabilities from Google Calendar to Firebase.

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "accessToken": "ya29.a0...",
  "calendarId": "primary"
}
```

---

### Intelligent Sync
**POST** `/availability/sync-intelligent`

Intelligently sync only new events (avoids duplicates).

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "accessToken": "ya29.a0...",
  "calendarName": "Disponibilidad",
  "daysAhead": 30
}
```

---

## Calendar (Google OAuth)

### Get Auth URL (Redirect)
**GET** `/calendar/auth`

Redirect to Google OAuth authorization page.

**Response:** Redirects to Google OAuth consent screen.

---

### Get Auth URL (JSON)
**GET** `/calendar/auth-url`

Get Google OAuth URL as JSON (for API clients).

**Query Parameters:**
- `format` (optional): Set to `json` for JSON callback format

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "redirectUri": "http://localhost:3000/api/calendar/callback",
  "instructions": "Visit the authUrl to authorize Google Calendar access"
}
```

---

### OAuth Callback
**GET** `/calendar/callback`

Handle OAuth callback from Google (automatic redirect).

**Query Parameters:**
- `code` (required): Authorization code from Google
- `format` (optional): Set to `json` to get tokens as JSON
- `state` (optional): State parameter

**Response (if format=json):**
```json
{
  "success": true,
  "tokens": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//0g...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

---

### Check Calendar Connection
**GET** `/calendar/check-connection`

Check if calendar is connected and token is valid.

**Response:**
```json
{
  "connected": true,
  "hasAccessToken": true,
  "hasRefreshToken": true,
  "tokenValid": true,
  "tokenSource": "cookie"
}
```

---

### Create Calendar Event
**POST** `/calendar/create-event`

Create an event in Google Calendar.

**Request Body:**
```json
{
  "calendarId": "primary",
  "summary": "Reunión de equipo",
  "description": "Discutir proyecto",
  "start": "2026-01-20T14:00:00",
  "end": "2026-01-20T15:00:00",
  "location": "Oficina 101"
}
```

**Note:** Access token must be in cookies or headers.

---

### Delete Calendar Event
**DELETE** `/calendar/delete-event`

Delete an event from Google Calendar.

**Query Parameters:**
- `calendarId` (required): Calendar ID
- `eventId` (required): Event ID to delete

**Example:**
```
DELETE /calendar/delete-event?calendarId=primary&eventId=abc123
```

---

### Get Calendar Diagnostics
**GET** `/calendar/diagnostics`

Check OAuth configuration and environment variables.

**Response:**
```json
{
  "success": true,
  "configuration": {
    "clientId": "123456789....",
    "clientSecret": "SET (hidden)",
    "redirectUri": "http://localhost:3000/api/calendar/callback"
  },
  "issues": [],
  "warnings": []
}
```

---

### Disconnect Calendar
**POST** `/calendar/disconnect`

Disconnect calendar and clear cookies.

**Response:**
```json
{
  "success": true,
  "message": "Disconnected from Google Calendar"
}
```

---

### List Calendar Events
**GET** `/calendar/events`

List events from a Google Calendar.

**Query Parameters:**
- `calendarId` (required): Calendar ID
- `timeMin` (optional): Minimum time (ISO 8601)
- `timeMax` (optional): Maximum time (ISO 8601)

**Example:**
```
GET /calendar/events?calendarId=primary&timeMin=2026-01-01T00:00:00Z
```

---

### Exchange Authorization Code
**POST** `/calendar/exchange-token`

Exchange authorization code for tokens (for API clients).

**Query Parameters:**
- `code` (required): Authorization code from OAuth callback

**Example:**
```
POST /calendar/exchange-token?code=4/0AY0e-g7...
```

---

### List Calendars
**GET** `/calendar/list`

List all connected calendars for the authenticated user.

**Response:**
```json
{
  "success": true,
  "calendars": [
    {
      "id": "primary",
      "summary": "my@email.com",
      "primary": true
    }
  ]
}
```

---

### Refresh Access Token
**POST** `/calendar/refresh-token`

Refresh the access token using refresh token from cookies.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

---

## Calico Calendar

### Check Calico Calendar Status
**GET** `/calico-calendar/status`

Check if Calico Calendar service is configured.

**Response:**
```json
{
  "configured": true,
  "message": "Calico Calendar service is ready"
}
```

---

### Create Tutoring Session Event
**POST** `/calico-calendar/tutoring-session`

Create a tutoring session event in the Calico shared calendar.

**Request Body:**
```json
{
  "summary": "Tutoría: Cálculo I - Juan Pérez",
  "description": "Sesión de tutoría sobre derivadas",
  "startDateTime": "2026-01-20T14:00:00",
  "endDateTime": "2026-01-20T15:00:00",
  "attendees": ["student@example.com", "tutor@example.com"],
  "location": "Biblioteca Central",
  "tutorEmail": "tutor@example.com",
  "tutorName": "María González",
  "tutorId": "tutor123"
}
```

---

### Get Tutoring Session Event
**GET** `/calico-calendar/tutoring-session/{eventId}`

Get a specific tutoring session event.

**Path Parameters:**
- `eventId`: Event ID

**Example:**
```
GET /calico-calendar/tutoring-session/abc123xyz
```

---

### Update Tutoring Session Event
**PUT** `/calico-calendar/tutoring-session/{eventId}`

Update a tutoring session event.

**Path Parameters:**
- `eventId`: Event ID

**Request Body:**
```json
{
  "summary": "Tutoría: Cálculo I - Juan Pérez (Actualizado)",
  "startDateTime": "2026-01-20T15:00:00",
  "endDateTime": "2026-01-20T16:00:00",
  "description": "Sesión actualizada"
}
```

---

### Delete Tutoring Session Event
**DELETE** `/calico-calendar/tutoring-session/{eventId}`

Delete a tutoring session event.

**Path Parameters:**
- `eventId`: Event ID

**Example:**
```
DELETE /calico-calendar/tutoring-session/abc123xyz
```

---

### Cancel Tutoring Session Event
**POST** `/calico-calendar/tutoring-session/{eventId}/cancel`

Cancel a tutoring session event (marks as cancelled).

**Path Parameters:**
- `eventId`: Event ID

**Query Parameters:**
- `reason` (optional): Cancellation reason

**Example:**
```
POST /calico-calendar/tutoring-session/abc123xyz/cancel?reason=Estudiante%20enfermo
```

---

## Courses

### Get All Courses
**GET** `/courses`

Get all courses or filter by tutor.

**Query Parameters:**
- `tutorId` (optional): Filter by tutor ID

**Example:**
```
GET /courses
GET /courses?tutorId=tutor123
```

---

### Create Course
**POST** `/courses`

Create a new course.

**Request Body:**
```json
{
  "name": "Cálculo I",
  "code": "MAT101",
  "credits": 3,
  "faculty": "Ingeniería",
  "prerequisites": ["MAT001"]
}
```

---

### Get Course by ID
**GET** `/courses/{id}`

Get a specific course by ID.

**Path Parameters:**
- `id`: Course ID

**Example:**
```
GET /courses/course123
```

---

### Update Course
**PUT** `/courses/{id}`

Update a course.

**Path Parameters:**
- `id`: Course ID

**Request Body:**
```json
{
  "name": "Cálculo I Avanzado",
  "credits": 4
}
```

---

### Delete Course
**DELETE** `/courses/{id}`

Delete a course.

**Path Parameters:**
- `id`: Course ID

**Example:**
```
DELETE /courses/course123
```

---

## Majors

### Get All Majors
**GET** `/majors`

Get all majors.

**Response:**
```json
{
  "success": true,
  "majors": [...],
  "count": 5
}
```

---

### Create Major
**POST** `/majors`

Create a new major.

**Request Body:**
```json
{
  "name": "Ingeniería de Sistemas",
  "code": "IS",
  "faculty": "Ingeniería"
}
```

---

### Get Major by ID
**GET** `/majors/{id}`

Get a specific major by ID.

**Path Parameters:**
- `id`: Major ID

**Example:**
```
GET /majors/major123
```

---

### Update Major
**PUT** `/majors/{id}`

Update a major.

**Path Parameters:**
- `id`: Major ID

**Request Body:**
```json
{
  "name": "Ingeniería de Sistemas y Computación"
}
```

---

### Delete Major
**DELETE** `/majors/{id}`

Delete a major.

**Path Parameters:**
- `id`: Major ID

**Example:**
```
DELETE /majors/major123
```

---

## Tutoring Sessions

### Create Tutoring Session
**POST** `/tutoring-sessions`

Create a new tutoring session.

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "studentId": "student456",
  "studentEmail": "student@example.com",
  "studentName": "Juan Pérez",
  "course": "Cálculo I",
  "startTime": "2026-01-20T14:00:00",
  "endTime": "2026-01-20T15:00:00",
  "status": "pending",
  "notes": "Ayuda con derivadas"
}
```

---

### Get Session by ID
**GET** `/tutoring-sessions/{id}`

Get a specific tutoring session.

**Path Parameters:**
- `id`: Session ID

**Example:**
```
GET /tutoring-sessions/session123
```

---

### Update Session
**PUT** `/tutoring-sessions/{id}`

Update a tutoring session.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Actualizado"
}
```

---

### Accept Session
**POST** `/tutoring-sessions/{id}/accept`

Accept a pending tutoring session.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "tutorId": "tutor123"
}
```

---

### Cancel Session
**POST** `/tutoring-sessions/{id}/cancel`

Cancel a tutoring session.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "cancelledBy": "student456"
}
```

---

### Complete Session
**POST** `/tutoring-sessions/{id}/complete`

Mark a session as completed.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excelente sesión"
}
```

---

### Decline Session
**POST** `/tutoring-sessions/{id}/decline`

Decline a pending tutoring session.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "tutorId": "tutor123"
}
```

---

### Reject Session
**POST** `/tutoring-sessions/{id}/reject`

Reject a pending tutoring session with reason.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "tutorId": "tutor123",
  "reason": "No disponible en ese horario"
}
```

---

### Get Session Reviews
**GET** `/tutoring-sessions/{id}/reviews`

Get reviews for a tutoring session.

**Path Parameters:**
- `id`: Session ID

**Example:**
```
GET /tutoring-sessions/session123/reviews
```

---

### Add Session Review
**POST** `/tutoring-sessions/{id}/reviews`

Add a review for a tutoring session.

**Path Parameters:**
- `id`: Session ID

**Request Body:**
```json
{
  "reviewerEmail": "student@example.com",
  "reviewerName": "Juan Pérez",
  "stars": 5,
  "comment": "Muy buena tutoría"
}
```

---

### Book Slot
**POST** `/tutoring-sessions/book-slot`

Book a specific availability slot.

**Request Body:**
```json
{
  "slot": {
    "tutorId": "tutor123",
    "tutorEmail": "tutor@example.com",
    "tutorName": "María González",
    "startTime": "2026-01-20T14:00:00",
    "endTime": "2026-01-20T15:00:00",
    "parentAvailabilityId": "avail456",
    "slotIndex": 0
  },
  "studentEmail": "student@example.com",
  "studentName": "Juan Pérez",
  "notes": "Ayuda con integrales",
  "selectedCourse": "Cálculo I"
}
```

---

### Get Student Sessions
**GET** `/tutoring-sessions/student/{studentId}`

Get all sessions for a student.

**Path Parameters:**
- `studentId`: Student ID

**Query Parameters:**
- `limit` (optional): Limit results (default: 50)

**Example:**
```
GET /tutoring-sessions/student/student456?limit=20
```

---

### Get Student Courses
**GET** `/tutoring-sessions/student/{studentId}/courses`

Get unique courses from student's tutoring history.

**Path Parameters:**
- `studentId`: Student ID

**Example:**
```
GET /tutoring-sessions/student/student456/courses
```

---

### Get Student History
**GET** `/tutoring-sessions/student/{studentId}/history`

Get student's tutoring history with filters and stats.

**Path Parameters:**
- `studentId`: Student ID

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `course` (optional): Filter by course
- `limit` (optional): Limit results (default: 100)

**Example:**
```
GET /tutoring-sessions/student/student456/history?course=Cálculo%20I&limit=50
```

---

### Get Student Stats
**GET** `/tutoring-sessions/student/{studentId}/stats`

Get statistics for a student's tutoring sessions.

**Path Parameters:**
- `studentId`: Student ID

**Example:**
```
GET /tutoring-sessions/student/student456/stats
```

---

### Get Tutor Sessions
**GET** `/tutoring-sessions/tutor/{tutorId}`

Get all sessions for a tutor.

**Path Parameters:**
- `tutorId`: Tutor ID

**Query Parameters:**
- `limit` (optional): Limit results (default: 50)

**Example:**
```
GET /tutoring-sessions/tutor/tutor123?limit=20
```

---

### Get Tutor Pending Sessions
**GET** `/tutoring-sessions/tutor/{tutorId}/pending`

Get pending sessions for a tutor.

**Path Parameters:**
- `tutorId`: Tutor ID

**Query Parameters:**
- `limit` (optional): Limit results (default: 50)

**Example:**
```
GET /tutoring-sessions/tutor/tutor123/pending
```

---

### Get Tutor Stats
**GET** `/tutoring-sessions/tutor/{tutorId}/stats`

Get statistics for a tutor's sessions.

**Path Parameters:**
- `tutorId`: Tutor ID

**Example:**
```
GET /tutoring-sessions/tutor/tutor123/stats
```

---

## Users

### Get User by ID
**GET** `/users/{id}`

Get a user by ID.

**Path Parameters:**
- `id`: User ID

**Example:**
```
GET /users/user123
```

---

### Update User
**PUT** `/users/{id}`

Update a user's information.

**Path Parameters:**
- `id`: User ID

**Request Body:**
```json
{
  "name": "Juan Pérez Actualizado",
  "email": "juan.updated@example.com",
  "role": "tutor",
  "courses": ["Cálculo I", "Álgebra"]
}
```

---

### Get All Tutors
**GET** `/users/tutors`

Get all tutors or filter by course.

**Query Parameters:**
- `course` (optional): Filter by course
- `limit` (optional): Limit results (default: 100)

**Example:**
```
GET /users/tutors
GET /users/tutors?course=Cálculo%20I&limit=20
```

---

## Diagnostics

### Firebase Diagnostics
**GET** `/firebase/diagnostics`

Check Firebase Admin SDK configuration.

**Response:**
```json
{
  "success": true,
  "firebaseConfig": {
    "hasProjectId": true,
    "hasClientEmail": true,
    "hasPrivateKey": true,
    "projectId": "my-project"
  },
  "initializationStatus": "Successfully initialized",
  "recommendations": []
}
```

---

## Notes

### Authentication
Most endpoints require authentication. The API uses:
- **Cookies**: For web clients (set via `/calendar/callback`)
- **Bearer Tokens**: For API clients (use `Authorization: Bearer <token>` header)

### Environment Variables Required
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_SERVICE_ACCOUNT_KEY=
CALICO_CALENDAR_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FRONTEND_URL=
```

### Common Response Format
Most endpoints return responses in this format:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Testing Tips for Postman
1. Start with `/calendar/diagnostics` to verify OAuth setup
2. Use `/calendar/auth-url?format=json` to get OAuth URL
3. After authorization, get tokens from `/calendar/callback?code=...&format=json`
4. Save the access token as an environment variable in Postman
5. Use the token in subsequent requests

---

**Last Updated:** January 16, 2026

