# Monolithic Architecture Documentation

## Overview

This project uses a **monolithic Next.js architecture** where both frontend and backend are unified into a single deployable application. This eliminates the need for separate backend and frontend servers.

## Architecture

```
Monitorias (Monolithic Next.js App)
├── Frontend: Next.js Pages & Components (src/app/)
├── Backend: Next.js API Routes (src/app/api/)
└── Business Logic: Shared Libraries (src/lib/)
```

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # Backend API Routes (Server-side)
│   │   ├── availability/       # Availability endpoints
│   │   │   ├── route.js       # GET /api/availability
│   │   │   ├── sync/
│   │   │   ├── sync-intelligent/
│   │   │   ├── create/
│   │   │   ├── delete/
│   │   │   └── check-event/
│   │   └── users/              # User endpoints
│   │       ├── tutors/
│   │       └── [id]/
│   │
│   ├── components/              # React Components
│   ├── services/                # Frontend API Clients
│   │   └── core/
│   │       └── AvailabilityService.js  # Calls /api/* routes
│   ├── hooks/                   # React Hooks
│   ├── context/                 # React Context
│   └── (pages)/                 # Frontend Pages
│
├── lib/                          # Shared Server-side Logic
│   ├── firebase/
│   │   └── admin.js            # Firebase Admin SDK setup
│   ├── repositories/            # Data Access Layer
│   │   ├── availability.repository.js
│   │   └── user.repository.js
│   └── services/                # Business Logic Layer
│       ├── availability.service.js
│       ├── calendar.service.js
│       └── user.service.js
│
├── config/
│   └── api.js                   # API configuration (now points to /api)
│
└── backend/                     # Legacy backend (can be removed)
    └── src/                     # Reference implementation
```

## Key Components

### 1. Next.js API Routes (`src/app/api/`)

**Server-side endpoints** that handle HTTP requests:
- Built on Next.js App Router
- Automatically deployed with the app
- Use server-side libraries (Firebase Admin, Google APIs)

Example: `src/app/api/availability/route.js`
```javascript
import { NextResponse } from 'next/server';
import * as availabilityService from '../../../../lib/services/availability.service';

