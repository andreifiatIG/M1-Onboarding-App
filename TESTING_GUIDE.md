# 🧪 M1 Villa Management System - Testing Guide

## 🎯 Overview

This guide provides comprehensive testing procedures for the recently implemented fixes, particularly focusing on:
- ✅ Rate limiting issues resolved
- ✅ Photo upload and rendering fixes
- ✅ GitHub security issues resolved
- ✅ Data persistence improvements
- ✅ Onboarding wizard stability enhancements

## 🚀 Pre-Testing Setup

### 1. Environment Setup
```bash
# Ensure all services are running
npm run dev  # Starts both backend and frontend

# Verify database connection
cd backend && npm run db:migrate
cd backend && npx prisma studio  # Optional: View database
```

### 2. Check Service Status
```bash
# Backend should be running on http://localhost:4001
curl http://localhost:4001/health

# Frontend should be running on http://localhost:3000
curl http://localhost:3000
```

## 🔍 Critical Test Cases

### Test 1: Rate Limiting Fixes ✅

**What we fixed**: OnboardingWizardEnhanced was making too many API requests during initialization, causing 429 errors.

**Test Procedure**:
1. Open browser and navigate to onboarding wizard
2. Open browser dev tools → Network tab
3. Refresh the page multiple times
4. Look for 429 (Rate Limit) errors

**Expected Results**:
- ✅ No 429 rate limit errors
- ✅ Initialization completes successfully
- ✅ All data loads properly without throttling
- ✅ Retry mechanisms work if any temporary limits hit

**Rate Limit Configuration**:
- Onboarding: 150 requests/minute (was 60)
- Read operations: 200 requests/minute (was 100) 
- Auto-save: 300 requests/minute (was 120)

---

### Test 2: Photo Upload & Rendering ✅

**What we fixed**: Images weren't displaying in `<img>` tags, and photos weren't persisting on refresh.

**Test Procedure**:
1. Navigate to Step 9 (Photos) in onboarding wizard
2. Upload photos to different categories (logo, exterior, bedrooms, etc.)
3. Refresh the page
4. Navigate away from step 9 and back
5. Check image display in browser dev tools

**Expected Results**:
- ✅ Photos upload successfully to SharePoint
- ✅ Images display correctly in `<img>` tags
- ✅ Photos persist after page refresh
- ✅ Preview URLs use cache-busting parameters (`?t=timestamp`)
- ✅ Fallback placeholders work for failed image loads

**Technical Details**:
- Photos use `/api/photos/serve/:photoId` endpoint
- Cache-busting timestamps prevent browser caching issues
- Improved error handling with retry mechanisms

---

### Test 3: Bedroom Configuration Persistence ✅

**What we fixed**: Bedroom configurations in step 9 weren't saving/loading properly.

**Test Procedure**:
1. Go to Step 9 → Bedrooms section
2. Add multiple bedrooms with different names and bed types
3. Upload photos to specific bedrooms
4. Refresh the page
5. Check that bedroom configurations are restored

**Expected Results**:
- ✅ Bedroom configurations save to field progress
- ✅ Bedroom data loads correctly on refresh
- ✅ JSON parsing works for bedroom data
- ✅ Photos are correctly associated with bedroom subfolders

---

### Test 4: Onboarding Data Persistence

**Test Procedure**:
1. Complete onboarding steps 1-5 with real data
2. Navigate between steps multiple times
3. Refresh browser at different steps
4. Check browser localStorage and database

**Expected Results**:
- ✅ Data saves to database automatically (autosave)
- ✅ Data persists between step navigation
- ✅ Page refresh doesn't lose entered data
- ✅ Step completion flags update correctly
- ✅ Progress tracking shows accurate percentages

---

### Test 5: Auto-save Functionality

**Test Procedure**:
1. Fill out form fields in any onboarding step
2. Wait 30 seconds (debounce period)
3. Check browser dev tools → Network tab for auto-save requests
4. Verify data in database

**Expected Results**:
- ✅ Auto-save triggers after 30-second debounce
- ✅ No excessive API calls or rate limiting
- ✅ Data successfully persists to database
- ✅ Visual feedback shows "Auto-saved" status

