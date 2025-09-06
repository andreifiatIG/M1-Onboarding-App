# M1 Villa Management System - Agent Implementation Plan

## Executive Summary

I have analyzed your M1 Villa Management System codebase and created a specialized agent architecture optimized for your project's unique requirements. This system addresses the critical issues identified in the DATABASE_MIGRATION_TASKS.md while providing focused expertise for ongoing development.

## Project Analysis Results

### Technology Stack Detected
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript, Prisma ORM  
- **Database**: PostgreSQL with complex villa management schema (21 models)
- **Integrations**: SharePoint (Microsoft Graph), ElectricSQL, Clerk Auth, Email services

### Architecture Assessment
- **Complex Data Model**: 21 interconnected database models with sophisticated relationships
- **Multi-step Onboarding**: Enhanced wizard with progress tracking and auto-save
- **Admin Approval System**: Currently using mock data, needs database integration
- **Real-time Features**: ElectricSQL for collaborative editing and live updates
- **External Integrations**: SharePoint document management, authentication, notifications

### Critical Issues Identified
1. **Onboarding Database Disconnection**: Frontend wizard not properly integrated with enhanced database models
2. **Admin Approval Mock Data**: Admin system using hardcoded data instead of database queries
3. **Villa Profile Data Loading**: Incomplete data loading across profile sections
4. **Progress Tracking Inconsistencies**: Boolean flags vs enhanced step/field progress models

## Specialized Agent Architecture

### Agent Design Philosophy
Each agent is designed with:
- **Focused Expertise**: Deep specialization in specific technology domains
- **Clear Boundaries**: Well-defined responsibilities with minimal overlap
- **Integration Awareness**: Understanding of cross-domain dependencies
- **Current Priority Focus**: Immediate attention to critical system issues

### Agent Responsibilities Matrix

| Task Category | Database Specialist | Backend API Specialist | Frontend Specialist | Integration Specialist |
|---------------|-------------------|----------------------|-------------------|---------------------|
| Schema Changes | Primary | Secondary | Tertiary | Testing |
| API Development | Consulting | Primary | Secondary | Testing |
| UI Components | - | - | Primary | - |
| External Integrations | Consulting | Secondary | - | Primary |
| Testing & Deployment | - | - | - | Primary |

## Implementation Strategy

### Phase 1: Critical Issue Resolution (Week 1-2)
**Priority**: Fix immediate database integration problems

#### Database Specialist Tasks
1. Add rejection tracking fields to OnboardingProgress model
2. Create AdminAction model for audit trail
3. Optimize villa profile queries with proper relations
4. Fix OnboardingBackup auto-save integration

#### Backend API Specialist Tasks  
1. Create real admin approval endpoints (GET/POST /api/admin/approvals/*)
2. Update onboardingService.ts to use OnboardingSession model
3. Implement proper StepFieldProgress tracking
4. Fix villaService.ts getVillaById with complete relations

#### Frontend Specialist Tasks
1. Update admin/approvals/page.tsx to use real APIs instead of mock data
2. Fix OnboardingWizardEnhanced integration with backend progress tracking
3. Ensure villa profile sections receive proper data from optimized queries
4. Implement proper loading states and error handling

#### Integration Specialist Tasks
1. Test end-to-end onboarding flow after database fixes
2. Validate admin approval workflow integration
3. Ensure SharePoint folder creation works with villa approval process
4. Monitor ElectricSQL synchronization during progress updates

### Phase 2: System Optimization (Week 3-4)
**Priority**: Performance and integration enhancements

#### Multi-Agent Coordination Tasks
1. **Dashboard Performance Optimization**: Database + Frontend + Integration
2. **SharePoint Integration Enhancement**: Backend + Integration
3. **Real-time Progress Updates**: Backend + Frontend + Integration
4. **Comprehensive Testing**: Integration with support from all agents

### Phase 3: Advanced Features (Week 5+)
**Priority**: Advanced functionality and production readiness

#### Planned Enhancements
1. Advanced admin role management
2. Automated villa approval workflows
3. Enhanced document management
4. Production deployment optimization

## Agent Coordination Workflows

### Example: Onboarding Database Integration Fix

#### Step 1: Database Specialist
- Adds rejection tracking fields to OnboardingProgress
- Creates migration script
- Updates schema documentation

#### Step 2: Backend API Specialist
- Updates onboardingService.ts methods
- Implements new API endpoints for rejection handling
- Tests database integration

#### Step 3: Frontend Specialist  
- Updates OnboardingWizardEnhanced to handle rejection states
- Implements proper error display components
- Tests user flow with new backend APIs

#### Step 4: Integration Specialist
- Validates end-to-end rejection workflow
- Tests real-time updates via ElectricSQL
- Ensures email notifications work correctly

## Usage Guidelines

### Selecting the Right Agent

#### For Database Tasks
```
> Use database-specialist
```
- Schema modifications
- Query optimization
- Migration creation
- Data integrity issues

#### For API Development
```
> Use backend-api-specialist  
```
- New API endpoints
- Service layer logic
- External service integration
- Authentication handling

#### For Frontend Development
```
> Use frontend-specialist
```
- React component development
- User interface improvements
- Form handling and validation
- User experience optimization

#### For System Integration
```
> Use integration-specialist
```
- Cross-system issues
- External service problems
- Testing and deployment
- Performance monitoring

### Agent Switching Best Practices

1. **Start with Primary Expert**: Choose the agent most relevant to your immediate need
2. **Request Coordination**: Ask for collaboration when issues span multiple domains
3. **Use Integration Specialist**: For complex multi-system problems
4. **Follow Up**: Ensure all agents validate changes in their domain

## Current Development Context

### Immediate Priorities Based on Analysis
1. **Fix OnboardingWizardEnhanced database integration** (Frontend + Backend + Database)
2. **Replace admin approval mock data with real APIs** (Backend + Frontend)  
3. **Optimize villa profile data loading** (Database + Backend + Frontend)
4. **Implement proper progress tracking** (All agents)

### Technical Debt to Address
- Incomplete auto-save functionality
- Mock data throughout admin system
- Suboptimal database queries
- Missing error handling in critical workflows

### Integration Dependencies
- SharePoint folder creation must work with villa approval
- ElectricSQL sync must handle progress updates
- Email notifications must trigger on status changes
- Real-time updates must work across all interfaces

## Success Metrics

### Phase 1 Success Criteria
- [ ] Onboarding wizard uses real database progress tracking
- [ ] Admin approval system connects to actual database
- [ ] Villa profile sections load complete data
- [ ] Auto-save functionality works properly

### System Health Indicators
- Database query performance under 100ms for standard operations
- Frontend components render without data loading errors
- Integration tests pass for all critical workflows
- No mock data remains in production code paths

## Maintenance Strategy

### Ongoing Agent Responsibilities
- **Database Specialist**: Monitor query performance, manage schema evolution
- **Backend API Specialist**: Maintain service layer, handle integration updates
- **Frontend Specialist**: Enhance user experience, implement new features
- **Integration Specialist**: Monitor system health, coordinate deployments

### Future Agent Evolution
- Agents will be updated based on system growth
- New agents may be added for specialized features (e.g., reporting-specialist)
- Agent coordination patterns will be refined based on usage

This agent architecture is specifically designed to address your current critical issues while providing a scalable foundation for future M1 Villa Management System development.