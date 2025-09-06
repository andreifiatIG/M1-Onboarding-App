'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { ClientApiClient } from '@/lib/api-client';
import { mapOnboardingDataToBackend, mapOnboardingDataFromBackend } from '@/lib/data-mapper';
import ProgressTracker from './ProgressTracker';
import { ProgressIndicator } from './ProgressIndicator';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { StepHandle } from './steps/types';
import ErrorBoundary, { WizardErrorBoundary, StepErrorBoundary } from './ErrorBoundary';
import OnboardingBackupService, { BackupData } from './OnboardingBackupService';
import RecoveryModal from './RecoveryModal';
import ValidationProvider from './ValidationProvider';
import ValidationSummary from './ValidationSummary';

// Direct imports to avoid chunk loading issues
import VillaInformationStepEnhanced from './steps/VillaInformationStepEnhanced';
import OwnerDetailsStep from './steps/OwnerDetailsStep';
import ContractualDetailsStep from './steps/ContractualDetailsStep';
import BankDetailsStep from './steps/BankDetailsStep';
import OTACredentialsStep from './steps/OTACredentialsStep';
import DocumentsUploadStep from './steps/DocumentsUploadStep';
import StaffConfiguratorStep from './steps/StaffConfiguratorStep';
import FacilitiesChecklistStep from './steps/FacilitiesChecklistStep';
import PhotoUploadStep from './steps/PhotoUploadStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';

