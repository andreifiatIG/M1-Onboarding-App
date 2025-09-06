
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import onboardingService from '../services/onboardingService';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  onboardingRateLimit, 
  onboardingReadRateLimit, 
  onboardingCompleteRateLimit,
  autoSaveRateLimit
} from '../middleware/rateLimiting';
import villaService from '../services/villaService';
import { 
  createSanitizationMiddleware, 
  createValidationMiddleware, 
  sanitizers, 
  validators 
} from '../middleware/sanitization';
import { cacheMiddleware, CacheDuration, invalidateCache } from '../middleware/cache';

const router = Router();

// Sanitization middleware configurations
const onboardingStepSanitization = createSanitizationMiddleware({
  params: {
    villaId: sanitizers.text,
  },
  body: {
    step: sanitizers.integer,
    data: (data: any) => {
      if (typeof data !== 'object' || data === null) return {};
      
      // Deep sanitize object while preserving structure
      const sanitized: any = {};
      
      // Common field sanitization
      if (data.villaName) sanitized.villaName = sanitizers.text(data.villaName);
      if (data.location) sanitized.location = sanitizers.text(data.location);
      if (data.address) sanitized.address = sanitizers.text(data.address);
      if (data.city) sanitized.city = sanitizers.text(data.city);
      if (data.country) sanitized.country = sanitizers.text(data.country);
      if (data.zipCode) sanitized.zipCode = sanitizers.text(data.zipCode);
      if (data.description) sanitized.description = sanitizers.richText(data.description, 'moderate');
      if (data.shortDescription) sanitized.shortDescription = sanitizers.richText(data.shortDescription, 'strict');
      
      // Numbers
      if (data.bedrooms !== undefined) sanitized.bedrooms = sanitizers.integer(data.bedrooms);
      if (data.bathrooms !== undefined) sanitized.bathrooms = sanitizers.integer(data.bathrooms);
      if (data.maxGuests !== undefined) sanitized.maxGuests = sanitizers.integer(data.maxGuests);
      if (data.propertySize !== undefined) sanitized.propertySize = sanitizers.number(data.propertySize);
      if (data.plotSize !== undefined) sanitized.plotSize = sanitizers.number(data.plotSize);
      if (data.yearBuilt !== undefined) sanitized.yearBuilt = sanitizers.integer(data.yearBuilt);
      if (data.renovationYear !== undefined) sanitized.renovationYear = sanitizers.integer(data.renovationYear);
      if (data.latitude !== undefined) sanitized.latitude = sanitizers.number(data.latitude);
      if (data.longitude !== undefined) sanitized.longitude = sanitizers.number(data.longitude);
      
      // Owner details - Basic fields
      if (data.firstName) sanitized.firstName = sanitizers.text(data.firstName);
      if (data.lastName) sanitized.lastName = sanitizers.text(data.lastName);
      if (data.email) sanitized.email = sanitizers.email(data.email);
      if (data.phone) sanitized.phone = sanitizers.phone(data.phone);
      if (data.address) sanitized.address = sanitizers.text(data.address);
      if (data.city) sanitized.city = sanitizers.text(data.city);
      if (data.country) sanitized.country = sanitizers.text(data.country);
      if (data.zipCode) sanitized.zipCode = sanitizers.text(data.zipCode);
      
      // Owner details - Extended fields
      if (data.alternativePhone) sanitized.alternativePhone = sanitizers.phone(data.alternativePhone);
      if (data.nationality) sanitized.nationality = sanitizers.text(data.nationality);
      if (data.passportNumber) sanitized.passportNumber = sanitizers.text(data.passportNumber);
      if (data.idNumber) sanitized.idNumber = sanitizers.text(data.idNumber);
      if (data.phoneCountryCode) sanitized.phoneCountryCode = sanitizers.text(data.phoneCountryCode);
      if (data.phoneDialCode) sanitized.phoneDialCode = sanitizers.text(data.phoneDialCode);
      if (data.alternativePhoneCountryCode) sanitized.alternativePhoneCountryCode = sanitizers.text(data.alternativePhoneCountryCode);
      if (data.alternativePhoneDialCode) sanitized.alternativePhoneDialCode = sanitizers.text(data.alternativePhoneDialCode);
      if (data.preferredLanguage) sanitized.preferredLanguage = sanitizers.text(data.preferredLanguage);
      if (data.communicationPreference) sanitized.communicationPreference = sanitizers.text(data.communicationPreference);
      if (data.notes) sanitized.notes = sanitizers.text(data.notes);
      
      // Owner details - Company fields
      if (data.companyName) sanitized.companyName = sanitizers.text(data.companyName);
      if (data.companyAddress) sanitized.companyAddress = sanitizers.text(data.companyAddress);
      if (data.companyTaxId) sanitized.companyTaxId = sanitizers.text(data.companyTaxId);
      if (data.companyVat) sanitized.companyVat = sanitizers.text(data.companyVat);
      
      // Owner details - Manager fields
      if (data.managerName) sanitized.managerName = sanitizers.text(data.managerName);
      if (data.managerEmail) sanitized.managerEmail = sanitizers.email(data.managerEmail);
      if (data.managerPhone) sanitized.managerPhone = sanitizers.phone(data.managerPhone);
      if (data.managerPhoneCountryCode) sanitized.managerPhoneCountryCode = sanitizers.text(data.managerPhoneCountryCode);
      if (data.managerPhoneDialCode) sanitized.managerPhoneDialCode = sanitizers.text(data.managerPhoneDialCode);
      
      // Owner details - Property contact fields
      if (data.propertyEmail) sanitized.propertyEmail = sanitizers.email(data.propertyEmail);
      if (data.propertyWebsite) sanitized.propertyWebsite = sanitizers.url(data.propertyWebsite);
      
      // Owner details - Owner type
      if (data.ownerType) sanitized.ownerType = sanitizers.text(data.ownerType);
      
      // Bank details  
      if (data.accountHolderName) sanitized.accountHolderName = sanitizers.text(data.accountHolderName);
      if (data.bankName) sanitized.bankName = sanitizers.text(data.bankName);
      if (data.accountNumber) sanitized.accountNumber = sanitizers.text(data.accountNumber);
      if (data.routingNumber) sanitized.routingNumber = sanitizers.text(data.routingNumber);
      if (data.iban) sanitized.iban = sanitizers.text(data.iban);
      if (data.swiftCode) sanitized.swiftCode = sanitizers.text(data.swiftCode);
      if (data.branchName) sanitized.branchName = sanitizers.text(data.branchName);
      if (data.branchCode) sanitized.branchCode = sanitizers.text(data.branchCode);
      if (data.branchAddress) sanitized.branchAddress = sanitizers.text(data.branchAddress);
      if (data.bankCountry) sanitized.bankCountry = sanitizers.text(data.bankCountry);
      if (data.currency) sanitized.currency = sanitizers.text(data.currency);
      if (data.accountType) sanitized.accountType = sanitizers.text(data.accountType);
      if (data.taxId) sanitized.taxId = sanitizers.text(data.taxId);
      if (data.notes) sanitized.notes = sanitizers.text(data.notes);
      
      // Financial data
      if (data.commissionRate !== undefined) sanitized.commissionRate = sanitizers.number(data.commissionRate);
      if (data.managementFee !== undefined) sanitized.managementFee = sanitizers.number(data.managementFee);
      if (data.marketingFee !== undefined) sanitized.marketingFee = sanitizers.number(data.marketingFee);
      
      // Contract dates
      if (data.contractStartDate) sanitized.contractStartDate = sanitizers.text(data.contractStartDate);
      if (data.contractEndDate) sanitized.contractEndDate = sanitizers.text(data.contractEndDate);
      
      // Payout days
      if (data.payoutDay1 !== undefined) sanitized.payoutDay1 = sanitizers.integer(data.payoutDay1);
      if (data.payoutDay2 !== undefined) sanitized.payoutDay2 = sanitizers.integer(data.payoutDay2);
      
      // VAT and other contractual fields
      if (data.vatRegistrationNumber) sanitized.vatRegistrationNumber = sanitizers.text(data.vatRegistrationNumber);
      if (data.dbdNumber) sanitized.dbdNumber = sanitizers.text(data.dbdNumber);
      if (data.vatPaymentTerms) sanitized.vatPaymentTerms = sanitizers.text(data.vatPaymentTerms);
      if (data.paymentTerms) sanitized.paymentTerms = sanitizers.text(data.paymentTerms);
      if (data.specialTerms) sanitized.specialTerms = sanitizers.text(data.specialTerms);
      if (data.insuranceProvider) sanitized.insuranceProvider = sanitizers.text(data.insuranceProvider);
      if (data.insurancePolicyNumber) sanitized.insurancePolicyNumber = sanitizers.text(data.insurancePolicyNumber);
      if (data.insuranceExpiry) sanitized.insuranceExpiry = sanitizers.text(data.insuranceExpiry);
      if (data.checkInTime) sanitized.checkInTime = sanitizers.text(data.checkInTime);
      if (data.checkOutTime) sanitized.checkOutTime = sanitizers.text(data.checkOutTime);
      if (data.minimumStayNights !== undefined) sanitized.minimumStayNights = sanitizers.integer(data.minimumStayNights);
      if (data.paymentThroughIPL !== undefined) sanitized.paymentThroughIPL = sanitizers.boolean(data.paymentThroughIPL);
      
      // URLs and usernames
      if (data.website) sanitized.website = sanitizers.url(data.website);
      if (data.googleMapsLink) sanitized.googleMapsLink = sanitizers.url(data.googleMapsLink);
      if (data.oldRatesCardLink) sanitized.oldRatesCardLink = sanitizers.url(data.oldRatesCardLink);
      if (data.iCalCalendarLink) sanitized.iCalCalendarLink = sanitizers.url(data.iCalCalendarLink);
      if (data.bookingComUsername) sanitized.bookingComUsername = sanitizers.email(data.bookingComUsername);
      if (data.airbnbUsername) sanitized.airbnbUsername = sanitizers.email(data.airbnbUsername);
      if (data.vrboUsername) sanitized.vrboUsername = sanitizers.email(data.vrboUsername);
      
      // Arrays
      if (data.tags) sanitized.tags = sanitizers.array(data.tags, sanitizers.text);

      // Facilities array (step 8) - preserve and sanitize expected fields
      if (data.facilities && Array.isArray(data.facilities)) {
        sanitized.facilities = data.facilities.map((item: any) => ({
          category: item.category ? sanitizers.text(item.category) : undefined,
          subcategory: item.subcategory ? sanitizers.text(item.subcategory) : undefined,
          itemName: item.itemName ? sanitizers.text(item.itemName) : undefined,
          isAvailable: item.isAvailable !== undefined ? sanitizers.boolean(item.isAvailable) : undefined,
          quantity: item.quantity !== undefined && item.quantity !== null ? sanitizers.integer(item.quantity) : undefined,
          condition: item.condition ? sanitizers.text(item.condition) : undefined,
          notes: item.notes ? sanitizers.text(item.notes) : undefined,
          specifications: item.specifications ? sanitizers.text(item.specifications) : undefined,
          photoUrl: item.photoUrl ? sanitizers.url(item.photoUrl) : undefined,
          productLink: item.productLink ? sanitizers.url(item.productLink) : undefined,
          checkedBy: item.checkedBy ? sanitizers.text(item.checkedBy) : undefined,
          lastCheckedAt: item.lastCheckedAt ? sanitizers.text(item.lastCheckedAt) : undefined,
        }));
      }
      
      // OTA Platforms array
      if (data.platforms && Array.isArray(data.platforms)) {
        sanitized.platforms = data.platforms.map((platform: any) => ({
          platform: sanitizers.text(platform.platform),
          username: platform.username ? sanitizers.text(platform.username) : null,
          password: platform.password ? sanitizers.text(platform.password) : null,
          propertyId: platform.propertyId ? sanitizers.text(platform.propertyId) : null,
          apiKey: platform.apiKey ? sanitizers.text(platform.apiKey) : null,
          apiSecret: platform.apiSecret ? sanitizers.text(platform.apiSecret) : null,
          listingUrl: platform.listingUrl ? sanitizers.url(platform.listingUrl) : null,
          accountUrl: platform.accountUrl ? sanitizers.url(platform.accountUrl) : null,
          propertyUrl: platform.propertyUrl ? sanitizers.url(platform.propertyUrl) : null,
          isActive: platform.isActive !== undefined ? sanitizers.boolean(platform.isActive) : true,
        }));
      }
      
      // Pass through safe enum values and booleans
      const safeFields = [
        'propertyType', 'villaStyle', 'contractType', 'paymentSchedule', 
        'cancellationPolicy', 'status', 'isActive', 'completed'
      ];
      
      safeFields.forEach(field => {
        if (data[field] !== undefined) {
          if (typeof data[field] === 'boolean') {
            sanitized[field] = sanitizers.boolean(data[field]);
          } else {
            sanitized[field] = sanitizers.text(data[field]);
          }
        }
      });
      
      return sanitized;
    },
    completed: sanitizers.boolean,
  },
});

