# 🚨 Critical Fixes for Onboarding Wizard - Production Issues

## Problem Summary
The onboarding wizard has three stages that are failing:
1. **Photos Upload** - "Failed to fetch" error
2. **Documents Upload** - "Failed to fetch" error  
3. **Facilities Checklist** - Data not persisting properly

## Root Causes Identified

### 1. Backend Server Stability
- The backend server is crashing due to timeout issues
- SharePoint download errors causing stream handling problems
- Fixed in `microsoftGraphService.ts` but needs server restart

### 2. Frontend-Backend Connection Issues
- Frontend running on port 3001
- Backend configured for port 4001
- CORS properly configured but server needs to be running

### 3. Data Persistence Issues
- Facilities data not mapping correctly
- Photos not rendering due to SharePoint download errors
- Documents failing to upload due to server instability

## Immediate Action Steps

### Step 1: Start Backend Server Properly
```bash
cd /home/taif_me/Development/M1-PostgreSQL-Standalone/backend

# Kill any existing processes
pkill -f "node|tsx" 

# Start with proper logging
npm run dev
# OR if that fails:
node --max-old-space-size=4096 node_modules/.bin/tsx src/server.ts
```

### Step 2: Start Frontend Server
```bash
cd /home/taif_me/Development/M1-PostgreSQL-Standalone/frontend

# Kill any existing Next.js processes
pkill -f "next"

# Start on port 3001
PORT=3001 npm run dev
```

### Step 3: Verify Services
```bash
# Check backend
curl http://localhost:4001/health

# Check frontend
curl http://localhost:3001
```

## Code Fixes Already Applied

### 1. SharePoint Photo Download Fix
**File**: `backend/src/services/microsoftGraphService.ts`
**Issue**: `content.on is not a function` error
**Fix**: Updated to handle both ArrayBuffer and Stream responses
```typescript
// Changed from getStream() to:
const response = await this.client
  .api(`/sites/${siteId}/drives/${driveId}/items/${fileId}/content`)
  .responseType('arraybuffer')
  .get();
```

### 2. Photo Rendering Fix
**File**: `backend/src/routes/photos.ts`
**Endpoint**: `/api/photos/serve/:photoId`
- Added proper error handling
- Fallback to local storage when SharePoint fails
- Proper CORS headers

### 3. Documents Upload Endpoint
**File**: `backend/src/routes/documents.ts`
**Endpoint**: `/api/documents/upload-sharepoint`
- Endpoint exists and is properly configured
- Handles SharePoint upload with temp file creation
- Updates onboarding progress automatically

## Remaining Issues to Fix

### 1. Facilities Data Persistence
The facilities checklist needs to properly save and load data:
- Field progress needs to be saved to `StepFieldProgress` table
- Data mapping between frontend and backend needs alignment
- Category mappings need to be consistent

### 2. Photo Upload Error Handling
- Add retry logic for SharePoint uploads
- Implement proper fallback to local storage
- Add progress indicators for large uploads

### 3. Document Upload Error Handling
- Add better error messages for specific failure types
- Implement chunked upload for large files
- Add validation for file types and sizes

## Testing Checklist

### Photos Upload (Step 9)
- [ ] Upload single photo
- [ ] Upload multiple photos
- [ ] Verify photos display after upload
- [ ] Refresh page and check persistence
- [ ] Delete photo functionality
- [ ] Bedroom configuration saves

### Documents Upload (Step 6)
- [ ] Upload PDF document
- [ ] Upload Word document
- [ ] Multiple file upload
- [ ] Error handling for invalid files
- [ ] Progress indicator works
- [ ] Documents persist after refresh

### Facilities Checklist (Step 8)
- [ ] Toggle facility items
- [ ] Add quantities
- [ ] Add notes
- [ ] Data saves on navigation
- [ ] Data loads on return
- [ ] Search functionality works

## Quick Debug Commands

```bash
# Check for errors in backend logs
tail -f backend/logs/error.log

# Check database for saved data
cd backend && npx prisma studio

# Test photo endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/photos/villa/YOUR_VILLA_ID

# Test document endpoint  
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/documents/villa/YOUR_VILLA_ID

# Test facilities endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/facilities/villa/YOUR_VILLA_ID
```

## Environment Variables Check

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/ils_m1_villa_management
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
PORT=4001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
```

## Final Steps for Production

1. **Ensure both servers are running**
   - Backend on port 4001
   - Frontend on port 3001

2. **Test the full onboarding flow**
   - Create new villa
   - Complete all 10 steps
   - Verify data persistence

3. **Check error logs**
   - No 429 rate limit errors
   - No SharePoint connection errors
   - No database connection issues

4. **Performance check**
   - Photo uploads < 5 seconds
   - Page loads < 2 seconds
   - Autosave working smoothly

## Support Contact
If issues persist after following these steps:
1. Check the PRODUCTION_FIXES.md for additional details
2. Review error logs in backend/logs/
3. Verify all environment variables are set correctly
4. Ensure PostgreSQL database is running and accessible
