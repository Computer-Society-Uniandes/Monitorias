# Backend API Requirements

This frontend application expects a REST API running at the URL defined in `NEXT_PUBLIC_BACKEND_URL`.
The following endpoints must be implemented:

## Authentication (`/auth`)
- `POST /auth/login`: Login with email and password.
- `POST /auth/register`: Register a new user.
- `POST /auth/logout`: Logout the current user.
- `POST /auth/reset-password`: Request a password reset.
- `POST /auth/google`: Authenticate with Google.

## Courses (`/courses`)
- `GET /courses`: Get a list of all courses.
- `GET /courses/search?q={query}`: Search for courses by name.

## Tutors (`/tutors`)
- `GET /tutors/{id}`: Get details for a specific tutor.
- `GET /tutors/featured`: Get a list of featured tutors.

## Faculties (`/faculties`)
- `GET /faculties`: Get a list of all faculties.

## Availability (`/availability`)
- `GET /availability/tutor/{tutorId}`: Get availability slots for a tutor.
- `POST /availability`: Create a new availability slot.
- `PUT /availability/{id}`: Update an availability slot.
- `DELETE /availability/{id}`: Delete an availability slot.
- `GET /availability/joint/{course}`: Get joint availability for a course.

## Tutoring History (`/tutoring-history`)
- `GET /tutoring-history/{userId}`: Get past tutoring sessions for a user.

## Notes
- All endpoints should return JSON.
- Errors should be returned with appropriate HTTP status codes (4xx, 5xx).