const onboardingStepValidation = createValidationMiddleware({
  params: {
    villaId: [validators.required, validators.uuid],
  },
  body: {
    step: [validators.required, validators.integer, (v) => validators.range(v, 1, 10)],
    completed: [validators.required],
  },
});

// Validation schemas
const updateStepSchema = z.object({
  body: z.object({
    step: z.number().int().min(1).max(10),
    data: z.any(),
    completed: z.boolean(),
  }),
});

const submitReviewSchema = z.object({
  params: z.object({
    villaId: z.string().uuid(),
  }),
});

const startOnboardingSchema = z.object({
  body: z.object({
    villaName: z.string().optional().default('New Villa'),
  }),
});

const approveRejectSchema = z.object({
  params: z.object({
    villaId: z.string().uuid(),
  }),
  body: z.object({
    notes: z.string().optional(),
    reason: z.string().optional(),
  }),
});

// Smart rate limiting middleware that detects auto-save requests
const smartOnboardingRateLimit = (req: any, res: any, next: any) => {
  // Check if this is an auto-save request (could be header or body flag)
  const isAutoSave = req.headers['x-auto-save'] === 'true' || req.body?.isAutoSave === true;
  
  if (isAutoSave) {
    return autoSaveRateLimit(req, res, next);
  } else {
    return onboardingRateLimit(req, res, next);
  }
};

