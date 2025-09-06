-- ElectricSQL Performance Optimization - Database Indexes
-- This script creates optimized indexes for ElectricSQL Shape API queries

-- Villa table indexes (most queried table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_status ON "Villa" ("status") WHERE "status" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_location ON "Villa" ("location") WHERE "location" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_active ON "Villa" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_created_at ON "Villa" ("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_updated_at ON "Villa" ("updatedAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_code ON "Villa" ("villaCode") WHERE "villaCode" IS NOT NULL;

-- Villa-related table indexes for fast joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_owner_villa_id ON "Owner" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_villa_id ON "Staff" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_villa_id ON "Photo" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_villa_id ON "Document" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractual_villa_id ON "ContractualDetails" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_villa_id ON "BankDetails" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ota_villa_id ON "OTACredentials" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facility_villa_id ON "FacilityChecklist" ("villaId") WHERE "villaId" IS NOT NULL;

-- Photo-specific indexes (high volume table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_category ON "Photo" ("category") WHERE "category" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_main ON "Photo" ("isMain") WHERE "isMain" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_sort_order ON "Photo" ("sortOrder") WHERE "sortOrder" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_created_at ON "Photo" ("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_villa_category ON "Photo" ("villaId", "category") WHERE "villaId" IS NOT NULL AND "category" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_sharepoint_id ON "Photo" ("sharePointFileId") WHERE "sharePointFileId" IS NOT NULL;

-- Document-specific indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_type ON "Document" ("documentType") WHERE "documentType" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_status ON "Document" ("status") WHERE "status" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_created_at ON "Document" ("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_villa_type ON "Document" ("villaId", "documentType") WHERE "villaId" IS NOT NULL AND "documentType" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharepoint_id ON "Document" ("sharePointFileId") WHERE "sharePointFileId" IS NOT NULL;

-- Onboarding-related indexes (frequently queried during onboarding flow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_villa_id ON "OnboardingSession" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_user_id ON "OnboardingSession" ("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_current_step ON "OnboardingSession" ("currentStep") WHERE "currentStep" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_completed ON "OnboardingSession" ("isCompleted") WHERE "isCompleted" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_activity ON "OnboardingSession" ("lastActivityAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_progress_villa_id ON "OnboardingProgress" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_progress_step ON "OnboardingProgress" ("stepNumber") WHERE "stepNumber" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_progress_status ON "OnboardingProgress" ("status") WHERE "status" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_step_progress_villa_id ON "OnboardingStepProgress" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_step_progress_step ON "OnboardingStepProgress" ("stepNumber") WHERE "stepNumber" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_step_progress_completed ON "OnboardingStepProgress" ("isCompleted") WHERE "isCompleted" IS NOT NULL;

-- StepFieldProgress indexes (high volume table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_step_field_progress_villa_id ON "StepFieldProgress" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_step_field_progress_step ON "StepFieldProgress" ("stepNumber") WHERE "stepNumber" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_step_field_progress_field ON "StepFieldProgress" ("fieldName") WHERE "fieldName" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_step_field_progress_completed ON "StepFieldProgress" ("isCompleted") WHERE "isCompleted" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_step_field_progress_villa_step ON "StepFieldProgress" ("villaId", "stepNumber") WHERE "villaId" IS NOT NULL AND "stepNumber" IS NOT NULL;

-- Staff indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_role ON "Staff" ("role") WHERE "role" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_active ON "Staff" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_created_at ON "Staff" ("createdAt" DESC);

-- Owner indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_owner_type ON "Owner" ("ownerType") WHERE "ownerType" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_owner_email ON "Owner" ("email") WHERE "email" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_owner_created_at ON "Owner" ("createdAt" DESC);

-- Facility Checklist indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facility_category ON "FacilityChecklist" ("category") WHERE "category" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facility_available ON "FacilityChecklist" ("isAvailable") WHERE "isAvailable" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facility_villa_category ON "FacilityChecklist" ("villaId", "category") WHERE "villaId" IS NOT NULL AND "category" IS NOT NULL;

-- OTA Credentials indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ota_platform ON "OTACredentials" ("platform") WHERE "platform" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ota_active ON "OTACredentials" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ota_villa_platform ON "OTACredentials" ("villaId", "platform") WHERE "villaId" IS NOT NULL AND "platform" IS NOT NULL;

-- Bank Details indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_currency ON "BankDetails" ("currency") WHERE "currency" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_verified ON "BankDetails" ("isVerified") WHERE "isVerified" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_account_type ON "BankDetails" ("accountType") WHERE "accountType" IS NOT NULL;

-- Contractual Details indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractual_type ON "ContractualDetails" ("contractType") WHERE "contractType" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractual_start_date ON "ContractualDetails" ("contractStartDate") WHERE "contractStartDate" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractual_end_date ON "ContractualDetails" ("contractEndDate") WHERE "contractEndDate" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractual_payment_schedule ON "ContractualDetails" ("paymentSchedule") WHERE "paymentSchedule" IS NOT NULL;

-- Backup and audit tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_backup_villa_id ON "OnboardingBackup" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_backup_created_at ON "OnboardingBackup" ("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skipped_item_villa_id ON "SkippedItem" ("villaId") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skipped_item_created_at ON "SkippedItem" ("createdAt" DESC);

-- Composite indexes for common ElectricSQL queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_villa_status_location ON "Villa" ("status", "location") WHERE "status" IS NOT NULL AND "location" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_villa_main_sort ON "Photo" ("villaId", "isMain", "sortOrder") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_villa_status_type ON "Document" ("villaId", "status", "documentType") WHERE "villaId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_session_villa_user ON "OnboardingSession" ("villaId", "userId") WHERE "villaId" IS NOT NULL AND "userId" IS NOT NULL;

-- Performance monitoring query
-- Use this to monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

ANALYZE;
