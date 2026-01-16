# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Calico Monitorias is a tutoring platform built as a **monolithic Next.js 15 application** (React 19). Students can search for tutors, view availability, and book tutoring sessions. Tutors manage their schedules, accept/decline sessions, and track earnings.

## Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Tests in watch mode
npm run test:ci          # Tests for CI

# Linting
npm run lint             # Run ESLint
```

## Architecture

This is a monolithic Next.js app where frontend and backend coexist:

```
src/
├── app/
│   ├── api/                    # Backend API routes (server-side)
│   ├── components/             # React UI components
│   ├── context/                # React Context providers (AuthWrapper, SecureAuthContext)
│   ├── hooks/                  # Custom hooks (useCalendarConnection, useFavorites, useUser)
│   ├── services/core/          # Frontend API clients (call /api/* routes)
│   ├── auth/, home/, tutor/    # Page routes
│   └── ...
├── lib/
│   ├── firebase/               # Firebase Admin SDK setup
│   ├── repositories/           # Data access layer (Firestore operations)
│   └── services/               # Business logic layer (server-side)
└── components/ui/              # shadcn/ui components
```

### Data Flow

```
React Component → Frontend Service (src/app/services/core/)
    → fetch('/api/...') → API Route (src/app/api/)
    → Business Service (src/lib/services/)
    → Repository (src/lib/repositories/) → Firebase/Firestore
```

### Server vs Client Code

**Server-side only** (`src/lib/`, `src/app/api/`):
- Firebase Admin SDK
- Google APIs (Calendar)
- Direct environment variables

**Client-side** (`src/app/components/`, `src/app/services/`):
- Firebase Client SDK
- Browser APIs
- `fetch()` calls to `/api/*`

## Key Technologies

- **Next.js 15** with App Router
- **React 19**
- **Firebase**: Auth (client) + Admin SDK (server) + Firestore
- **Google Calendar API**: Tutor availability sync
- **Tailwind CSS** + **shadcn/ui** components
- **Zod**: Schema validation
- **Jest** + **Testing Library**: Unit tests

## API Structure

Main API route groups in `src/app/api/`:
- `/api/auth/` - Login, register, logout, session management
- `/api/availability/` - Tutor availability slots, sync with Google Calendar
- `/api/calendar/` - Google Calendar OAuth and operations
- `/api/tutoring-sessions/` - Book, accept, decline, complete sessions
- `/api/users/` - User profiles, tutors list
- `/api/courses/` - Course/subject management
- `/api/majors/` - Academic majors

## Environment Variables

Required in `.env.local`:
```
# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Firebase Client (browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Google OAuth (Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Testing

Tests use Jest with jsdom environment. Test files go in `__tests__/` or `tests/` directories. Setup file: `src/setupTests.js`.

Run a single test file:
```bash
npm test -- path/to/test.js
```

## Path Aliases

`@/` maps to `src/` (configured in jsconfig.json).