const OnboardingWizardContent: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [localStepData, setLocalStepData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [autoSaveEnabled] = useState(true);
  const [lastSavedData, setLastSavedData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Backup and recovery state
  const [backupService] = useState(() => OnboardingBackupService.getInstance());
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<BackupData | null>(null);
  
  const stepRefs = useRef<(StepHandle | null)[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Record<string, any>>({});
  
  const totalSteps = 10;

  const userId = user?.id; // Don't use test user to avoid double initialization

  // State for onboarding progress
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null);
  const [villaId, setVillaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load field-level progress from database with spacing to avoid rate limits
  const loadFieldProgress = useCallback(async (villaId: string, authenticatedApi: ClientApiClient, existingData?: Record<string, any>) => {
    try {
      // Load only the critical steps to avoid rate limits (8: Facilities, 9: Photos/Bedrooms)
      const stepsToFetch = [8, 9];
      
      // Space out the requests to avoid rate limit burst
      const fieldProgressResults = [];
      for (const step of stepsToFetch) {
        try {
          const result = await authenticatedApi.getFieldProgress(villaId, step);
          fieldProgressResults.push(result);
          // Add small delay between requests to prevent rate limit burst
          if (step !== stepsToFetch[stepsToFetch.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          }
        } catch (err) {
          console.warn(`Failed to load field progress for step ${step}:`, err);
          fieldProgressResults.push({});
        }
      }
      console.log('🛏️ Field progress results (steps 8 & 9 only):', fieldProgressResults);
      
      // Merge field progress into step data ONLY if it has meaningful data
      const enhancedStepData: Record<string, any> = {};
      fieldProgressResults.forEach((fieldProgress, index) => {
        const stepNumber = index + 1;
        if (fieldProgress && typeof fieldProgress === 'object' && 'success' in fieldProgress && 
            fieldProgress.success && fieldProgress.data && Object.keys(fieldProgress.data).length > 0) {
          // Get existing step data (from parameter if provided, otherwise from state)
          const existingStepData = existingData ? existingData[`step${stepNumber}`] : localStepData[`step${stepNumber}`] || {};
          
          // Only merge if field progress has non-empty values
          const validFieldProgress: Record<string, any> = {};
          for (const [key, value] of Object.entries(fieldProgress.data)) {
            if (value !== null && value !== undefined && value !== '') {
              validFieldProgress[key] = value;
            }
          }
          
          // Only update if we have valid field progress data
          if (Object.keys(validFieldProgress).length > 0) {
            // Special handling for bedrooms data in step 9 (parse JSON)
            if (stepNumber === 9 && validFieldProgress.bedrooms) {
              console.log('🛏️ Found bedrooms in field progress (raw):', validFieldProgress.bedrooms);
              try {
                validFieldProgress.bedrooms = JSON.parse(validFieldProgress.bedrooms);
                console.log('🛏️ Successfully parsed bedrooms JSON:', validFieldProgress.bedrooms);
              } catch (e) {
                console.warn('Failed to parse bedrooms JSON:', e);
                delete validFieldProgress.bedrooms;
              }
            }
            
            enhancedStepData[`step${stepNumber}`] = {
              ...existingStepData,
              ...validFieldProgress
            };
          }
        }
      });
      
      // Update local step data with database field progress only if we have meaningful data
      if (Object.keys(enhancedStepData).length > 0) {
        if (existingData) {
          // Return the merged data if existingData was provided
          return {
            ...existingData,
            ...enhancedStepData
          };
        } else {
          // Update state if no existingData provided (original behavior)
          setLocalStepData(prev => ({
            ...prev,
            ...enhancedStepData
          }));
          setLastSavedData(prev => ({
            ...prev,
            ...enhancedStepData
          }));
          console.log('Loaded meaningful field progress from database');
        }
      }
      
      // Return existingData if provided and no enhancements found
      if (existingData) {
        return existingData;
      }
    } catch (error) {
      console.warn('Could not load field progress:', error);
      // Return existingData if provided and error occurred
      if (existingData) {
        return existingData;
      }
      // Don't throw - this is enhancement, not critical
    }
  }, [localStepData, totalSteps]);
  
  // Ensure completedSteps is always an array
  const completedSteps = useMemo(() => {
    if (!onboardingProgress) return [];
    
    // If completedSteps is already an array, use it
    if (Array.isArray(onboardingProgress.completedSteps)) {
      return onboardingProgress.completedSteps;
    }
    
    // Build from individual step flags - CORRECTED ORDER
    const steps = [];
    if (onboardingProgress.villaInfoCompleted) steps.push(1);
    if (onboardingProgress.ownerDetailsCompleted) steps.push(2);
    if (onboardingProgress.contractualDetailsCompleted) steps.push(3);
    if (onboardingProgress.bankDetailsCompleted) steps.push(4);
    if (onboardingProgress.otaCredentialsCompleted) steps.push(5);
    if (onboardingProgress.documentsUploaded) steps.push(6);
    if (onboardingProgress.staffConfigCompleted) steps.push(7);
    if (onboardingProgress.facilitiesCompleted) steps.push(8);
    if (onboardingProgress.photosUploaded) steps.push(9);
    if (onboardingProgress.reviewCompleted) steps.push(10);
    
    return steps;
  }, [onboardingProgress]);

  
  const progressPercentage = useMemo(() => {
    return (completedSteps.length / totalSteps) * 100;
  }, [completedSteps.length, totalSteps]);
  
  // Step data is just localStepData
  const stepData = localStepData;

  // Load initial data and create/fetch villa
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!hasLoadedInitialData && userId) {
        setIsLoading(true);
        setError(null);
        
        try {
          // Get authentication token
          const token = await getToken();
          if (!token) {
            throw new Error('Authentication required. Please sign in.');
          }
          
          const authenticatedApi = new ClientApiClient();
          authenticatedApi.setToken(token);
          
          // Helper function to retry requests with exponential backoff for rate limits
          const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                return await fn();
              } catch (error: any) {
                const isRateLimit = error?.message?.includes('Rate limit') || 
                                   error?.message?.includes('Too many requests') ||
                                   error?.status === 429;
                
                if (isRateLimit && attempt < maxRetries) {
                  const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s
                  console.log(`🔄 Rate limit hit, retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
                  await new Promise(resolve => setTimeout(resolve, backoffTime));
                  continue;
                }
                throw error;
              }
            }
          };
          
          // Check localStorage for existing villa
          const storedVillaId = localStorage.getItem(`onboarding_villa_${userId}`);
          const storedStep = localStorage.getItem(`onboarding_step_${userId}`);
          const storedData = localStorage.getItem(`onboarding_data_${userId}`);
          
          let villa = null;
          
          if (storedVillaId) {
            // Try to fetch existing villa and its progress with retry for rate limits
            try {
              const progressResponse = await retryWithBackoff(() => 
                authenticatedApi.getOnboardingProgress(storedVillaId)
              );
              console.log('📊 Full onboarding progress response:', progressResponse);
              if (progressResponse.success && progressResponse.data) {
                villa = progressResponse.data.villa;
                setOnboardingProgress(progressResponse.data);
                
                // Load saved data from backend
                if (progressResponse.data.villa) {
                  const loadedData: Record<string, any> = {};
                  
                  // Load villa info (step 1)
                  if (progressResponse.data.villa) {
                    console.log('🏠 Raw villa data from backend:', progressResponse.data.villa);
                    console.log('🏠 Important fields from backend:', {
                      villaName: progressResponse.data.villa.villaName,
                      address: progressResponse.data.villa.address,
                      city: progressResponse.data.villa.city,
                      country: progressResponse.data.villa.country,
                      bedrooms: progressResponse.data.villa.bedrooms,
                      bathrooms: progressResponse.data.villa.bathrooms,
                      maxGuests: progressResponse.data.villa.maxGuests
                    });
                    loadedData.step1 = mapOnboardingDataFromBackend(1, progressResponse.data.villa);
                    console.log('🔄 Mapped step1 data:', loadedData.step1);
                    console.log('🔄 Important mapped fields:', {
                      villaName: loadedData.step1.villaName,
                      villaAddress: loadedData.step1.villaAddress,
                      villaCity: loadedData.step1.villaCity,
                      villaCountry: loadedData.step1.villaCountry,
                      bedrooms: loadedData.step1.bedrooms,
                      bathrooms: loadedData.step1.bathrooms,
                      maxGuests: loadedData.step1.maxGuests
                    });
                  }
                  
                  // Load owner details (step 2)
                  console.log('🏠 Owner data from backend:', progressResponse.data.villa.owner);
                  if (progressResponse.data.villa.owner) {
                    console.log('🏠 Mapping owner data to frontend...');
                    console.log('🏠 Owner raw data fields:', Object.keys(progressResponse.data.villa.owner));
                    console.log('🏠 Owner raw data values:', progressResponse.data.villa.owner);
                    loadedData.step2 = mapOnboardingDataFromBackend(2, progressResponse.data.villa.owner);
                    console.log('🏠 Mapped step2 data:', loadedData.step2);
                    console.log('🏠 Mapped step2 data keys:', Object.keys(loadedData.step2));
                  } else {
                    console.log('🏠 No owner data found in database - step2 will start empty');
                  }
                  
                  // Load other step data similarly...
                  if (progressResponse.data.villa.contractualDetails) {
                    loadedData.step3 = mapOnboardingDataFromBackend(3, progressResponse.data.villa.contractualDetails);
                  }
                  
                  if (progressResponse.data.villa.bankDetails) {
                    loadedData.step4 = mapOnboardingDataFromBackend(4, progressResponse.data.villa.bankDetails);
                  }
                  
                  // Load OTA credentials (step 5)
                  if (progressResponse.data.villa.otaCredentials && progressResponse.data.villa.otaCredentials.length > 0) {
                    console.log('🏠 OTA credentials data from backend:', progressResponse.data.villa.otaCredentials);
                    loadedData.step5 = mapOnboardingDataFromBackend(5, progressResponse.data.villa.otaCredentials);
                    console.log('🏠 Mapped step5 data:', loadedData.step5);
                  } else {
                    console.log('🏠 No OTA credentials found in database - step5 will start empty');
                  }
                  
                  // Decide which heavy sections to load to avoid rate limits
                  const targetStep = storedStep ? parseInt(storedStep, 10) : (progressResponse.data.currentStep || 1);
                  
                  // Load documents (step 6) only if returning to step 6
                  if (targetStep === 6) {
                  try {
                    console.log('📄 Loading documents from backend...');
                    const documentsResponse = await authenticatedApi.getSharePointDocuments(storedVillaId);
                    console.log('📄 Documents API response:', documentsResponse);
                    
                    if (documentsResponse.success && documentsResponse.data && documentsResponse.data.documents && documentsResponse.data.documents.length > 0) {
                      console.log('📄 Found saved documents:', documentsResponse.data.documents);
                      loadedData.step6 = documentsResponse.data.documents;
                      console.log('📄 Set step6 data:', loadedData.step6);
                    } else {
                      console.log('📄 No documents found in SharePoint - step6 will start empty');
                      loadedData.step6 = [];
                    }
                  } catch (docError) {
                    console.warn('📄 Failed to load documents:', docError);
                    loadedData.step6 = [];
                  }
                  }
                  
                  // Load staff (step 7)
                  if (progressResponse.data.villa.staff && progressResponse.data.villa.staff.length > 0) {
                    console.log('👥 Staff data from backend:', progressResponse.data.villa.staff);
                    loadedData.step7 = mapOnboardingDataFromBackend(7, progressResponse.data.villa.staff);
                    console.log('👥 Mapped step7 data:', loadedData.step7);
                  } else {
                    console.log('👥 No staff found in database - step7 will start empty');
                  }
                  
                  // Load facilities (step 8) 
                  if (progressResponse.data.villa.facilities && progressResponse.data.villa.facilities.length > 0) {
                    console.log('🏊 Facilities data from backend:', progressResponse.data.villa.facilities);
                    loadedData.step8 = mapOnboardingDataFromBackend(8, progressResponse.data.villa.facilities);
                    console.log('🏊 Mapped step8 data:', loadedData.step8);
                  } else {
                    console.log('🏊 No facilities found in database - step8 will start empty');
                  }
                  
                  // Load photos (step 9) - ALWAYS load to ensure data persistence
                  try {
                    console.log('📸 Loading photos from backend (always loaded for persistence)...');
                    const photosResponse = await retryWithBackoff(() => 
                      authenticatedApi.getSharePointPhotos(storedVillaId)
                    );
                    console.log('📸 Photos API response:', photosResponse);
                    
                    if (photosResponse.success && photosResponse.data && photosResponse.data.photos && photosResponse.data.photos.length > 0) {
                      console.log('📸 Found saved photos:', photosResponse.data.photos);
                      
                      // Transform database photos to PhotoUploadStep format with cache busting
                      const transformedPhotos = photosResponse.data.photos.map((dbPhoto: any) => ({
                        id: dbPhoto.id,
                        file: null, // Database photos don't have File objects
                        category: dbPhoto.category.toLowerCase(), // Convert ENTERTAINMENT to entertainment
                        subfolder: dbPhoto.subfolder || undefined,
                        // Force using backend serve endpoint with cache busting to avoid private SharePoint URLs failing in <img>
                        preview: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/photos/serve/${dbPhoto.id}?t=${Date.now()}`,
                        uploaded: true,
                        sharePointId: dbPhoto.sharePointFileId,
                        sharePointPath: dbPhoto.sharePointPath,
                        fileName: dbPhoto.fileName,
                        fileUrl: dbPhoto.fileUrl,
                        isMain: dbPhoto.isMain || false,
                        caption: dbPhoto.caption,
                        altText: dbPhoto.altText
                      }));
                      
                      // Preserve existing step9 data (like bedrooms) and add photos
                      loadedData.step9 = { 
                        ...(loadedData.step9 || {}), 
                        photos: transformedPhotos 
                      };
                      console.log('📸 Transformed photos for step9:', loadedData.step9);
                    } else {
                      console.log('📸 No photos found in SharePoint - step9 will start empty');
                      loadedData.step9 = { 
                        ...(loadedData.step9 || {}), 
                        photos: [] 
                      };
                    }
                  } catch (photoError) {
                    console.warn('📸 Failed to load photos:', photoError);
                    loadedData.step9 = { 
                      ...(loadedData.step9 || {}), 
                      photos: [] 
                    };
                  }
                  
                  // Load field-level progress for enhanced tracking (including bedroom configuration) with delay
                  await new Promise(resolve => setTimeout(resolve, 200)); // Add delay before field progress
                  const enhancedData = await loadFieldProgress(storedVillaId, authenticatedApi, loadedData) || loadedData;
                  
                  console.log('🛏️ Final enhanced data for step 9:', enhancedData.step9);
                  console.log('🛏️ Enhanced data step9 bedrooms:', enhancedData.step9?.bedrooms);
                  
                  setLocalStepData(enhancedData);
                  setLastSavedData(enhancedData);
                }
                
                // Restore step position
                if (storedStep) {
                  setCurrentStep(parseInt(storedStep, 10));
                } else if (progressResponse.data.currentStep) {
                  setCurrentStep(progressResponse.data.currentStep);
                }
              }
            } catch (err) {
              console.warn('Could not load existing villa, creating new one');
              localStorage.removeItem(`onboarding_villa_${userId}`);
            }
          }
          
          // Create new villa if needed
          if (!villa) {
            const startOnboardingResponse = await authenticatedApi.startOnboarding('New Villa');
            
            if (startOnboardingResponse.success && startOnboardingResponse.data) {
              const { villaId: newVillaId, progress } = startOnboardingResponse.data;
              
              setVillaId(newVillaId);
              setOnboardingProgress(progress);
              
              // Store in localStorage
              localStorage.setItem(`onboarding_villa_${userId}`, newVillaId);
              localStorage.setItem(`onboarding_step_${userId}`, '1');
              
              // Try to load locally stored data if any
              if (storedData) {
                try {
                  const parsedData = JSON.parse(storedData);
                  setLocalStepData(parsedData);
                } catch (e) {
                  console.warn('Could not parse stored data:', e);
                }
              }
              
              // Load field-level progress for new villa too (in case of enhanced tracking)
              try {
                await loadFieldProgress(newVillaId, authenticatedApi);
              } catch (e) {
                console.debug('No field progress for new villa (expected)');
              }
            } else {
              const errorMsg = startOnboardingResponse.error || 'Failed to start onboarding';
              throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
            }
          } else {
            setVillaId(storedVillaId!);
          }
          
          setHasLoadedInitialData(true);
        } catch (error) {
          console.error('Error initializing onboarding:', error);
          
          // Extract meaningful error message
          let errorMessage = 'Failed to initialize onboarding';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            // Handle API response errors
            if ((error as any).error) {
              errorMessage = String((error as any).error);
            } else if ((error as any).message) {
              errorMessage = String((error as any).message);
            }
          }
          
          setError(errorMessage);
          toast.error(errorMessage);
          setHasLoadedInitialData(true);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    initializeOnboarding();
  }, [hasLoadedInitialData, userId, getToken]);

  // Simplified auto-save function that focuses on step-level saving
  const performAutoSave = useCallback(async () => {
    console.log(`💾 Auto-save triggered - Step ${currentStep}`, {
      villaId,
      autoSaveEnabled,
      isSaving,
      currentStepData: stepData[`step${currentStep}`]
    });
    
    if (!villaId || !autoSaveEnabled || isSaving) {
      console.log('💾 Auto-save skipped - preconditions not met');
      return;
    }
    
    const currentStepData = stepData[`step${currentStep}`];
    
    // 🕵️‍♂️ SHERLOCK INVESTIGATION - Special focus on step 6 auto-save
    if (currentStep === 6) {
      console.log('🔍 SHERLOCK AUTO-SAVE STEP 6 INVESTIGATION:');
      console.log('🔍 Current step data exists:', !!currentStepData);
      console.log('🔍 Current step data keys:', currentStepData ? Object.keys(currentStepData) : 'NO DATA');
      console.log('🔍 Current step data:', JSON.stringify(currentStepData, null, 2));
    }
    
    if (!currentStepData || Object.keys(currentStepData).length === 0) {
      console.log('💾 Auto-save skipped - no step data');
      return;
    }
    
    // Check if data has changed
    const lastSaved = lastSavedData[`step${currentStep}`];
    if (JSON.stringify(currentStepData) === JSON.stringify(lastSaved)) {
      console.log('💾 Auto-save skipped - no changes detected');
      return; // No changes to save
    }
    
    console.log('💾 Auto-save proceeding - data has changed', {
      currentData: currentStepData,
      lastSaved: lastSaved
    });
    
    // Always save to localStorage first (offline backup)
    try {
      localStorage.setItem(`onboarding_data_${userId}`, JSON.stringify(stepData));
      localStorage.setItem(`onboarding_step_${userId}`, currentStep.toString());
      localStorage.setItem(`onboarding_backup_timestamp_${userId}`, Date.now().toString());
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    
    setIsSaving(true);
    
    try {
      const token = await getToken();
      if (!token) {
        console.warn('No authentication token for auto-save, using offline mode');
        setLastSavedData(prev => ({
          ...prev,
          [`step${currentStep}`]: JSON.parse(JSON.stringify(currentStepData))
        }));
        setIsOfflineMode(true);
        return;
      }
      
      const authenticatedApi = new ClientApiClient();
      authenticatedApi.setToken(token);
      
      // Do step-level save with mapped data
      const mappedData = mapOnboardingDataToBackend(currentStep, currentStepData);
      console.log(`Auto-saving step ${currentStep} data:`, mappedData);
      console.log('Mapped data keys:', Object.keys(mappedData));
      console.log('Mapped data values:', Object.entries(mappedData).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value;
        return acc;
      }, {} as any));
      
      console.log('🏦 Auto-save validation check - step', currentStep, 'data:', mappedData);
      const response = await authenticatedApi.saveOnboardingStep(villaId, currentStep, mappedData, true);
      console.log('🏦 Auto-save response:', response);
      
      if (response.success) {
        // Update UI state with deep copy to avoid reference sharing
        setLastSavedData(prev => ({
          ...prev,
          [`step${currentStep}`]: JSON.parse(JSON.stringify(currentStepData))
        }));
        
        setIsOfflineMode(false);
        console.log(`Auto-saved step ${currentStep} successfully`);
      } else {
        // Handle step-level save errors
        console.warn('Step auto-save failed:', response.error);
        setLastSavedData(prev => ({
          ...prev,
          [`step${currentStep}`]: JSON.parse(JSON.stringify(currentStepData))
        }));
        setIsOfflineMode(true);
      }
    } catch (error: any) {
      // Handle all network and server errors gracefully - silently save locally
      // No need to spam console with errors
      
      // Save data locally regardless of error type
      setLastSavedData(prev => ({
        ...prev,
        [`step${currentStep}`]: JSON.parse(JSON.stringify(currentStepData))
      }));
      
      // Set offline mode with better user feedback
      setIsOfflineMode(true);
    } finally {
      setIsSaving(false);
    }
  }, [villaId, autoSaveEnabled, isSaving, stepData, currentStep, lastSavedData, getToken, userId, totalSteps]);

  // Auto-save on data change with longer debounce to avoid rate limiting
  useEffect(() => {
    if (!autoSaveEnabled || !villaId) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Reduce debounce to 5 seconds for better user experience with rate limiting fixes
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 5000);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [stepData, performAutoSave, autoSaveEnabled, villaId]);

  // Periodic auto-save every 2 minutes (reduced frequency to avoid rate limits)
  useEffect(() => {
    if (!autoSaveEnabled || !villaId) return;
    
    const intervalId = setInterval(() => {
      performAutoSave();
    }, 120000);
    
    return () => clearInterval(intervalId);
  }, [performAutoSave, autoSaveEnabled, villaId]);

  // Enhanced update handler with auto-save trigger
  const handleUpdate = useCallback((stepNumber: number, data: any) => {
    console.log(`🔄 OnboardingWizard - handleUpdate called for step ${stepNumber}:`, data);
    
    // 🕵️‍♂️ SHERLOCK INVESTIGATION - Special focus on step 6 and 7
    if (stepNumber === 6) {
      console.log('🔍 SHERLOCK STEP 6 INVESTIGATION:');
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Data is array:', Array.isArray(data));  
      console.log('🔍 Data keys:', data ? Object.keys(data) : 'NO DATA');
      console.log('🔍 Data has staff property:', !!(data && data.staff));
      console.log('🔍 Staff array length:', data && data.staff ? data.staff.length : 'NO STAFF');
      console.log('🔍 Full data structure:', JSON.stringify(data, null, 2));
    }
    
    if (stepNumber === 7) {
      console.log('🔍 SHERLOCK STEP 7 INVESTIGATION - STAFF:');
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Data is array:', Array.isArray(data));  
      console.log('🔍 Data keys:', data ? Object.keys(data) : 'NO DATA');
      console.log('🔍 Data has staff property:', !!(data && data.staff));
      console.log('🔍 Staff array length:', data && data.staff ? data.staff.length : 'NO STAFF');
      console.log('🔍 First staff member:', data && data.staff && data.staff.length > 0 ? data.staff[0] : 'NO FIRST STAFF');
      console.log('🔍 Full staff structure:', JSON.stringify(data, null, 2));
    }
    
    setLocalStepData(prev => {
      const updated = {
        ...prev,
        [`step${stepNumber}`]: data
      };
      
      // Special logging for step 6 and 7 data in state
      if (stepNumber === 6) {
        console.log('🔍 SHERLOCK: Step 6 data being set in state:', updated.step6);
      }
      if (stepNumber === 7) {
        console.log('🔍 SHERLOCK: Step 7 data being set in state:', updated.step7);
      }
      
      console.log(`🔄 OnboardingWizard - Updated localStepData:`, updated);
      return updated;
    });
    
    // Trigger debounced auto-save immediately when data changes
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 OnboardingWizard - Triggering auto-save for step ${stepNumber}`);
      performAutoSave();
    }, 3000); // 3 second debounce for immediate user feedback
    
  }, [performAutoSave]);

  const handleNext = useCallback(async () => {
    // Save current step as completed before navigating to next step
    if (currentStep < totalSteps) {
      const currentStepData = stepData[`step${currentStep}`];
      
      console.log(`🔄 HandleNext - Step ${currentStep} data:`, currentStepData);
      console.log(`🔄 HandleNext - Data keys:`, currentStepData ? Object.keys(currentStepData) : 'no data');
      
      // Use step component validation if available
      const stepRef = stepRefs.current[currentStep - 1];
      let hasValidData = false;
      
      if (stepRef && typeof stepRef.validate === 'function') {
        hasValidData = stepRef.validate();
        console.log(`🔄 HandleNext - Step ${currentStep} validation result:`, hasValidData);
      } else {
        // Fallback to data check for steps without validation
        hasValidData = currentStepData && Object.keys(currentStepData).length > 0;
        console.log(`🔄 HandleNext - Step ${currentStep} fallback validation:`, hasValidData);
      }
      
      // If we have valid data for the current step, save it as completed
      if (hasValidData) {
        try {
          const token = await getToken();
          if (token) {
            const authenticatedApi = new ClientApiClient();
            authenticatedApi.setToken(token);
            
            // Map the data and save it as completed (not auto-save)
            const mappedData = mapOnboardingDataToBackend(currentStep, currentStepData);
            console.log(`🔄 Manual save on Next - Step ${currentStep}:`, mappedData);
            
            const response = await authenticatedApi.saveOnboardingStep(villaId!, currentStep, mappedData, false); // false = not auto-save, so completed=true
            console.log(`🔄 Manual save response:`, response);
            
            if (response.success) {
              console.log(`✅ Step ${currentStep} marked as completed manually`);
            }
          }
        } catch (error) {
          console.warn('Failed to save step on Next, continuing anyway:', error);
        }
      }
      
      setCurrentStep(currentStep + 1);
      localStorage.setItem(`onboarding_step_${userId}`, (currentStep + 1).toString());
    } else {
      // Complete onboarding - only try this at the very end
      setIsLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const authenticatedApi = new ClientApiClient();
          authenticatedApi.setToken(token);
          
          const completeResponse = await authenticatedApi.completeOnboarding(villaId!);
          if (completeResponse.success) {
            toast.success('Onboarding completed successfully! Redirecting to dashboard...');
            
            // Clear localStorage
            localStorage.removeItem(`onboarding_villa_${userId}`);
            localStorage.removeItem(`onboarding_step_${userId}`);
            localStorage.removeItem(`onboarding_data_${userId}`);
            
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
            return;
          }
        }
        
        // If server completion fails, still show success (data is saved locally)
        toast.success('Onboarding completed! Your data is saved.');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } catch (error) {
        console.warn('Could not complete onboarding on server, but data is saved locally');
        toast.success('Onboarding completed! Your data is saved.');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentStep, totalSteps, userId, villaId, getToken, stepData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      localStorage.setItem(`onboarding_step_${userId}`, (currentStep - 1).toString());
    }
  }, [currentStep, userId]);

  const handleStepClick = useCallback((stepNumber: number) => {
    setCurrentStep(stepNumber);
    localStorage.setItem(`onboarding_step_${userId}`, stepNumber.toString());
  }, [userId]);


  // Memoized step configuration
  const stepConfig = useMemo(() => [
    { Component: VillaInformationStepEnhanced, stepNumber: 1 },
    { Component: OwnerDetailsStep, stepNumber: 2 },
    { Component: ContractualDetailsStep, stepNumber: 3 },
    { Component: BankDetailsStep, stepNumber: 4 },
    { Component: OTACredentialsStep, stepNumber: 5 },
    { Component: DocumentsUploadStep, stepNumber: 6 },
    { Component: StaffConfiguratorStep, stepNumber: 7 },
    { Component: FacilitiesChecklistStep, stepNumber: 8 },
    { Component: PhotoUploadStep, stepNumber: 9 },
    { Component: ReviewSubmitStep, stepNumber: 10 }
  ], []);

  const renderStep = useMemo(() => {
    const currentStepConfig = stepConfig[currentStep - 1];
    if (!currentStepConfig) return <div>Step not found</div>;
    
    const { Component, stepNumber } = currentStepConfig;
    const currentStepData = stepData[`step${currentStep}`] || {};
    const dataToPass = stepNumber === 10 ? stepData : currentStepData;
    
    const stepNames = {
      1: "Villa Information",
      2: "Owner Details", 
      3: "Contractual Details",
      4: "Bank Details",
      5: "OTA Credentials",
      6: "Documents Upload",
      7: "Staff Configuration",
      8: "Facilities Checklist",
      9: "Photo Upload",
      10: "Review & Submit"
    };
    
    console.log(`📤 Passing data to step ${stepNumber} (${stepNames[stepNumber as keyof typeof stepNames]}):`, dataToPass);
    if (stepNumber === 9) {
      console.log('🛏️ Step 9 data bedrooms:', dataToPass?.bedrooms);
      console.log('🛏️ Step 9 data photos length:', dataToPass?.photos?.length || 0);
    }

    return (
      <StepErrorBoundary 
        stepName={stepNames[stepNumber as keyof typeof stepNames] || `Step ${stepNumber}`}
        onError={(error, errorInfo) => {
          console.error(`Step ${stepNumber} Error:`, { error, errorInfo, stepData: dataToPass });
        }}
      >
        <Component 
          ref={(el: StepHandle | null) => { stepRefs.current[stepNumber - 1] = el; }}
          data={dataToPass}
          onUpdate={(data: any) => handleUpdate(stepNumber, data)}
          villaId={villaId || undefined}
        />
      </StepErrorBoundary>
    );
  }, [currentStep, stepData, stepConfig, handleUpdate, villaId]);

  // Recovery handlers
  const handleRecover = useCallback(async () => {
    if (!recoveryData) return;
    
    try {
      setLocalStepData(recoveryData.stepData);
      setCurrentStep(recoveryData.currentStep);
      if (recoveryData.villaId) {
        setVillaId(recoveryData.villaId);
      }
      setShowRecoveryModal(false);
      toast.success('Progress restored successfully');
    } catch (error) {
      console.error('Recovery failed:', error);
      toast.error('Failed to restore progress');
    }
  }, [recoveryData]);

  const handleDiscardRecovery = useCallback(async () => {
    if (recoveryData) {
      await backupService.clearBackup(recoveryData.villaId);
    }
    setShowRecoveryModal(false);
    setRecoveryData(null);
    toast.info('Starting fresh onboarding');
  }, [recoveryData, backupService]);

  // Helper function to get step title
  const getStepTitle = useCallback((stepNum: number) => {
    const stepTitles = {
      1: "Villa Information",
      2: "Owner Details", 
      3: "Contractual Details",
      4: "Bank Details",
      5: "OTA Credentials",
      6: "Documents",
      7: "Staff",
      8: "Facilities",
      9: "Photos",
      10: "Review & Submit"
    };
    return stepTitles[stepNum as keyof typeof stepTitles] || `Step ${stepNum}`;
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard navigation if no modal is open and not in a form field
      if (showRecoveryModal || (event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (currentStep > 1) {
            event.preventDefault();
            setCurrentStep(currentStep - 1);
          }
          break;
        case 'ArrowRight':
          if (currentStep < totalSteps) {
            event.preventDefault();
            setCurrentStep(currentStep + 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          setCurrentStep(1);
          break;
        case 'End':
          event.preventDefault();
          setCurrentStep(totalSteps);
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleNext();
          }
          break;
        case 'Escape':
          if (showRecoveryModal) {
            event.preventDefault();
            setShowRecoveryModal(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, showRecoveryModal, handleNext]);

  // Show loading state while initializing
  if (!hasLoadedInitialData && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error && !villaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Failed to Load Onboarding</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <WizardErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Onboarding Wizard Error:', { error, errorInfo, stepData, currentStep });
      }}
    >
      <div className="min-h-screen p-6" role="main">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section removed as per user request */}

          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Villa Onboarding</h1>
              <p className="text-slate-600">Complete all steps to set up your villa for management</p>
              {villaId && (
                <p className="text-sm text-slate-500 mt-2">Villa ID: {villaId}</p>
              )}
              <div className="mt-4 text-sm text-slate-600">
                <p>Use keyboard shortcuts: Arrow keys to navigate, Ctrl+Enter to save, Home/End to jump to first/last step</p>
              </div>
            </header>

            <ErrorBoundary stepName="Progress Tracker">
              <ProgressTracker
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                steps={[
                  { id: 1, title: "Villa Information" },
                  { id: 2, title: "Owner Details" },
                  { id: 3, title: "Contractual Details" },
                  { id: 4, title: "Bank Details" },
                  { id: 5, title: "OTA Credentials" },
                  { id: 6, title: "Documents" },
                  { id: 7, title: "Staff" },
                  { id: 8, title: "Facilities" },
                  { id: 9, title: "Photos" },
                  { id: 10, title: "Review & Submit" }
                ]}
              />
            </ErrorBoundary>

            <main className="mt-8" role="region" aria-labelledby="current-step-heading" aria-live="polite">
              <div className="sr-only" id="current-step-heading">
                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
              </div>
              {renderStep}
              
              {/* Validation Summary */}
              <div className="mt-6">
                <ValidationSummary stepNumber={currentStep} />
              </div>
            </main>

            <ErrorBoundary stepName="Navigation Controls" isolate>
              <nav className="flex justify-between items-center mt-8" role="navigation" aria-label="Step navigation">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isLoading}
                  aria-label={`Go to previous step${currentStep > 1 ? `: ${getStepTitle(currentStep - 1)}` : ''}`}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Previous
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  aria-label={currentStep === totalSteps ? 'Complete onboarding process' : 'Continue to next step'}
                  className="px-6 py-3 bg-gradient-to-r from-[#009990] to-[#007a6b] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#009990] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : (currentStep === totalSteps ? 'Complete Onboarding' : 'Next')}
                </button>
              </nav>
            </ErrorBoundary>

            <div className="mt-6 text-center text-sm text-slate-600 space-y-2">
              <div role="status" aria-live="polite">
                Step {currentStep} of {totalSteps} • {progressPercentage}% Complete
              </div>
              {autoSaveEnabled && (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isSaving
                        ? 'bg-blue-500 animate-pulse'
                        : isOfflineMode
                        ? 'bg-orange-500'
                        : lastSavedData[`step${currentStep}`]
                        ? 'bg-green-500'
                        : 'bg-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-slate-500" role="status" aria-live="polite">
                    {isSaving 
                      ? 'Saving...'
                      : isOfflineMode
                      ? 'Offline - saved locally'
                      : lastSavedData[`step${currentStep}`]
                      ? 'Auto-saved to server'
                      : 'Auto-save enabled'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recovery Modal */}
      {recoveryData && (
        <RecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          backupData={recoveryData}
          onRecover={handleRecover}
          onDiscard={handleDiscardRecovery}
        />
      )}
    </WizardErrorBoundary>
  );
};

const OnboardingWizardEnhanced: React.FC = () => {
  return (
    <ValidationProvider enableRealTimeValidation={true} debounceMs={300}>
      <OnboardingWizardContent />
    </ValidationProvider>
  );
};

export default OnboardingWizardEnhanced;