// Start onboarding (creates villa and initializes progress)
router.post('/start', 
  onboardingRateLimit, 
  authenticate, 
  validateRequest(startOnboardingSchema),
  async (req: Request, res: Response) => {
  try {
    const { villaName } = req.body;
    const userId = req.user?.id || 'system';
    
    // Create villa for onboarding
    const villa = await villaService.createVillaForOnboarding({
      name: villaName || 'New Villa',
      owner_id: userId
    });
    
    // Initialize enhanced progress tracking
    await onboardingService.initializeEnhancedProgress(villa.id, userId);
    
    // Get the complete progress data
    const progress = await onboardingService.getOnboardingProgress(villa.id, userId);
    
    res.json({
      success: true,
      data: {
        villaId: villa.id,
        villaCode: villa.villaCode,
        villaName: villa.villaName,
        progress
      },
      message: 'Onboarding started successfully',
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start onboarding',
    });
  }
});

// Get onboarding progress for a villa (with caching)
router.get('/:villaId', 
  onboardingReadRateLimit, 
  authenticate, 
  cacheMiddleware(CacheDuration.SHORT),
  async (req: Request, res: Response) => {
  try {
    const { villaId } = req.params;
    const userId = req.user?.id;
    
    const progress = await onboardingService.getOnboardingProgress(villaId, userId);
    
    console.log('🏠 API Response - Villa data being sent to frontend:', {
      villaId: progress.villa?.id,
      villaFields: Object.keys(progress.villa || {}),
      villaData: progress.villa
    });
    
    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get onboarding progress',
    });
  }
});