---

## 🔧 Advanced Testing

### Database Integration Testing

**Verify Data Flow**:
```bash
# Check database tables for saved data
cd backend && npx prisma studio

# Look for data in these tables:
# - Villa (step 1 data)
# - Owner (step 2 data)  
# - ContractualDetails (step 3 data)
# - BankDetails (step 4 data)
# - OTACredentials (step 5 data)
# - Document (step 6 data)
# - Staff (step 7 data)
# - FacilityChecklist (step 8 data)
# - Photo (step 9 data)
# - OnboardingProgress (completion tracking)
```

**Field Progress Tracking**:
```bash
# Check field-level progress is being saved
# Look in StepFieldProgress table for:
# - Step 8: Facilities data
# - Step 9: Bedrooms configuration (JSON)
```

### SharePoint Integration Testing

**Test Document & Photo Upload**:
1. Configure SharePoint credentials in backend `.env`
2. Upload documents in step 6
3. Upload photos in step 9  
4. Verify files appear in SharePoint site
5. Check database has correct SharePoint file IDs

### Performance Testing

**Load Testing**:
1. Open multiple browser tabs
2. Start onboarding in each tab simultaneously
3. Monitor for rate limiting or performance issues
4. Check server logs for errors

## 🐛 Known Issues & Workarounds

### Issue 1: SharePoint Authentication
**Problem**: SharePoint uploads may fail if Azure credentials are not configured.
**Workaround**: System falls back to local file storage with preview mode.
**Solution**: Configure Azure app registration with proper SharePoint permissions.

### Issue 2: Large Image Files
**Problem**: Very large images (>50MB) may timeout during upload.
**Workaround**: Resize images before upload or implement chunked uploads.

### Issue 3: Browser Cache
**Problem**: Old cached images may show despite updates.
**Solution**: Cache-busting parameters now prevent this issue.

## ✅ Success Criteria

The system is ready for production when:

- [ ] All photos display correctly without 404 errors
- [ ] No rate limiting errors (429) during normal usage
- [ ] Data persists correctly across page refreshes
- [ ] Bedroom configurations save and load properly
- [ ] Auto-save works without excessive API calls
- [ ] SharePoint integration works for file uploads
- [ ] Database shows all onboarding data correctly
- [ ] Progress tracking shows accurate completion percentages

## 📞 Troubleshooting

### Common Issues:

1. **Rate Limit Errors**: Check rate limiting middleware configuration
2. **Images Not Loading**: Verify photo serve endpoint and cache headers
3. **Data Not Saving**: Check API endpoints and database connectivity
4. **Authentication Issues**: Verify Clerk configuration
5. **SharePoint Problems**: Check Azure app permissions

### Debug Commands:
```bash
# Check backend logs
cd backend && npm run dev  # Look for errors in console

# Check database connectivity
cd backend && npx prisma db pull

# Verify API endpoints
curl http://localhost:4001/api/onboarding/health

# Check photo serve endpoint
curl http://localhost:4001/api/photos/serve/test-id
```

## 🎯 Production Readiness Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Environment variables configured securely
- [ ] Database migrations complete
- [ ] SharePoint integration working
- [ ] Error monitoring configured
- [ ] Performance metrics collected
- [ ] Security review completed
- [ ] Load testing performed
- [ ] Backup procedures tested

---

## 🚀 Quick Validation Script

Run this script to quickly validate all major fixes:

```bash
#!/bin/bash
echo "🧪 Running M1 Villa Management Quick Validation..."

# Test photo fixes
echo "1. Testing photo rendering fixes..."
node test-photo-fixes.js

# Test backend health
echo "2. Testing backend connectivity..."
curl -s http://localhost:4001/health || echo "❌ Backend not running"

# Test frontend
echo "3. Testing frontend..."
curl -s http://localhost:3000 > /dev/null || echo "❌ Frontend not running"

# Test database connectivity
echo "4. Testing database..."
cd backend && npx prisma db pull > /dev/null 2>&1 || echo "❌ Database not accessible"

echo "✅ Quick validation complete!"
```

This comprehensive testing guide ensures all recent fixes are working correctly and the system is ready for production deployment! 🎉
