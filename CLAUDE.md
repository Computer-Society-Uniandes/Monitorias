# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Calico is a Next.js 15 tutoring platform for Universidad de los Andes that connects students with tutors. The system features Google Calendar integration for availability management, Firebase/Firestore for data persistence, and a centralized calendar system for tutoring sessions.

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint (core-web-vitals preset)
npx jest --watch     # Run tests in watch mode
```

### Firebase Initialization
```bash
npm run firebase-init    # Install Firebase and initialize data
```

### Git Workflow
- Commit messages: Present tense, concise (often in Spanish imperatives: "Arreglo navbar")
- Squash WIP commits before merging
- PRs should include: summary, ticket link, lint/build status, smoke-test steps, UI screenshots

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Calendar**: Google Calendar API (with Service Account for central calendar)

### Directory Structure

```
src/
├── app/
│   ├── api/                          # API routes (Next.js App Router)
│   │   ├── availability/             # Tutor availability sync endpoints
│   │   │   ├── sync/                 # Full calendar sync
│   │   │   ├── sync-specific/        # Specific availability calendar sync
│   │   │   └── check-event/          # Check event existence
│   │   └── calendar/                 # Google Calendar integration
│   │       ├── auth/                 # OAuth initiation
│   │       ├── callback/             # OAuth callback
│   │       ├── events/               # Event management
│   │       ├── list/                 # List calendars
│   │       └── refresh-token/        # Token refresh
│   ├── auth/                         # Authentication pages
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── components/                   # Shared React components
│   ├── context/                      # React Context providers
│   │   ├── SecureAuthContext.js      # Firebase Auth + Firestore sync
│   │   └── AuthWrapper.js            # Auth wrapper component
│   ├── hooks/                        # Custom React hooks
│   │   ├── useUser.js
│   │   └── useCalendarConnection.js
│   ├── services/                     # Business logic services
│   ├── style/                        # Component-specific styles
│   ├── home/                         # Student pages
│   │   ├── page.jsx                  # Student dashboard
│   │   ├── explore/page.jsx
│   │   └── buscar-tutores/page.jsx
│   └── tutor/                        # Tutor pages
│       ├── inicio/page.jsx           # Tutor dashboard
│       ├── disponibilidad/page.jsx
│       ├── mis-tutorias/page.jsx
│       ├── materias/page.jsx
│       └── pagos/page.jsx
├── firebaseConfig.js                 # Client-side Firebase init
├── firebaseServerConfig.js           # Server-side Firebase init
└── routes.js                         # Route constants
```

**Organization principle**: Keep feature modules self-contained within route folders; promote code to shared locations (`components/`, `services/`, `hooks/`) only when reused across multiple routes.

### Key Services

**TutoringSessionService** (`src/app/services/TutoringSessionService.js`)
- Manages tutoring session lifecycle (create, update, cancel)
- Implements **slot booking system**: breaks multi-hour availability blocks into 1-hour bookable slots
- Methods: `bookSpecificSlot()`, `createSlotBooking()`, `cancelSlotBooking()`
- Uses `slot_bookings` collection to track individual hour reservations
- Links slots to parent availability via `parentAvailabilityId` and `slotIndex`

**GoogleCalendarService** (`src/app/services/GoogleCalendarService.js`)
- Handles user OAuth for personal Google Calendar access
- Implements automatic token refresh with retry logic via `executeWithRetry()`
- Syncs tutor availability from user's designated calendar
- Methods: `listEvents()`, `createEvent()`, `deleteEvent()`, `getFreeBusy()`

**AvailabilityService** & **FirebaseAvailabilityService**
- Sync tutor availability from Google Calendar to Firestore `availabilities` collection
- Support both full calendar sync and specific availability calendar sync
- AvailabilityService handles Google Calendar API calls
- FirebaseAvailabilityService manages Firestore persistence

**AuthService** (`src/app/services/AuthService.js`)
- Handles Firebase authentication (login, register, logout)
- Integrates with SecureAuthContext for state management

**Other Services**:
- `TutorSearchService.js`: Search and filter tutors by subject/course
- `SlotService.js`: Manages availability slot generation and booking status
- `ExploreService.service.js`, `HomeService.service.js`: Page-specific data fetching

### Firebase Collections

The Firestore database uses these main collections (detailed in `FIREBASE_COLLECTIONS_STRUCTURE.md`):

- **`user`**: User profiles (students and tutors), keyed by email
- **`course`**: Available courses/subjects, keyed by course code
- **`major`**: University majors/programs
- **`availabilities`**: Tutor availability slots synced from Google Calendar
  - Document ID is Google Calendar event ID
  - Includes fields: `tutorEmail`, `startDateTime`, `endDateTime`, `googleEventId`, `sourceCalendarId`, `fromAvailabilityCalendar`
- **`tutoring_sessions`**: Scheduled tutoring sessions
  - Includes `calicoCalendarEventId` for central calendar integration
- **`slot_bookings`**: Tracks which availability slots are booked
- **`payments`**: Payment transactions (future implementation)

### Authentication Flow

1. Firebase Auth handles user authentication
2. SecureAuthContext (`src/app/context/SecureAuthContext.js`) provides auth state via React Context
3. User data stored in Firestore `user` collection (document ID = user email)
4. Auth state includes: `isLoggedIn`, `email`, `name`, `isTutor`, `role`, `uid`
5. **IMPORTANT**: No sensitive data in localStorage - uses Firebase Auth persistence

### Slot Booking System

The platform uses a sophisticated slot booking system:

1. **Availability Creation**: Tutors create multi-hour availability blocks in Google Calendar
2. **Slot Division**: System automatically divides blocks into 1-hour bookable slots
3. **Individual Booking**: Students book specific 1-hour slots from availability blocks
4. **Tracking**: Each booking creates:
   - Entry in `tutoring_sessions` collection with session details
   - Entry in `slot_bookings` collection linking to parent availability
5. **Cancellation**: Cancelling a session removes the slot booking, freeing the hour

### Calendar Integration

**User Availability Calendar** (Tutor's personal Google Calendar):
- Tutors designate a specific calendar for availability
- System syncs events from this calendar to Firestore `availabilities` collection
- Requires user OAuth consent with automatic token refresh
- GoogleCalendarService handles OAuth flow and token management

### Environment Variables

Required in `.env.local`:

```bash
# Firebase configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Calendar OAuth (for user calendar access)
GOOGLE_CLIENT_ID=              # For server-side OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # For client-side OAuth
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=
```

**Note**: Environment variable prefix rules:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Variables without prefix are server-side only

### API Routes Pattern

API routes follow Next.js App Router conventions:
- Located in `src/app/api/`
- Export `GET`, `POST`, `PATCH`, `DELETE` handlers
- Use `NextResponse.json()` for responses
- Example: `src/app/api/calendar/events/route.jsx`

### Component Architecture

- Components in `src/app/components/` organized by feature
- Use "use client" directive for client-side components
- Common components:
  - `CalendlyStyleScheduler`: Availability selection UI
  - `TutorAvailabilityCard`: Display tutor availability
  - `StudentHome`, `TutorHome`: Role-specific dashboards
  - `GoogleCalendarButton`: Calendar connection handler

### Styling

- Tailwind CSS 4 with PostCSS (`postcss.config.mjs`)
- Global styles in `src/app/globals.css`
- Component-specific styles in `src/app/style/`
- **Style convention**: Order Tailwind classes as layout → spacing → color

## Important Conventions

1. **User Identification**: Users are identified by email (not UID) throughout the system
2. **Timestamps**: Use Firebase `serverTimestamp()` for createdAt/updatedAt fields
3. **References**: Use Firestore references for relationships (e.g., `major` field in `user`)
4. **Email Validation**: System accepts all emails (not just @uniandes.edu.co as originally planned)
5. **Code Style**:
   - Four-space indentation
   - Single quotes for imports/props
   - Semicolons required
   - PascalCase for components (`TutorDashboard`)
   - camelCase for config files (`firebaseConfig`)
   - `use` prefix for hooks (`useSchedules`)

## Testing

- **Framework**: Jest with React Testing Library
- **Setup**: `src/setupTests.js`
- **Test files**: Co-locate as `*.test.jsx` next to components
- **Run tests**: `npx jest --watch`
- **Assertions**: Prefer user-centric (`screen.findByText`) over implementation details
- **Critical flows to test**: auth redirects, tutor scheduling, calendar sync

## Testing Locally

1. Ensure Firebase project is configured with test data
2. Run `npm run dev` and navigate to http://localhost:3000
3. Register as tutor or student to test flows
4. Connect Google Calendar as tutor to sync availability