// Update onboarding step (with cache invalidation and smart rate limiting)
router.put('/:villaId/step', 
  smartOnboardingRateLimit, 
  onboardingStepSanitization, 
  onboardingStepValidation, 
  authenticate, 
  validateRequest(updateStepSchema),
  invalidateCache(['onboarding']), // Invalidate cache on update
  async (req: Request, res: Response) => {
  try {
    const { villaId } = req.params;
    const stepData = req.body;
    const userId = req.user?.id || 'system';
    
    
    const progress = await onboardingService.updateStep(villaId, stepData, userId);
    
    res.json({
      success: true,
      data: progress,
      message: `Step ${stepData.step} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update onboarding step',
    });
  }
});

// Validate specific step
router.get('/:villaId/validate/:step', onboardingReadRateLimit, authenticate, async (req: Request, res: Response) => {
  try {
    const { villaId, step } = req.params;
    const stepNumber = parseInt(step, 10);
    
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number',
      });
    }
    
    const validation = await onboardingService.validateStep(villaId, stepNumber);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Error validating step:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to validate step',
    });
  }
});

// Complete onboarding (mark as fully complete)
router.post('/:villaId/complete', onboardingCompleteRateLimit, authenticate, async (req: Request, res: Response) => {
  try {
    const { villaId } = req.params;
    
    // Mark onboarding as complete and villa as active
    const progress = await onboardingService.completeOnboarding(villaId);
    
    res.json({
      success: true,
      data: progress,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to complete onboarding',
    });
  }
});

// Submit for review
router.post('/:villaId/submit-review', onboardingCompleteRateLimit, authenticate, async (_req: Request, res: Response) => {
  return res.status(410).json({ success: false, message: 'Admin approval system has been removed' });
});

// Approve onboarding (Admin only)
router.post('/:villaId/approve', authenticate, async (_req: Request, res: Response) => {
  return res.status(410).json({ success: false, message: 'Admin approval system has been removed' });
});

// Reject onboarding (Admin only)
router.post('/:villaId/reject', authenticate, async (_req: Request, res: Response) => {
  return res.status(410).json({ success: false, message: 'Admin approval system has been removed' });
});

// Auto-save field progress endpoint
router.put('/:villaId/field-progress/:step/:field', 
  autoSaveRateLimit,
  authenticate,
  async (req: Request, res: Response) => {
  try {
    const { villaId, step, field } = req.params;
    const { value } = req.body;
    const stepNumber = parseInt(step, 10);
    const userId = req.user?.id || 'system';
    
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number',
      });
    }
    
    // Auto-save field progress
    await onboardingService.saveFieldProgress(villaId, stepNumber, field, value, userId);
    
    res.json({
      success: true,
      message: 'Field progress auto-saved successfully',
    });
  } catch (error) {
    console.error('Error auto-saving field progress:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-save failed',
    });
  }
});

// Get field progress for a specific step (for auto-save restoration)
router.get('/:villaId/field-progress/:step', 
  onboardingReadRateLimit,
  authenticate,
  cacheMiddleware(CacheDuration.SHORT),
  async (req: Request, res: Response) => {
  try {
    const { villaId, step } = req.params;
    const stepNumber = parseInt(step, 10);
    
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number',
      });
    }
    
    const fieldProgress = await onboardingService.getFieldProgress(villaId, stepNumber);
    
    res.json({
      success: true,
      data: fieldProgress,
    });
  } catch (error) {
    console.error('Error getting field progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get field progress',
    });
  }
});

export default router;
