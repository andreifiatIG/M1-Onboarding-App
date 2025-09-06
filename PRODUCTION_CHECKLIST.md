# Production Deployment Checklist

## Pre-Deployment Tasks ✅

### 1. Code Quality
- [x] Fixed uncontrolled input errors in onboarding wizard
- [x] Validated facilities stage data mapping (280 items)
- [x] Tested database connection for onboarding wizard
- [x] Updated villa profile with new onboarding fields

### 2. Database
- [x] PostgreSQL connection verified
- [x] All migrations applied
- [x] Database schema supports all onboarding fields including:
  - Staff employment type
  - Staff nationality  
  - Staff passport number
  - Staff transportation
  - Facilities with proper categorization

### 3. Frontend Fixes Applied
- [x] StaffConfiguratorStep - Added missing field initializations
- [x] FacilitiesChecklistStep - Fixed data wrapping for backend compatibility
- [x] All form fields properly controlled (no undefined → defined transitions)

### 4. Backend Integration
- [x] Onboarding API endpoints working
- [x] Data mapping between frontend and backend verified
- [x] Auto-save functionality operational

## Production Build Steps

### Frontend
```bash
cd frontend
npm run build
```

### Backend  
```bash
cd backend
npm run build
npx prisma migrate deploy
```

## Environment Variables Required

### Frontend (.env.production)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

### Backend (.env.production)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 4001)
- `CORS_ORIGIN` - Allowed origins
- `AZURE_CLIENT_ID` - SharePoint integration
- `AZURE_CLIENT_SECRET` - SharePoint integration
- `AZURE_TENANT_ID` - SharePoint integration
- Email configuration (SMTP settings)
- ElectricSQL configuration

## Deployment Commands

### Using Docker
```bash
docker-compose up -d --build
```

### Using PM2
```bash
# Backend
pm2 start backend/dist/server.js --name m1-backend

# Frontend  
pm2 start frontend/.next/standalone/server.js --name m1-frontend
```

## Post-Deployment Verification

1. Test onboarding wizard full flow
2. Verify facilities checklist (280 items load correctly)
3. Test staff configuration with all new fields
4. Verify database saves for all steps
5. Check villa profile displays all data correctly
6. Test document uploads
7. Verify email notifications
8. Check SharePoint integration
9. Test admin approval workflow

## Known Issues Resolved
- ✅ Uncontrolled input error in StaffConfiguratorStep
- ✅ Facilities data mapping to backend
- ✅ Database connection and data persistence
- ✅ Villa profile integration with onboarding data

## Performance Optimizations Applied
- Debounced auto-save (3-5 seconds)
- Memoized expensive calculations in facilities
- Optimized re-renders in onboarding wizard

## Security Checklist
- [ ] Remove development environment variables
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set secure CORS origins
- [ ] Database connection uses SSL
- [ ] Clerk authentication properly configured

## Monitoring Setup
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Performance monitoring  
- [ ] Database query monitoring
- [ ] API response time tracking

---

**Last Updated:** $(date)
**Status:** Ready for Production Deployment