export async function GET(request) {
  const availabilities = await availabilityService.getAvailabilities();
  return NextResponse.json({ availabilities });
}
```

### 2. Business Logic Layer (`src/lib/services/`)

**Reusable business logic** shared across API routes:
- Independent of HTTP layer
- Contains core application logic
- Can be tested independently

Example: `src/lib/services/availability.service.js`
```javascript
export async function getAvailabilities(query) {
  // Business logic here
  return await availabilityRepository.findByQuery(query);
}
```

### 3. Data Access Layer (`src/lib/repositories/`)

**Database operations** abstracted from business logic:
- Direct interaction with Firebase/Firestore
- CRUD operations
- Query building

Example: `src/lib/repositories/availability.repository.js`
```javascript
export async function findByTutor(tutorId) {
  const db = getFirestore();
  return await db.collection('availabilities')
    .where('tutorId', '==', tutorId)
    .get();
}
```

### 4. Frontend API Clients (`src/app/services/core/`)

**Client-side services** that call API routes:
- Run in the browser
- Make fetch() calls to `/api/*`
- Handle response formatting

Example: `src/app/services/core/AvailabilityService.js`
```javascript
class AvailabilityServiceClass {
  async getAvailabilities(tutorId) {
    const response = await fetch(`/api/availability?tutorId=${tutorId}`);
    return await response.json();
  }
}
```

## Data Flow

```
User Action (Browser)
    ↓
Frontend Component (React)
    ↓
Frontend Service (AvailabilityService.js)
    ↓
    fetch('/api/availability')
    ↓
API Route (src/app/api/availability/route.js)
    ↓
Business Logic (src/lib/services/availability.service.js)
    ↓
Repository (src/lib/repositories/availability.repository.js)
    ↓
Firebase/Database
```

## Benefits of Monolithic Architecture

✅ **Single Deployment**: One app to build and deploy
✅ **Simplified Development**: No CORS, no separate servers
✅ **Shared Types**: Easy to share code between frontend and backend
✅ **Better DX**: Hot reload works across the entire app
✅ **Lower Infrastructure Costs**: One server instead of two
✅ **Easier Testing**: Test entire flow in one environment

## Running the Application

### Development
```bash
npm run dev
```
Starts Next.js development server on `http://localhost:3000`
- Frontend: Accessible at root `/`
- API: Accessible at `/api/*`

### Production
```bash
npm run build
npm start
```
Builds and starts the production server.

### Testing
```bash
npm test          # Run tests
npm run test:watch  # Watch mode
```

## Environment Variables

Create a `.env.local` file:

```env
# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@example.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Or use full service account JSON
GOOGLE_SERVICE_ACCOUNT_KEY='{...full json...}'

# Google OAuth (for Calendar API)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

## API Endpoints

### Availability
- `GET /api/availability` - Get availabilities
  - Query: `tutorId`, `course`, `startDate`, `endDate`, `limit`
- `POST /api/availability/sync` - Sync from Google Calendar
- `POST /api/availability/sync-intelligent` - Smart sync (only new events)
- `POST /api/availability/create` - Create availability event
- `DELETE /api/availability/delete` - Delete availability event
- `GET /api/availability/check-event` - Check if event exists

### Users
- `GET /api/users/tutors` - Get all tutors
  - Query: `course` (optional), `limit`
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user

## Migration from Separate Backend

The previous architecture had:
- **Frontend**: React/Next.js running on port 3000
- **Backend**: NestJS running on port 3001
- **Issue**: Required running two servers, CORS setup, complex deployment

The new architecture:
- **Everything in Next.js**: Single server on port 3000
- **No CORS needed**: Same origin
- **Simpler deployment**: One Docker container, one deployment

## Migrating More Modules

To migrate additional backend modules:

1. **Create Repository** (`src/lib/repositories/module.repository.js`)
   ```javascript
   import { getFirestore } from '../firebase/admin';
   
   export async function findById(id) {
     // Database logic
   }
   ```

2. **Create Service** (`src/lib/services/module.service.js`)
   ```javascript
   import * as moduleRepository from '../repositories/module.repository';
   
   export async function getById(id) {
     // Business logic
   }
   ```

3. **Create API Route** (`src/app/api/module/route.js`)
   ```javascript
   import { NextResponse } from 'next/server';
   import * as moduleService from '../../../../lib/services/module.service';
   
   export async function GET(request) {
     const data = await moduleService.getById(id);
     return NextResponse.json({ data });
   }
   ```

4. **Update Frontend Service** (`src/app/services/core/ModuleService.js`)
   ```javascript
   async fetchData(id) {
     const response = await fetch(`/api/module?id=${id}`);
     return await response.json();
   }
   ```

## Best Practices

### Server-Side Code (API Routes, lib/)
- ✅ Use Firebase Admin SDK
- ✅ Access environment variables directly
- ✅ Use server-side libraries (googleapis)
- ❌ Don't import client-side React code
- ❌ Don't use browser APIs (window, localStorage)

### Client-Side Code (components, services/)
- ✅ Use Firebase Client SDK
- ✅ Use browser APIs
- ✅ Make fetch() calls to `/api/*`
- ❌ Don't import Firebase Admin
- ❌ Don't access server environment variables

## Deployment

### Vercel (Recommended for Next.js)
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production
Set these in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Docker: Use `.env` file or `-e` flags
- AWS/GCP: Use Secrets Manager

## Troubleshooting

### "Cannot find module '../../../../lib/...'"
- Check `jsconfig.json` has correct path aliases
- Restart your editor/IDE

### "Firebase Admin not initialized"
- Ensure environment variables are set
- Check `initializeFirebaseAdmin()` is called in API routes

### "CORS error"
- Should not happen in monolithic setup
- If it does, you're likely calling external API instead of `/api/*`

## Further Reading

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)

## Support

For questions or issues with the monolithic architecture:
1. Check this documentation
2. Review example implementations in `src/app/api/availability/`
3. Consult the team lead

---

**Last Updated**: 2026-01-16
**Architecture Version**: 2.0 (Monolithic)

