# Migration Guide: Separate Backend → Monolithic Next.js

This guide helps you transition from the old architecture (separate NestJS backend + Next.js frontend) to the new monolithic Next.js architecture.

## Overview of Changes

### Before (Dual Server Architecture)
```
Frontend (Next.js)         Backend (NestJS)
Port 3000                  Port 3001
     ↓                          ↓
User Interface    →    HTTP API    →    Database
                   (CORS needed)
```

### After (Monolithic Architecture)
```
Next.js App (Single Server)
Port 3000
     ↓
Frontend Pages + API Routes → Database
(No CORS needed)
```

## Step-by-Step Migration

### Step 1: Update Environment Variables

**Old `.env`:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
```

**New `.env.local`:**
```env
# Remove NEXT_PUBLIC_BACKEND_URL
# Add Firebase Admin credentials (see .env.example)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### Step 2: Stop Running Separate Backend

You no longer need to run the NestJS backend server:

**Old workflow:**
```bash
# Terminal 1
cd backend
npm run start:dev

# Terminal 2
cd frontend
npm run dev
```

**New workflow:**
```bash
# Single terminal
npm run dev
```

### Step 3: Update Frontend Service Calls

Frontend services now call `/api/*` instead of `http://localhost:3001/api/*`:

**Old (`src/app/services/core/AvailabilityService.js`):**
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

async getAvailabilities(tutorId) {
  const response = await fetch(`${API_BASE_URL}/availability?tutorId=${tutorId}`);
  return await response.json();
}
```

**New:**
```javascript
this.apiBase = '/api'; // Local API routes

async getAvailabilities(tutorId) {
  const response = await fetch(`${this.apiBase}/availability?tutorId=${tutorId}`);
  return await response.json();
}
```

✅ This has been updated automatically in the migration.

### Step 4: Verify API Endpoints Work

Test that API endpoints respond correctly:

```bash
# Start the dev server
npm run dev

# Test an endpoint
curl http://localhost:3000/api/availability
```

### Step 5: Update Deployment

**Old deployment (two apps):**
- Frontend: Vercel/Netlify
- Backend: Heroku/AWS/GCP

**New deployment (one app):**
- Everything: Vercel (recommended) or any Node.js host

**Vercel deployment:**
```bash
vercel deploy
```

The entire app (frontend + backend) deploys together.

### Step 6: Remove Old Backend (Optional)

Once everything works, you can remove the old backend:

```bash
# Keep for reference initially
mv src/backend src/backend.old

# Or delete completely (after confirming everything works)
rm -rf src/backend
```

## Breaking Changes

### 1. API URL Changes

**Before:**
```javascript
fetch('http://localhost:3001/api/availability')
```

**After:**
```javascript
fetch('/api/availability')  // Relative URL
```

### 2. Server-Side vs Client-Side Code

**Before:** All backend code in `src/backend/`

**After:**
- **Server code**: `src/lib/` and `src/app/api/`
- **Client code**: `src/app/components/`, `src/app/services/`

### 3. Firebase SDK

**Before:** Backend used Firebase Admin SDK only

**After:**
- **Server (API routes)**: Firebase Admin SDK (`src/lib/firebase/admin.js`)
- **Client (browser)**: Firebase Client SDK (`src/firebaseConfig.js`)

### 4. Import Paths

Use the new path alias:

```javascript
// New imports in API routes
import * as availabilityService from '@/lib/services/availability.service';
import { getFirestore } from '@/lib/firebase/admin';
```

## Common Issues & Solutions

### Issue 1: "Module not found: @/lib/..."

**Solution:** Check `jsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 2: "Cannot access window in API route"

**Cause:** Trying to use browser APIs in server-side code.

**Solution:** Move browser code to client components, keep server logic in `/lib`.

### Issue 3: "Firebase Admin not initialized"

**Solution:** Ensure environment variables are set:
```bash
# Check if variables are loaded
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

If empty, check `.env.local` file exists and contains values.

### Issue 4: Old Backend Still Running

**Solution:** Stop the old backend server:
```bash
# Find and kill the process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Issue 5: CORS Errors

**Cause:** Still calling external URL instead of local API.

**Solution:** Ensure `src/config/api.js` points to `/api`:
```javascript
export const API_URL = '/api';  // Not http://localhost:3001/api
```

## Testing Migration

### 1. Test Availability Sync
```bash
# Start app
npm run dev

# In browser console:
const result = await fetch('/api/availability').then(r => r.json());
console.log(result);
```

### 2. Test User Endpoints
```bash
curl http://localhost:3000/api/users/tutors
```

### 3. Test Full Flow
1. Login to the app
2. Navigate to availability page
3. Sync calendar
4. Create an availability event
5. View availabilities

All should work without needing a separate backend.

## Rollback Plan

If you need to rollback:

1. **Restore old backend:**
   ```bash
   cd src/backend
   npm install
   npm run start:dev
   ```

2. **Revert frontend services:**
   ```javascript
   // In AvailabilityService.js
   const API_BASE_URL = 'http://localhost:3001/api';
   ```

3. **Update environment:**
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
   ```

## Checklist

- [ ] Environment variables updated (`.env.local`)
- [ ] Old backend server stopped
- [ ] Frontend services calling `/api/*`
- [ ] API routes tested and working
- [ ] Calendar sync working
- [ ] User authentication working
- [ ] Database operations working
- [ ] Deployment updated
- [ ] Team notified of changes
- [ ] Old backend backed up/archived

## Team Communication

Share this with your team:

> 🎉 **Migration Complete!**
>
> We've migrated to a monolithic Next.js architecture. Key changes:
> 
> 1. **One server**: Run only `npm run dev` (no separate backend)
> 2. **API calls**: Now go to `/api/*` (local routes)
> 3. **Environment**: Update your `.env.local` (see `.env.example`)
> 4. **Deployment**: Single deployment for everything
>
> Questions? Check `MONOLITH_ARCHITECTURE.md` or ask the team.

## Next Steps

1. **Monitor** the application in production
2. **Remove** old backend code after confidence period (1-2 weeks)
3. **Migrate** remaining modules (if any) using the patterns established
4. **Document** any custom integrations or special cases
5. **Optimize** bundling and performance

## Resources

- [MONOLITH_ARCHITECTURE.md](./MONOLITH_ARCHITECTURE.md) - Architecture details
- [.env.example](./.env.example) - Environment variable template
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Migration Date**: 2026-01-16
**Migrated By**: Development Team
**Status**: ✅ Complete

