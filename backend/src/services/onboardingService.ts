import { PrismaClient, OnboardingStatus, VillaStatus, StepStatus, FieldStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import onboardingProgressService from './onboardingProgressService';

const prisma = new PrismaClient();

export interface OnboardingStepData {
  step: number;
  data: any;
  completed: boolean;
}

export interface OnboardingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class OnboardingService {
  private readonly TOTAL_STEPS = 10;
  
  private readonly STEP_NAMES = {
    1: 'villaInfo',
    2: 'ownerDetails',
    3: 'contractualDetails',
    4: 'bankDetails',
    5: 'otaCredentials',
    6: 'documents',
    7: 'staffConfig',
    8: 'facilities',
    9: 'photos',
    10: 'review',
  };

  // Map step numbers to actual database boolean field names
  private readonly STEP_COMPLETION_FIELDS = {
    1: 'villaInfoCompleted',
    2: 'ownerDetailsCompleted',
    3: 'contractualDetailsCompleted',
    4: 'bankDetailsCompleted',
    5: 'otaCredentialsCompleted',
    6: 'documentsUploaded',
    7: 'staffConfigCompleted',
    8: 'facilitiesCompleted',
    9: 'photosUploaded',
    10: 'reviewCompleted',
  };

  /**
   * Get progress status based on completion percentage
   */
  private getProgressStatus(progressPercentage: number): string {
    if (progressPercentage >= 100) return 'COMPLETED';
    if (progressPercentage >= 90) return 'READY_FOR_REVIEW';
    if (progressPercentage >= 70) return 'MOSTLY_COMPLETE';
    if (progressPercentage >= 50) return 'IN_PROGRESS';
    if (progressPercentage >= 20) return 'STARTED';
    return 'NOT_STARTED';
  }

  /**
   * Map staff position to appropriate department and employment type defaults
   */
  private mapStaffDefaults(position: string) {
    const departmentMap: Record<string, string> = {
      'VILLA_MANAGER': 'MANAGEMENT',
      'HOUSEKEEPER': 'HOUSEKEEPING',
      'GARDENER': 'MAINTENANCE',
      'POOL_MAINTENANCE': 'MAINTENANCE',
      'SECURITY': 'SECURITY',
      'CHEF': 'HOSPITALITY',
      'DRIVER': 'HOSPITALITY',
      'CONCIERGE': 'HOSPITALITY',
      'MAINTENANCE': 'MAINTENANCE',
      'OTHER': 'ADMINISTRATION'
    };

    const employmentTypeMap: Record<string, string> = {
      'VILLA_MANAGER': 'FULL_TIME',
      'HOUSEKEEPER': 'FULL_TIME',
      'GARDENER': 'PART_TIME',
      'POOL_MAINTENANCE': 'CONTRACT',
      'SECURITY': 'FULL_TIME',
      'CHEF': 'FULL_TIME',
      'DRIVER': 'PART_TIME',
      'CONCIERGE': 'FULL_TIME',
      'MAINTENANCE': 'CONTRACT',
      'OTHER': 'FULL_TIME'
    };

    return {
      department: departmentMap[position] || 'ADMINISTRATION',
      employmentType: employmentTypeMap[position] || 'FULL_TIME'
    };
  }

  /**
   * Get or create onboarding progress for a villa
   */
  async getOnboardingProgress(villaId: string, userId?: string) {
    try {
      // FIXED: Staff relation issue resolved - relations restored!
      console.log('🔧 Fixed version with restored relations called');
      // First check if villa exists
      const villa = await prisma.villa.findUnique({
        where: { id: villaId }
      });

      if (!villa) {
        throw new Error(`Villa with ID ${villaId} not found. Please create the villa first.`);
      }

      let progress = await prisma.onboardingProgress.findUnique({
        where: { villaId },
        include: {
          villa: {
            include: {
              owner: true,
              contractualDetails: true,
              bankDetails: true,
              otaCredentials: true,
              staff: { where: { isActive: true } }, // Re-enabled staff relation
              facilities: true,
              photos: { orderBy: { sortOrder: 'asc' } },
              documents: { where: { isActive: true } },
              onboardingSession: true,
              stepProgress: {
                include: {
                  fields: true
                }
              }
            },
          },
        },
      });

      if (!progress) {
        progress = await prisma.onboardingProgress.create({
          data: {
            villaId,
            currentStep: 1,
            totalSteps: this.TOTAL_STEPS,
            status: OnboardingStatus.IN_PROGRESS,
          },
          include: {
            villa: {
              include: {
                owner: true,
                contractualDetails: true,
                bankDetails: true,
                otaCredentials: true,
                staff: { where: { isActive: true } },
                facilities: true,
                photos: { orderBy: { sortOrder: 'asc' } },
                documents: { where: { isActive: true } },
                onboardingSession: true,
                stepProgress: {
                  include: {
                    fields: true
                  }
                }
              },
            },
          },
        });

        // Initialize OnboardingSession and StepProgress if user is provided
        if (userId) {
          await this.initializeEnhancedProgress(villaId, userId);
        }
      }

      // Auto-update progress flags based on data presence
      const progressVilla = progress.villa;
      const hasDocuments = progressVilla.documents && progressVilla.documents.length > 0;
      const hasPhotos = progressVilla.photos && progressVilla.photos.length > 0;
      
      const autoProgressUpdates: any = {};
      if (hasDocuments && !progress.documentsUploaded) {
        autoProgressUpdates.documentsUploaded = true;
        logger.info(`Auto-marking documents as completed for villa ${villaId}`);
      }
      if (hasPhotos && !progress.photosUploaded) {
        autoProgressUpdates.photosUploaded = true;
        logger.info(`Auto-marking photos as completed for villa ${villaId}`);
      }
      
      // Update progress if needed
      if (Object.keys(autoProgressUpdates).length > 0) {
        progress = await prisma.onboardingProgress.update({
          where: { villaId },
          data: autoProgressUpdates,
          include: {
            villa: {
              include: {
                owner: true,
                contractualDetails: true,
                bankDetails: true,
                otaCredentials: true,
                staff: { where: { isActive: true } },
                facilities: true,
                photos: { orderBy: { sortOrder: 'asc' } },
                documents: { where: { isActive: true } },
                onboardingSession: true,
                stepProgress: {
                  include: {
                    fields: true
                  }
                }
              },
            },
          },
        });
      }

      // Calculate completion percentage
      const completedStepsCount = this.countCompletedSteps(progress);
      const completedStepsArray = this.getCompletedStepsArray(progress);
      const completionPercentage = Math.round((completedStepsCount / this.TOTAL_STEPS) * 100);
      
      logger.info(`Villa ${villaId} progress calculation:`, {
        completedStepsCount,
        totalSteps: this.TOTAL_STEPS,
        completionPercentage,
        completedSteps: completedStepsArray,
        currentStep: progress.currentStep
      });

      // Get validation for current step
      const validation = await this.validateStep(villaId, progress.currentStep);

      // Transform stepProgress fields into fieldProgress object for compatibility
      const fieldProgress: Record<number, Record<string, any>> = {};
      if (progress.villa?.stepProgress) {
        progress.villa.stepProgress.forEach((step) => {
          if (step.fields && step.fields.length > 0) {
            const stepFields: Record<string, any> = {};
            step.fields.forEach((field) => {
              if (field.value !== null) {
                // Special handling for bedroom data - try to parse JSON
                if (field.fieldName === 'bedrooms' || field.fieldName === 'bedrooms_config') {
                  try {
                    if (typeof field.value === 'string') {
                      stepFields[field.fieldName] = JSON.parse(field.value);
                    } else {
                      stepFields[field.fieldName] = field.value;
                    }
                  } catch (e) {
                    stepFields[field.fieldName] = field.value;
                  }
                } else {
                  stepFields[field.fieldName] = field.value;
                }
              }
            });
            if (Object.keys(stepFields).length > 0) {
              fieldProgress[step.stepNumber] = stepFields;
            }
          }
        });
      }

      // Add fieldProgress to villa data for compatibility with data mapper
      const step9FieldProgress = fieldProgress[9] || {};
      logger.info(`🛏️ Backend: Step 9 field progress for villa ${villaId}:`, step9FieldProgress);
      logger.info(`🛏️ Backend: Full field progress structure:`, fieldProgress);
      
      // Special handling: if we have bedroom data in field progress, also add it directly to the villa
      if (step9FieldProgress.bedrooms || step9FieldProgress.bedrooms_config) {
        const bedroomData = step9FieldProgress.bedrooms || step9FieldProgress.bedrooms_config;
        logger.info(`🛏️ Backend: Found bedroom data in field progress, adding to villa:`, bedroomData);
      } else {
        logger.warn(`🛏️ Backend: No bedroom data found in step 9 field progress for villa ${villaId}`);
      }
      
      const enhancedVilla = progress.villa ? {
        ...progress.villa,
        fieldProgress: step9FieldProgress // Add step 9 field progress for photos/bedrooms
      } : undefined;

      return {
        ...progress,
        villa: enhancedVilla,
        completedStepsCount,
        completedSteps: completedStepsArray, // Array of completed step numbers
        completionPercentage,
        currentStepValidation: validation,
        stepDetails: this.getStepDetails(progress),
        fieldProgress, // Include all field progress for reference
      };
    } catch (error) {
      logger.error('Error getting onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Initialize enhanced progress tracking (OnboardingSession and StepFieldProgress)
   */
  async initializeEnhancedProgress(villaId: string, userId: string, userEmail?: string) {
    try {
      // Initialize the onboarding progress service for this villa
      await onboardingProgressService.initializeVillaProgress(villaId, userId, userEmail);
      logger.info(`Enhanced progress tracking initialized for villa ${villaId}`);
    } catch (error) {
      logger.error('Error initializing enhanced progress tracking:', error);
      // Don't throw here - the basic onboarding can still work without enhanced tracking
    }
  }

  /**
   * Update onboarding step
   */
  async updateStep(villaId: string, stepData: OnboardingStepData, userId?: string) {
    try {
      const { step, data, completed } = stepData;
      
      logger.info(`📝 updateStep called for villa ${villaId}, step ${step}`, {
        dataKeys: data ? Object.keys(data) : [],
        completed,
        userId
      });

      // Check if step is being skipped
      const isSkipped = data?.skipped === true;
      
      // Validate step data only if not skipped
      if (!isSkipped) {
        const validation = await this.validateStepData(villaId, step, data);
        if (!validation.isValid && completed) {
          throw new Error(`Step ${step} validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update the specific step data
      await this.saveStepData(villaId, step, data);

      // Update enhanced progress tracking
      if (userId) {
        await this.updateEnhancedProgress(villaId, step, data, completed, isSkipped, userId);
      }

      // Update progress using correct database field names
      const updateData: any = {};
      const stepCompletionField = this.STEP_COMPLETION_FIELDS[step as keyof typeof this.STEP_COMPLETION_FIELDS];
      
      if (!stepCompletionField) {
        throw new Error(`Invalid step number: ${step}. Must be between 1 and ${this.TOTAL_STEPS}.`);
      }
      
      logger.info(`Updating completion field '${stepCompletionField}' to ${completed} for villa ${villaId}, step ${step}`);
      updateData[stepCompletionField] = completed;

      // Auto-advance to next step if current step is completed
      if (completed) {
        updateData.currentStep = Math.min(step + 1, this.TOTAL_STEPS);
        logger.info(`Auto-advancing villa ${villaId} to step ${updateData.currentStep}`);
      }

      // Ensure OnboardingProgress exists before updating
      const existingProgress = await prisma.onboardingProgress.findUnique({
        where: { villaId }
      });

      if (!existingProgress) {
        throw new Error(`OnboardingProgress not found for villa ${villaId}. Please initialize onboarding first.`);
      }

      const progress = await prisma.onboardingProgress.update({
        where: { villaId },
        data: updateData,
        include: {
          villa: true,
        },
      });
      
      logger.info(`Successfully updated onboarding progress for villa ${villaId}:`, {
        stepCompletionField,
        completed,
        currentStep: progress.currentStep,
        completedStepsCount: this.countCompletedSteps(progress)
      });

      // Check if all steps are completed
      const completedStepsCount = this.countCompletedSteps(progress);
      logger.info(`Villa ${villaId} has ${completedStepsCount}/${this.TOTAL_STEPS} steps completed`);
      
if (completedStepsCount === this.TOTAL_STEPS) {
        logger.info(`All steps completed for villa ${villaId}, completing onboarding`);
        await this.completeOnboarding(villaId);
      }

      logger.info(`Onboarding step ${step} updated for villa ${villaId}`);
      return progress;
    } catch (error) {
      logger.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  /**
   * Update enhanced progress tracking for step and field level
   */
  private async updateEnhancedProgress(
    villaId: string, 
    stepNumber: number, 
    stepData: any, 
    completed: boolean, 
    isSkipped: boolean, 
    userId: string
  ) {
    try {
      // Update step progress
      const stepProgress = await prisma.onboardingStepProgress.findUnique({
        where: {
          villaId_stepNumber: {
            villaId,
            stepNumber
          }
        },
        include: {
          fields: true
        }
      });

      if (stepProgress) {
        // Update step status
        let stepStatus: StepStatus = 'IN_PROGRESS';
        if (isSkipped) {
          stepStatus = 'SKIPPED';
        } else if (completed) {
          stepStatus = 'COMPLETED';
        }

        await prisma.onboardingStepProgress.update({
          where: { id: stepProgress.id },
          data: {
            status: stepStatus,
            startedAt: stepProgress.startedAt || new Date(),
            completedAt: completed ? new Date() : null,
            skippedAt: isSkipped ? new Date() : null,
            isValid: completed || isSkipped,
            lastUpdatedAt: new Date()
          }
        });

        // Ensure fields exist for keys present in stepData (auto-create if missing)
        if (stepData && typeof stepData === 'object') {
          const existingFieldNames = new Set(stepProgress.fields.map(f => f.fieldName));
          for (const [key, value] of Object.entries(stepData)) {
            if (!existingFieldNames.has(key)) {
              try {
                await prisma.stepFieldProgress.create({
                  data: {
                    stepProgressId: stepProgress.id,
                    fieldName: key,
                    fieldLabel: key,
                    fieldType: typeof value === 'string' ? 'string' : Array.isArray(value) || typeof value === 'object' ? 'json' : typeof value,
                    status: (value !== undefined && value !== null && value !== '') ? 'IN_PROGRESS' : 'NOT_STARTED',
                    isSkipped: false,
                    isValid: value !== undefined && value !== null && value !== '',
                    value: value ?? null,
                    isRequired: false,
                    dependsOnFields: [],
                  }
                });
                existingFieldNames.add(key);
              } catch (e) {
                logger.warn('Failed to auto-create StepFieldProgress for field', { villaId, stepNumber, key, error: e });
              }
            }
          }

          // Update individual field progress for existing (and newly created) fields
          const refreshedStepProgress = await prisma.onboardingStepProgress.findUnique({
            where: { id: stepProgress.id },
            include: { fields: true }
          });

          if (refreshedStepProgress?.fields) {
            for (const field of refreshedStepProgress.fields) {
              const fieldValue = (stepData as any)[field.fieldName];
              const fieldHasValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
              
              let fieldStatus: FieldStatus = field.status;
              if (isSkipped) {
                fieldStatus = 'SKIPPED';
              } else if (fieldHasValue) {
                fieldStatus = 'COMPLETED';
              } else if (field.status === 'NOT_STARTED' && stepStatus === 'IN_PROGRESS') {
                fieldStatus = 'IN_PROGRESS';
              }

              await prisma.stepFieldProgress.update({
                where: { id: field.id },
                data: {
                  status: fieldStatus,
                  value: fieldHasValue ? fieldValue : field.value,
                  isSkipped: isSkipped,
                  isValid: fieldHasValue || isSkipped || !field.isRequired,
                  startedAt: field.startedAt || (fieldStatus === 'IN_PROGRESS' ? new Date() : null),
                  completedAt: fieldStatus === 'COMPLETED' ? new Date() : null,
                  skippedAt: fieldStatus === 'SKIPPED' ? new Date() : null,
                  lastModifiedAt: new Date()
                }
              });
            }
          }
        }

        // Update onboarding session counters
        await this.updateSessionCounters(villaId);
      }
    } catch (error) {
      logger.error('Error updating enhanced progress tracking:', error);
      // Don't throw - allow the main onboarding to continue
    }
  }

  /**
   * Update session counters
   */
  private async updateSessionCounters(villaId: string) {
    try {
      const steps = await prisma.onboardingStepProgress.findMany({
        where: { villaId },
        include: { fields: true }
      });

      const stepsCompleted = steps.filter(s => s.status === 'COMPLETED').length;
      const stepsSkipped = steps.filter(s => s.status === 'SKIPPED').length;
      const fieldsCompleted = steps.reduce((sum, step) => 
        sum + step.fields.filter(f => f.status === 'COMPLETED').length, 0);
      const fieldsSkipped = steps.reduce((sum, step) => 
        sum + step.fields.filter(f => f.isSkipped).length, 0);

      const currentStep = Math.max(1, stepsCompleted + stepsSkipped + 1);

      await prisma.onboardingSession.update({
        where: { villaId },
        data: {
          currentStep,
          stepsCompleted,
          stepsSkipped,
          fieldsCompleted,
          fieldsSkipped,
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error updating session counters:', error);
    }
  }

  /**
   * Save step-specific data
   */
  private async saveStepData(villaId: string, step: number, data: any) {
    logger.info(`Saving step ${step} data for villa ${villaId}:`, {
      stepName: this.STEP_NAMES[step as keyof typeof this.STEP_NAMES],
      dataKeys: Object.keys(data || {}),
      dataSize: JSON.stringify(data || {}).length,
      isSkipped: data?.skipped === true
    });
    
    // Add comprehensive logging for debugging field mapping issues
    if (data && Object.keys(data).length > 0) {
      logger.debug(`Step ${step} field mapping debug:`, {
        villaId,
        receivedFields: Object.keys(data),
        fieldValues: Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' && value.length > 50 ? 
            `${value.substring(0, 50)}...` : value;
          return acc;
        }, {} as any)
      });
    }
    
    // If step is skipped, just log it and return
    if (data?.skipped === true) {
      logger.info(`Step ${step} skipped for villa ${villaId}`);
      // Could also store skip information in a separate table if needed
      return;
    }
    
    if (!data || Object.keys(data).length === 0) {
      logger.warn(`No data provided for step ${step} of villa ${villaId}`);
      return;
    }
    
    try {
      switch (step) {
        case 1: // Villa Information
          logger.info(`Saving villa information for villa ${villaId}`, {
            villaName: data.villaName,
            location: data.location,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            maxGuests: data.maxGuests
          });
          
          // Handle coordinate parsing from googleCoordinates field
          let parsedLatitude = data.latitude;
          let parsedLongitude = data.longitude;
          
          if (data.googleCoordinates && typeof data.googleCoordinates === 'string') {
            const coords = data.googleCoordinates.split(',').map((coord: string) => coord.trim());
            if (coords.length === 2) {
              parsedLatitude = parseFloat(coords[0]);
              parsedLongitude = parseFloat(coords[1]);
            }
          }

          // Build update data, filtering out undefined values to prevent field reset
          const updateData: any = {};
          
          // Core villa fields - only set if provided
          if (data.villaName || data.name) updateData.villaName = data.villaName || data.name;
          if (data.location) updateData.location = data.location;
          if (data.address || data.villaAddress) updateData.address = data.address || data.villaAddress;
          if (data.city || data.villaCity) updateData.city = data.city || data.villaCity;
          if (data.country || data.villaCountry) updateData.country = data.country || data.villaCountry;
          if (data.zipCode || data.villaPostalCode) updateData.zipCode = data.zipCode || data.villaPostalCode;
          
          // Coordinate handling - only update if valid values provided
          if (parsedLatitude && !isNaN(parseFloat(parsedLatitude))) {
            updateData.latitude = parseFloat(parsedLatitude);
          }
          if (parsedLongitude && !isNaN(parseFloat(parsedLongitude))) {
            updateData.longitude = parseFloat(parsedLongitude);
          }
          
          // Numeric fields - only update if valid values provided
          if (data.bedrooms && !isNaN(parseInt(data.bedrooms))) {
            updateData.bedrooms = parseInt(data.bedrooms);
          }
          if (data.bathrooms && !isNaN(parseInt(data.bathrooms))) {
            updateData.bathrooms = parseInt(data.bathrooms);
          }
          if (data.maxGuests && !isNaN(parseInt(data.maxGuests))) {
            updateData.maxGuests = parseInt(data.maxGuests);
          }
          
          // Area fields - only update if valid values provided
          const propertySize = data.propertySize || data.villaArea;
          if (propertySize && !isNaN(parseFloat(propertySize))) {
            updateData.propertySize = parseFloat(propertySize);
          }
          
          const plotSize = data.plotSize || data.landArea;
          if (plotSize && !isNaN(parseFloat(plotSize))) {
            updateData.plotSize = parseFloat(plotSize);
          }
          
          // Property details - only update if provided
          if (data.yearBuilt && !isNaN(parseInt(data.yearBuilt))) {
            updateData.yearBuilt = parseInt(data.yearBuilt);
          }
          if (data.renovationYear && !isNaN(parseInt(data.renovationYear))) {
            updateData.renovationYear = parseInt(data.renovationYear);
          }
          if (data.propertyType) updateData.propertyType = data.propertyType;
          if (data.villaStyle || data.locationType) {
            updateData.villaStyle = data.villaStyle || data.locationType;
          }
          
          // Descriptions - only update if provided
          if (data.description !== undefined) updateData.description = data.description;
          if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
          
          // External links - only update if provided
          if (data.googleMapsLink !== undefined) updateData.googleMapsLink = data.googleMapsLink;
          if (data.oldRatesCardLink !== undefined) updateData.oldRatesCardLink = data.oldRatesCardLink;
          if (data.iCalCalendarLink !== undefined) updateData.iCalCalendarLink = data.iCalCalendarLink;

          await prisma.villa.update({
            where: { id: villaId },
            data: updateData,
          });
          
          logger.info(`Villa information saved successfully for villa ${villaId}`);
          break;

        case 2: // Owner Details
          logger.info(`Saving owner details for villa ${villaId}`, {
            dataKeys: Object.keys(data),
            firstName: data.firstName,
            lastName: data.lastName,
            ownerFullName: data.ownerFullName,
            email: data.email,
            ownerEmail: data.ownerEmail,
            phone: data.phone,
            ownerType: data.ownerType
          });
          
          // Handle name splitting from ownerFullName if firstName/lastName not provided
          let firstName = data.firstName;
          let lastName = data.lastName;
          
          if (!firstName && !lastName && data.ownerFullName) {
            const nameParts = data.ownerFullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Handle email field mapping
          const email = data.email || data.ownerEmail;
          const phone = data.phone || data.ownerPhone;
          
          // Validate required fields before saving (check DB schema for required fields)
          const requiredFields = {
            firstName,
            lastName,
            email,
            phone,
            address: data.address,
            city: data.city,
            country: data.country
          };
          
          const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
          
          if (missingFields.length > 0) {
            logger.warn(`Missing required owner fields for villa ${villaId}:`, {
              missingFields,
              providedData: {
                firstName,
                lastName,
                email,
                phone,
                address: data.address,
                city: data.city,
                country: data.country
              }
            });
            // Don't throw error, just log warning and skip saving
            logger.warn(`Skipping owner save for villa ${villaId} due to missing required fields: ${missingFields.join(', ')}`);
            return;
          }
          
          logger.info(`Attempting to upsert owner for villa ${villaId} with:`, {
            firstName,
            lastName,
            email,
            phone,
            address: data.address
          });
          
          await prisma.owner.upsert({
            where: { villaId },
            update: {
              firstName: firstName,
              lastName: lastName,
              email: email,
              phone: phone,
              alternativePhone: data.alternativePhone,
              nationality: data.nationality,
              passportNumber: data.passportNumber,
              idNumber: data.idNumber,
              address: data.address,
              city: data.city,
              country: data.country,
              zipCode: data.zipCode,
              preferredLanguage: data.preferredLanguage || 'en',
              communicationPreference: data.communicationPreference || 'EMAIL',
              notes: data.notes,
              alternativePhoneCountryCode: data.alternativePhoneCountryCode,
              alternativePhoneDialCode: data.alternativePhoneDialCode,
              phoneCountryCode: data.phoneCountryCode,
              phoneDialCode: data.phoneDialCode,
              companyAddress: data.companyAddress,
              companyName: data.companyName,
              companyTaxId: data.companyTaxId,
              companyVat: data.companyVat,
              managerEmail: data.managerEmail,
              managerName: data.managerName,
              managerPhone: data.managerPhone,
              managerPhoneCountryCode: data.managerPhoneCountryCode,
              managerPhoneDialCode: data.managerPhoneDialCode,
              ownerType: data.ownerType || 'INDIVIDUAL',
              propertyEmail: data.propertyEmail,
              propertyWebsite: data.propertyWebsite,
            },
            create: {
              villaId,
              firstName: firstName,
              lastName: lastName,
              email: email,
              phone: phone,
              alternativePhone: data.alternativePhone,
              nationality: data.nationality,
              passportNumber: data.passportNumber,
              idNumber: data.idNumber,
              address: data.address,
              city: data.city,
              country: data.country,
              zipCode: data.zipCode,
              preferredLanguage: data.preferredLanguage || 'en',
              communicationPreference: data.communicationPreference || 'EMAIL',
              notes: data.notes,
              alternativePhoneCountryCode: data.alternativePhoneCountryCode,
              alternativePhoneDialCode: data.alternativePhoneDialCode,
              phoneCountryCode: data.phoneCountryCode,
              phoneDialCode: data.phoneDialCode,
              companyAddress: data.companyAddress,
              companyName: data.companyName,
              companyTaxId: data.companyTaxId,
              companyVat: data.companyVat,
              managerEmail: data.managerEmail,
              managerName: data.managerName,
              managerPhone: data.managerPhone,
              managerPhoneCountryCode: data.managerPhoneCountryCode,
              managerPhoneDialCode: data.managerPhoneDialCode,
              ownerType: data.ownerType || 'INDIVIDUAL',
              propertyEmail: data.propertyEmail,
              propertyWebsite: data.propertyWebsite,
            },
          });
          
          logger.info(`Owner details saved successfully for villa ${villaId}`);
          break;

        case 3: // Contractual Details
          logger.info(`Saving contractual details for villa ${villaId}`, {
            contractType: data.contractType,
            commissionRate: data.commissionRate
          });
          
          await prisma.contractualDetails.upsert({
            where: { villaId },
            update: {
              contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : new Date(),
              contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
              contractType: data.contractType,
              commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : 0,
              managementFee: data.managementFee ? parseFloat(data.managementFee) : undefined,
              marketingFee: data.marketingFee ? parseFloat(data.marketingFee) : undefined,
              paymentTerms: data.paymentTerms,
              paymentSchedule: data.paymentSchedule || 'MONTHLY',
              minimumStayNights: data.minimumStayNights ? parseInt(data.minimumStayNights) : 1,
              cancellationPolicy: data.cancellationPolicy || 'MODERATE',
              checkInTime: data.checkInTime || '15:00',
              checkOutTime: data.checkOutTime || '11:00',
              insuranceProvider: data.insuranceProvider,
              insurancePolicyNumber: data.insurancePolicyNumber,
              insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
              specialTerms: data.specialTerms,
              payoutDay1: data.payoutDay1 ? parseInt(data.payoutDay1) : undefined,
              payoutDay2: data.payoutDay2 ? parseInt(data.payoutDay2) : undefined,
              dbdNumber: data.dbdNumber,
              paymentThroughIPL: data.paymentThroughIPL || false,
              vatPaymentTerms: data.vatPaymentTerms,
              vatRegistrationNumber: data.vatRegistrationNumber,
            },
            create: {
              villaId,
              contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : new Date(),
              contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
              contractType: data.contractType,
              commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : 0,
              managementFee: data.managementFee ? parseFloat(data.managementFee) : undefined,
              marketingFee: data.marketingFee ? parseFloat(data.marketingFee) : undefined,
              paymentTerms: data.paymentTerms,
              paymentSchedule: data.paymentSchedule || 'MONTHLY',
              minimumStayNights: data.minimumStayNights ? parseInt(data.minimumStayNights) : 1,
              cancellationPolicy: data.cancellationPolicy || 'MODERATE',
              checkInTime: data.checkInTime || '15:00',
              checkOutTime: data.checkOutTime || '11:00',
              insuranceProvider: data.insuranceProvider,
              insurancePolicyNumber: data.insurancePolicyNumber,
              insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
              specialTerms: data.specialTerms,
              payoutDay1: data.payoutDay1 ? parseInt(data.payoutDay1) : undefined,
              payoutDay2: data.payoutDay2 ? parseInt(data.payoutDay2) : undefined,
              dbdNumber: data.dbdNumber,
              paymentThroughIPL: data.paymentThroughIPL || false,
              vatPaymentTerms: data.vatPaymentTerms,
              vatRegistrationNumber: data.vatRegistrationNumber,
            },
          });
          
          logger.info(`Contractual details saved successfully for villa ${villaId}`);
          break;

        case 4: // Bank Details
          logger.info(`Saving bank details for villa ${villaId}`, {
            accountHolderName: data.accountHolderName,
            bankName: data.bankName
          });
          
          await prisma.bankDetails.upsert({
            where: { villaId },
            update: {
              accountHolderName: data.accountHolderName,
              bankName: data.bankName,
              accountNumber: data.accountNumber,
              iban: data.iban,
              swiftCode: data.swiftCode,
              branchName: data.branchName,
              branchCode: data.branchCode,
              branchAddress: data.branchAddress || data.bankAddress,
              bankAddress: data.bankAddress,
              bankCountry: data.bankCountry,
              currency: data.currency || 'USD',
              accountType: data.accountType,
              routingNumber: data.routingNumber,
              taxId: data.taxId,
              notes: data.notes,
              isVerified: data.isVerified || false,
            },
            create: {
              villaId,
              accountHolderName: data.accountHolderName,
              bankName: data.bankName,
              accountNumber: data.accountNumber,
              iban: data.iban,
              swiftCode: data.swiftCode,
              branchName: data.branchName,
              branchCode: data.branchCode,
              branchAddress: data.branchAddress || data.bankAddress,
              bankAddress: data.bankAddress,
              bankCountry: data.bankCountry,
              currency: data.currency || 'USD',
              accountType: data.accountType,
              routingNumber: data.routingNumber,
              taxId: data.taxId,
              notes: data.notes,
              isVerified: data.isVerified || false,
            },
          });
          
          logger.info(`Bank details saved successfully for villa ${villaId}`);
          break;

      case 5: // OTA Credentials
        // Handle multiple OTA platforms
        if (Array.isArray(data.platforms)) {
          logger.info(`Saving OTA credentials for villa ${villaId} - ${data.platforms.length} platforms`);
          for (const platform of data.platforms) {
            await prisma.oTACredentials.upsert({
              where: {
                villaId_platform: {
                  villaId,
                  platform: platform.platform,
                },
              },
              update: platform,
              create: {
                villaId,
                ...platform,
              },
            });
          }
          logger.info(`OTA credentials saved successfully for villa ${villaId}`);
        }
        break;

      case 6: // Documents Upload
        logger.info(`Documents upload step for villa ${villaId} - handled separately via SharePoint`);
        break;

      case 7: // Staff Configuration
        // 🕵️‍♂️ SHERLOCK INVESTIGATION - Staff Case (moved to case 7)
        logger.info(`🔍 CASE 7 INVESTIGATION: Step 7 (Staff Configuration) processing started`);
        logger.info(`🔍 Villa ID: ${villaId}`);
        logger.info(`🔍 Data object keys: ${data ? Object.keys(data).join(', ') : 'NO DATA'}`);
        logger.info(`🔍 Staff data present: ${!!data.staff}`);
        logger.info(`🔍 Staff data is array: ${Array.isArray(data.staff)}`);
        if (data.staff) {
          logger.info(`🔍 Staff array length: ${Array.isArray(data.staff) ? data.staff.length : 'NOT ARRAY'}`);
          logger.info(`🔍 Staff array content: ${JSON.stringify(data.staff, null, 2)}`);
        } else {
          logger.warn(`🔍 NO STAFF DATA FOUND! Data object: ${JSON.stringify(data, null, 2)}`);
        }
        
        // Handle multiple staff members
        if (Array.isArray(data.staff)) {
          logger.info(`🔍 PROCESSING: Saving staff configuration for villa ${villaId} - ${data.staff.length} staff members`);
          
          // Get current staff emails to track which to keep
          const newStaffEmails = data.staff
            .filter((s: any) => s.email)
            .map((s: any) => s.email.toLowerCase());
          logger.info(`🔍 New staff emails to keep: ${newStaffEmails.join(', ') || 'NONE'}`);
          
          // Deactivate existing staff not in the new list (by email)
          if (newStaffEmails.length > 0) {
            const deactivateResult = await prisma.staff.updateMany({
              where: {
                villaId,
                email: { notIn: newStaffEmails },
                isActive: true,
              },
              data: { isActive: false },
            });
            logger.info(`🔍 Deactivated ${deactivateResult.count} existing staff members`);
          }

          // Upsert staff members
          for (let i = 0; i < data.staff.length; i++) {
            const staffMember = data.staff[i];
            logger.info(`🔍 Processing staff member ${i + 1}:`, JSON.stringify(staffMember, null, 2));
            
            // Check if staff already exists by email, then by name if email fails
            let existingStaff = null;
            
            // First try email search
            if (staffMember.email) {
              const searchEmail = staffMember.email.toLowerCase();
              logger.info(`🔍 SEARCHING for existing staff with email: ${searchEmail}`);
              existingStaff = await prisma.staff.findFirst({
                where: {
                  villaId,
                  email: searchEmail,
                },
              });
              logger.info(`🔍 EMAIL SEARCH RESULT: ${existingStaff ? 'Found existing staff with ID: ' + existingStaff.id : 'No staff found by email'}`);
            }
            
            // If email search fails, try name-based search
            if (!existingStaff && staffMember.firstName && staffMember.lastName) {
              logger.info(`🔍 FALLBACK: Searching by name: ${staffMember.firstName} ${staffMember.lastName}`);
              existingStaff = await prisma.staff.findFirst({
                where: {
                  villaId,
                  firstName: staffMember.firstName,
                  lastName: staffMember.lastName,
                  isActive: true,
                },
              });
              logger.info(`🔍 NAME SEARCH RESULT: ${existingStaff ? 'Found existing staff with ID: ' + existingStaff.id : 'No staff found by name'}`);
            }
            
            if (existingStaff) {
              logger.info(`🔍 UPDATING existing staff with email: ${staffMember.email}`);
              // Add default department and employmentType based on position for updates too
              const staffDefaults = this.mapStaffDefaults(staffMember.position);
              const updateData = {
                ...staffMember,
                email: staffMember.email?.toLowerCase(),
                department: staffMember.department || staffDefaults.department,
                employmentType: staffMember.employmentType || staffDefaults.employmentType,
                isActive: true, // Reactivate if was deactivated
              };
              const updateResult = await prisma.staff.update({
                where: { id: existingStaff.id },
                data: updateData,
              });
              logger.info(`🔍 UPDATE SUCCESS:`, updateResult.id);
            } else {
              logger.info(`🔍 CREATING new staff member`);
              // Add default department and employmentType based on position
              const staffDefaults = this.mapStaffDefaults(staffMember.position);
              logger.info(`🔍 Staff defaults for position ${staffMember.position}:`, staffDefaults);
              
              const createData = {
                villaId,
                ...staffMember,
                email: staffMember.email?.toLowerCase(),
                department: staffMember.department || staffDefaults.department,
                employmentType: staffMember.employmentType || staffDefaults.employmentType,
              };
              logger.info(`🔍 CREATE DATA:`, JSON.stringify(createData, null, 2));
              
              try {
                const createResult = await prisma.staff.create({
                  data: createData,
                });
                logger.info(`🔍 CREATE SUCCESS:`, createResult.id);
              } catch (createError) {
                logger.error(`🔍 CREATE FAILED:`, createError);
                throw createError;
              }
            }
          }
          logger.info(`🔍 CASE CLOSED: Staff configuration saved successfully for villa ${villaId}`);
        } else {
          logger.warn(`🔍 CASE FAILED: No staff array found or not an array. Data.staff type: ${typeof data.staff}`);
        }
        break;

      case 8: // Facilities
        // Handle facility checklist (moved from case 7 to case 8)
        logger.info(`🏗️ Step 8 data received for villa ${villaId}:`, JSON.stringify(data, null, 2));
        
        if (Array.isArray(data.facilities)) {
          logger.info(`Saving facilities checklist for villa ${villaId} - ${data.facilities.length} facilities`);
          logger.info(`🏗️ Facilities data structure:`, JSON.stringify(data.facilities, null, 2));
          
          for (const facility of data.facilities) {
            logger.info(`🏗️ Processing facility:`, JSON.stringify(facility, null, 2));
            
            const isAvailable = Boolean(facility.isAvailable || facility.available);
            const category = facility.category;
            const subcategory = facility.subcategory || '';
            const itemName = facility.itemName;

            // If not available, delete any existing record to prevent stale entries
            if (!isAvailable) {
              await prisma.facilityChecklist.deleteMany({
                where: {
                  villaId,
                  category,
                  subcategory,
                  itemName,
                },
              });
              continue;
            }

            const facilityData = {
              villaId,
              category,
              subcategory,
              itemName,
              isAvailable,
              quantity: facility.quantity || null,
              condition: facility.condition || 'good',
              notes: facility.notes || '',
              specifications: facility.specifications || '',
              photoUrl: facility.photoUrl || '',
              productLink: facility.productLink || '',
              checkedBy: facility.checkedBy || null,
              lastCheckedAt: facility.lastCheckedAt || null,
            };
            
            logger.info(`🏗️ Saving facility data:`, JSON.stringify(facilityData, null, 2));
            
            await prisma.facilityChecklist.upsert({
              where: {
                villaId_category_subcategory_itemName: {
                  villaId,
                  category,
                  subcategory,
                  itemName,
                },
              },
              update: facilityData,
              create: facilityData,
            });
          }
          logger.info(`✅ Facilities checklist saved successfully for villa ${villaId}`);
        } else {
          logger.warn(`🚨 No facilities data found or not an array for villa ${villaId}:`, data);
        }
        break;

      case 9: // Photos Upload
        logger.info(`Photos upload handling for villa ${villaId} - handled separately via upload endpoints`);
        
        // Save bedroom configuration data if provided
        if (data.bedrooms && Array.isArray(data.bedrooms)) {
          logger.info(`Saving bedroom configuration for villa ${villaId}:`, data.bedrooms);
          
          // Store bedroom data in the field progress for step 9 with enhanced persistence
          await this.saveFieldProgress(villaId, step, 'bedrooms', JSON.stringify(data.bedrooms), 'system');
          
          // Also save as a separate dedicated field for reliability
          await this.saveFieldProgress(villaId, step, 'bedrooms_config', JSON.stringify(data.bedrooms), 'system');
          
          logger.info(`✅ Bedroom configuration persisted to field progress for villa ${villaId}`);
        }
        break;

      case 10: // Review - no specific data to save
        logger.info(`Review step completed for villa ${villaId}`);
        break;
          
        default:
          logger.warn(`Unknown step ${step} for villa ${villaId}`);
          break;
      }
      
      logger.info(`Step ${step} data saved successfully for villa ${villaId}`);
    } catch (error) {
      logger.error(`Error saving step ${step} data for villa ${villaId}:`, error);
      throw error;
    }
  }

  /**
   * Validate step data
   */
  private async validateStepData(villaId: string, step: number, data: any): Promise<OnboardingValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (step) {
      case 1: // Villa Information
        if (!data.villaName) errors.push('Villa name is required');
        if (!data.location) errors.push('Location is required');
        if (!data.address) errors.push('Address is required');
        if (!data.bedrooms || data.bedrooms < 1) errors.push('Number of bedrooms must be at least 1');
        if (!data.bathrooms || data.bathrooms < 1) errors.push('Number of bathrooms must be at least 1');
        if (!data.maxGuests || data.maxGuests < 1) errors.push('Maximum guests must be at least 1');
        if (!data.propertyType) errors.push('Property type is required');
        
        if (!data.description) warnings.push('Description is recommended for better listing visibility');
        if (!data.latitude || !data.longitude) warnings.push('GPS coordinates help with map display');
        break;

      case 2: // Owner Details
        if (!data.firstName) errors.push('First name is required');
        if (!data.lastName) errors.push('Last name is required');
        if (!data.email) errors.push('Email is required');
        if (!data.phone) errors.push('Phone number is required');
        if (!data.address) errors.push('Owner address is required');
        
        if (!data.passportNumber && !data.idNumber) warnings.push('ID document recommended for verification');
        break;

      case 3: // Contractual Details
        if (!data.contractStartDate) errors.push('Contract start date is required');
        if (!data.contractType) errors.push('Contract type is required');
        if (data.commissionRate === undefined || data.commissionRate < 0) errors.push('Commission rate is required');
        
        if (!data.insuranceProvider) warnings.push('Insurance information recommended');
        if (!data.cancellationPolicy) warnings.push('Cancellation policy should be defined');
        break;

      case 4: // Bank Details
        if (!data.accountHolderName) errors.push('Account holder name is required');
        if (!data.bankName) errors.push('Bank name is required');
        if (!data.accountNumber && !data.iban) errors.push('Account number or IBAN is required');
        
        if (!data.swiftCode) warnings.push('SWIFT code recommended for international transfers');
        break;

      case 5: // OTA Credentials
        // Optional step, but validate if provided
        if (data.platforms && Array.isArray(data.platforms)) {
          data.platforms.forEach((platform: any, index: number) => {
            if (!platform.platform) errors.push(`Platform ${index + 1}: Platform name is required`);
            if (!platform.propertyId && !platform.apiKey) {
              warnings.push(`Platform ${index + 1}: Property ID or API key recommended for integration`);
            }
          });
        }
        break;

      case 6: // Documents
        const requiredDocs = ['PROPERTY_CONTRACT', 'INSURANCE_CERTIFICATE'];
        const documents = await prisma.document.findMany({
          where: { villaId, isActive: true },
          select: { documentType: true },
        });
        
        const docTypes = new Set(documents.map(d => d.documentType));
        requiredDocs.forEach(docType => {
          if (!docTypes.has(docType as any)) {
            errors.push(`Document type ${docType} is required`);
          }
        });
        break;

      case 7: // Staff Configuration
        if (!data.staff || !Array.isArray(data.staff) || data.staff.length === 0) {
          warnings.push('At least one staff member recommended');
        } else {
          data.staff.forEach((staff: any, index: number) => {
            if (!staff.firstName) errors.push(`Staff ${index + 1}: First name is required`);
            if (!staff.lastName) errors.push(`Staff ${index + 1}: Last name is required`);
            if (!staff.position) errors.push(`Staff ${index + 1}: Position is required`);
            if (!staff.phone) errors.push(`Staff ${index + 1}: Phone number is required`);
          });
        }
        break;

      case 8: // Facilities
        // Check for minimum required facilities
        const requiredCategories = ['KITCHEN_EQUIPMENT', 'BATHROOM_AMENITIES', 'SAFETY_SECURITY'];
        if (data.facilities && Array.isArray(data.facilities)) {
          const categories = new Set(data.facilities.map((f: any) => f.category));
          requiredCategories.forEach(cat => {
            if (!categories.has(cat)) {
              warnings.push(`Facilities in category ${cat} are recommended`);
            }
          });
        }
        break;

      case 9: // Photos
        const photos = await prisma.photo.count({ where: { villaId } });
        if (photos < 10) warnings.push('At least 10 photos recommended for better listing');
        
        const mainPhoto = await prisma.photo.findFirst({ where: { villaId, isMain: true } });
        if (!mainPhoto) errors.push('Main photo is required');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a specific step
   */
  async validateStep(villaId: string, step: number): Promise<OnboardingValidation> {
    const villa = await prisma.villa.findUnique({
      where: { id: villaId },
      include: {
        owner: true,
        contractualDetails: true,
        bankDetails: true,
        otaCredentials: true,
        staff: { where: { isActive: true } },
        facilities: true,
        photos: true,
        documents: { where: { isActive: true } },
      },
    });

    if (!villa) {
      return {
        isValid: false,
        errors: ['Villa not found'],
        warnings: [],
      };
    }

    // Map villa data to step data format and validate
    let stepData: any = {};
    
    switch (step) {
      case 1:
        stepData = villa;
        break;
      case 2:
        stepData = villa.owner || {};
        break;
      case 3:
        stepData = villa.contractualDetails || {};
        break;
      case 4:
        stepData = villa.bankDetails || {};
        break;
      case 5:
        stepData = { platforms: villa.otaCredentials };
        break;
      case 6:
        stepData = { documents: villa.documents };
        break;
      case 7:
        stepData = { staff: villa.staff };
        break;
      case 8:
        stepData = { facilities: villa.facilities };
        break;
      case 9:
        stepData = { photos: villa.photos };
        break;
    }

    return this.validateStepData(villaId, step, stepData);
  }

  /**
   * Submit onboarding for review
   */
async submitForReview(_villaId: string) {
    throw new Error('Admin approval system has been removed');
  }

  /**
   * Approve onboarding
   */
async approveOnboarding(_villaId: string, _approvedBy: string, _notes?: string) {
    throw new Error('Admin approval system has been removed');
  }

  /**
   * Reject onboarding
   */
async rejectOnboarding(_villaId: string, _rejectedBy: string, _reason: string) {
    throw new Error('Admin approval system has been removed');
  }

  /**
   * Complete onboarding (mark as fully complete and activate villa)
   */
  async completeOnboarding(villaId: string) {
    try {
      // Ensure OnboardingProgress exists before updating
      const existingProgress = await prisma.onboardingProgress.findUnique({
        where: { villaId }
      });

      if (!existingProgress) {
        throw new Error(`OnboardingProgress not found for villa ${villaId}. Cannot complete non-existent onboarding.`);
      }

      // Update onboarding status to COMPLETED
      const progress = await prisma.onboardingProgress.update({
        where: { villaId },
        data: {
          status: OnboardingStatus.COMPLETED,
        },
        include: {
          villa: {
            include: {
              owner: true,
            },
          },
        },
      });

      // Update villa status to ACTIVE
      await prisma.villa.update({
        where: { id: villaId },
        data: {
          status: VillaStatus.ACTIVE,
        },
      });

      // Get villa data for notifications
      const villaWithOwner = await prisma.villa.findUnique({
        where: { id: villaId },
        include: { owner: true },
      });

// Notifications removed for production launch

      logger.info(`Villa ${villaId} onboarding completed successfully`);
      return progress;
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Count completed steps with detailed logging
   */
  private countCompletedSteps(progress: any): number {
    const stepFlags = {
      villaInfoCompleted: progress.villaInfoCompleted || false,
      ownerDetailsCompleted: progress.ownerDetailsCompleted || false,
      contractualDetailsCompleted: progress.contractualDetailsCompleted || false,
      bankDetailsCompleted: progress.bankDetailsCompleted || false,
      otaCredentialsCompleted: progress.otaCredentialsCompleted || false,
      staffConfigCompleted: progress.staffConfigCompleted || false,
      facilitiesCompleted: progress.facilitiesCompleted || false,
      photosUploaded: progress.photosUploaded || false,
      documentsUploaded: progress.documentsUploaded || false,
      reviewCompleted: progress.reviewCompleted || false,
    };
    
    const completedFlags = Object.entries(stepFlags).filter(([_, completed]) => completed);
    const count = completedFlags.length;
    
    logger.debug(`Completed steps count for villa ${progress.villaId || 'unknown'}:`, {
      count,
      totalSteps: this.TOTAL_STEPS,
      completedFlags: completedFlags.map(([flag, _]) => flag),
      allFlags: stepFlags
    });
    
    return count;
  }

  /**
   * Auto-save field progress (for real-time saving)
   */
  async saveFieldProgress(
    villaId: string, 
    stepNumber: number, 
    fieldName: string, 
    value: any, 
    userId: string
  ) {
    try {
      // Find step progress
      const stepProgress = await prisma.onboardingStepProgress.findUnique({
        where: {
          villaId_stepNumber: {
            villaId,
            stepNumber
          }
        }
      });

      if (!stepProgress) {
        // Initialize progress if not exists
        await this.initializeEnhancedProgress(villaId, userId);
        return;
      }

      // Update field progress with upsert to handle missing records
      const hasValue = value !== undefined && value !== null && value !== '';
      
      logger.debug(`Saving field progress for villa ${villaId}, step ${stepNumber}, field ${fieldName}:`, {
        value: hasValue ? 'has value' : 'empty',
        valueType: typeof value
      });
      
      // Use upsert to create field record if it doesn't exist
      await prisma.stepFieldProgress.upsert({
        where: {
          stepProgressId_fieldName: {
            stepProgressId: stepProgress.id,
            fieldName
          }
        },
        create: {
          stepProgressId: stepProgress.id,
          fieldName,
          fieldType: 'TEXT', // Default field type
          value,
          status: hasValue ? 'COMPLETED' : 'IN_PROGRESS',
          isValid: hasValue,
          startedAt: new Date(),
          lastModifiedAt: new Date(),
          completedAt: hasValue ? new Date() : undefined
        },
        update: {
          value,
          status: hasValue ? 'COMPLETED' : 'IN_PROGRESS',
          isValid: hasValue,
          lastModifiedAt: new Date(),
          completedAt: hasValue ? new Date() : undefined
        }
      });
      
      logger.debug(`Field progress updated successfully for villa ${villaId}, step ${stepNumber}, field ${fieldName}`);

      // Update session activity
      await prisma.onboardingSession.update({
        where: { villaId },
        data: {
          lastActivityAt: new Date()
        }
      });

      // Update session counters
      await this.updateSessionCounters(villaId);

      logger.debug(`Field ${fieldName} auto-saved for villa ${villaId}, step ${stepNumber}`);
    } catch (error) {
      logger.error(`Error saving field progress for villa ${villaId}, step ${stepNumber}, field ${fieldName}:`, error);
      // Don't throw - this is auto-save, should fail silently
    }
  }

  /**
   * Get field progress for auto-save restoration
   */
  async getFieldProgress(villaId: string, stepNumber: number) {
    try {
      const stepProgress = await prisma.onboardingStepProgress.findUnique({
        where: {
          villaId_stepNumber: {
            villaId,
            stepNumber
          }
        },
        include: {
          fields: true
        }
      });

      if (!stepProgress) {
        return {};
      }

      // Convert field progress to key-value pairs for frontend consumption
      const fieldData: Record<string, any> = {};
      for (const field of stepProgress.fields) {
        if (field.value !== null) {
          fieldData[field.fieldName] = field.value;
        }
      }

      return fieldData;
    } catch (error) {
      logger.error('Error getting field progress:', error);
      return {};
    }
  }

  private getCompletedStepsArray(progress: any): number[] {
    const completedSteps: number[] = [];
    const stepToFieldMapping = [
      { step: 1, field: 'villaInfoCompleted' },
      { step: 2, field: 'ownerDetailsCompleted' },
      { step: 3, field: 'contractualDetailsCompleted' },
      { step: 4, field: 'bankDetailsCompleted' },
      { step: 5, field: 'otaCredentialsCompleted' },
      { step: 6, field: 'documentsUploaded' },
      { step: 7, field: 'staffConfigCompleted' },
      { step: 8, field: 'facilitiesCompleted' },
      { step: 9, field: 'photosUploaded' },
      { step: 10, field: 'reviewCompleted' }
    ];
    
    stepToFieldMapping.forEach(({ step, field }) => {
      if (progress[field]) {
        completedSteps.push(step);
      }
    });
    
    logger.debug(`Completed steps array for villa ${progress.villaId || 'unknown'}:`, {
      completedSteps,
      stepFlags: stepToFieldMapping.map(({ step, field }) => ({ step, field, value: progress[field] || false }))
    });
    
    return completedSteps;
  }

  /**
   * Get detailed step information
   */
  private getStepDetails(progress: any) {
    return [
      {
        step: 1,
        name: 'Villa Information',
        completed: progress.villaInfoCompleted,
        required: true,
      },
      {
        step: 2,
        name: 'Owner Details',
        completed: progress.ownerDetailsCompleted,
        required: true,
      },
      {
        step: 3,
        name: 'Contractual Details',
        completed: progress.contractualDetailsCompleted,
        required: true,
      },
      {
        step: 4,
        name: 'Bank Details',
        completed: progress.bankDetailsCompleted,
        required: true,
      },
      {
        step: 5,
        name: 'OTA Credentials',
        completed: progress.otaCredentialsCompleted,
        required: false,
      },
      {
        step: 6,
        name: 'Documents Upload',
        completed: progress.documentsUploaded,
        required: true,
      },
      {
        step: 7,
        name: 'Staff Configuration',
        completed: progress.staffConfigCompleted,
        required: false,
      },
      {
        step: 8,
        name: 'Facilities Checklist',
        completed: progress.facilitiesCompleted,
        required: true,
      },
      {
        step: 9,
        name: 'Photo Upload',
        completed: progress.photosUploaded,
        required: true,
      },
      {
        step: 10,
        name: 'Review & Submit',
        completed: progress.reviewCompleted,
        required: true,
      },
    ];
  }

  /**
   * Get pending approvals for admin dashboard
   */
  async getPendingApprovals(filters?: any, pagination?: any) {
    try {
      const where: any = {
        status: {
          in: [OnboardingStatus.PENDING_REVIEW, OnboardingStatus.IN_PROGRESS],
        },
      };

      // Add filters
      if (filters?.status && filters.status !== 'all') {
        where.status = filters.status;
      }

      if (filters?.location) {
        where.villa = {
          ...where.villa,
          location: {
            contains: filters.location,
            mode: 'insensitive',
          },
        };
      }

      if (filters?.search) {
        where.villa = {
          ...where.villa,
          OR: [
            { villaName: { contains: filters.search, mode: 'insensitive' } },
            { villaCode: { contains: filters.search, mode: 'insensitive' } },
            { owner: { firstName: { contains: filters.search, mode: 'insensitive' } } },
            { owner: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          ],
        };
      }

      // Calculate pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 5;
      const skip = (page - 1) * limit;

      // Get the data
      const [approvals, total] = await Promise.all([
        prisma.onboardingProgress.findMany({
          where,
          include: {
            villa: {
              include: {
                owner: true,
                photos: { 
                  where: { isMain: true },
                  take: 1 
                },
                documents: { 
                  where: { isActive: true } 
                },
                staff: { 
                  where: { isActive: true } 
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.onboardingProgress.count({ where }),
      ]);

      // Transform data to match frontend interface with enhanced data accuracy
      const transformedApprovals = approvals.map((approval) => {
        const completedSteps = this.countCompletedSteps(approval);
        const progressPercentage = Math.round((completedSteps / this.TOTAL_STEPS) * 100);
        
        // Ensure we have villa data
        if (!approval.villa) {
          logger.warn(`Missing villa data for approval ${approval.id}`);
          return null;
        }
        
        return {
          id: approval.villaId, // Use villaId as the approval ID
          villaId: approval.villaId, // Explicit villa ID
          villaName: approval.villa.villaName || 'Unnamed Villa',
          villaCode: approval.villa.villaCode || 'NO-CODE',
          ownerName: approval.villa.owner
            ? `${approval.villa.owner.firstName || ''} ${approval.villa.owner.lastName || ''}`.trim() || 'Unknown'
            : 'No Owner',
          ownerEmail: approval.villa.owner?.email || 'No email provided',
          currentStep: approval.currentStep || 1,
          totalSteps: approval.totalSteps || this.TOTAL_STEPS,
          stepsCompleted: completedSteps,
          progress: progressPercentage,
          progressStatus: this.getProgressStatus(progressPercentage),
          status: approval.status,
          submittedAt: approval.submittedAt || approval.updatedAt,
          lastUpdatedAt: approval.updatedAt,
          documentsCount: approval.villa.documents?.length || 0,
          photosCount: approval.villa.photos?.length || 0,
          staffCount: approval.villa.staff?.length || 0,
          location: approval.villa.location || `${approval.villa.city || 'Unknown'}, ${approval.villa.country || 'Unknown'}`,
          city: approval.villa.city || 'Unknown',
          country: approval.villa.country || 'Unknown',
          bedrooms: approval.villa.bedrooms || 0,
          bathrooms: approval.villa.bathrooms || 0,
          maxGuests: approval.villa.maxGuests || 0,
          
          // Data completeness indicators
          hasOwnerDetails: !!approval.villa.owner,
          hasDocuments: (approval.villa.documents?.length || 0) > 0,
          hasPhotos: (approval.villa.photos?.length || 0) > 0,
          hasStaff: (approval.villa.staff?.length || 0) > 0,
          
          // Validation status
          isReadyForReview: progressPercentage >= 90 && approval.status === 'PENDING_REVIEW',
          requiresAttention: progressPercentage < 70 && approval.status === 'PENDING_REVIEW',
          
          // Time tracking
          daysSinceSubmission: approval.submittedAt 
            ? Math.floor((Date.now() - new Date(approval.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
            : Math.floor((Date.now() - new Date(approval.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
        };
      }).filter(Boolean); // Remove any null entries

      return {
        approvals: transformedApprovals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting pending approvals:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics for admin dashboard
   */
  async getApprovalStats() {
    try {
      const [
        pendingReview,
        inProgress,
        approved,
        rejected,
        totalApplications,
        averageProgress
      ] = await Promise.all([
        prisma.onboardingProgress.count({
          where: { status: OnboardingStatus.PENDING_REVIEW },
        }),
        prisma.onboardingProgress.count({
          where: { status: OnboardingStatus.IN_PROGRESS },
        }),
        prisma.onboardingProgress.count({
          where: { status: OnboardingStatus.APPROVED },
        }),
        prisma.onboardingProgress.count({
          where: { status: OnboardingStatus.REJECTED },
        }),
        prisma.onboardingProgress.count(),
        prisma.onboardingProgress.findMany({
          select: {
            villaInfoCompleted: true,
            ownerDetailsCompleted: true,
            contractualDetailsCompleted: true,
            bankDetailsCompleted: true,
            otaCredentialsCompleted: true,
            staffConfigCompleted: true,
            facilitiesCompleted: true,
            photosUploaded: true,
            documentsUploaded: true,
            reviewCompleted: true,
          },
        }),
      ]);

      // Calculate average progress
      const avgProgress = averageProgress.reduce((sum, progress) => {
        return sum + this.countCompletedSteps(progress);
      }, 0) / (averageProgress.length || 1);

      return {
        pendingReview,
        inProgress,
        approved,
        rejected,
        totalApplications,
        averageProgress: Math.round((avgProgress / this.TOTAL_STEPS) * 100),
      };
    } catch (error) {
      logger.error('Error getting approval stats:', error);
      throw error;
    }
  }
}

export default new OnboardingService();