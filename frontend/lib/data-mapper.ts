// Data mapping utilities for converting between frontend and backend data structures

/**
 * Data sanitization utilities for facilities
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().substring(0, 1000); // Limit text to 1000 characters
}

function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';
  
  // Basic URL validation
  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    // If not a valid URL, check if it starts with http/https
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    // If it looks like a URL without protocol, add https
    if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
      return `https://${trimmedUrl}`;
    }
    return ''; // Invalid URL
  }
}

function validateCondition(condition: string): string | null {
  const validConditions = ['new', 'good', 'fair', 'poor'];
  if (!condition || !validConditions.includes(condition.toLowerCase())) {
    return null;
  }
  return condition.toLowerCase();
}

function getSubcategoryFromItemName(itemName: string): string {
  if (!itemName) return 'general';
  
  // Create subcategory from item name - normalize and clean
  return itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Map frontend facility category IDs (kebab-case) to backend enum values (underscore_case)
 */
export function mapFacilityCategoryToBackend(frontendCategoryId: string): string {
  // Direct mapping: convert kebab-case to underscore_case for new categories
  const directMapping = frontendCategoryId.replace(/-/g, '_');
  
  // New frontend categories that map directly after dash-to-underscore conversion
  const newCategories = [
    'property_layout_spaces',
    'occupancy_sleeping', 
    'bathrooms',
    'kitchen_dining',
    'service_staff',
    'living_spaces',
    'outdoor_facilities',
    'home_office',
    'entertainment_gaming',
    'technology',
    'wellness_spa',
    'accessibility',
    'safety_security',
    'child_friendly'
  ];
  
  if (newCategories.includes(directMapping)) {
    return directMapping;
  }
  
  // Legacy mapping for backward compatibility
  const legacyMapping: Record<string, string> = {
    'basic-property': 'OTHER',
    'kitchen-equipment': 'KITCHEN_EQUIPMENT',
    'bathroom-amenities': 'BATHROOM_AMENITIES',
    'bedroom-amenities': 'BEDROOM_AMENITIES',
    'living-room': 'LIVING_ROOM',
    'pool-area': 'POOL_AREA',
    'entertainment': 'ENTERTAINMENT',
    'utilities': 'UTILITIES',
    'business-facilities': 'BUSINESS_FACILITIES',
    'children-facilities': 'CHILDREN_FACILITIES',
    'pet-facilities': 'PET_FACILITIES',
    'other': 'OTHER'
  };
  
  return legacyMapping[frontendCategoryId] || 'OTHER';
}

/**
 * Map backend facility category enum values to frontend category IDs (underscore_case to kebab-case)
 */
export function mapFacilityCategoryToFrontend(backendCategory: string): string {
  // New categories: convert underscore_case to kebab-case
  const newCategories = [
    'property_layout_spaces',
    'occupancy_sleeping', 
    'bathrooms',
    'kitchen_dining',
    'service_staff',
    'living_spaces',
    'outdoor_facilities',
    'home_office',
    'entertainment_gaming',
    'technology',
    'wellness_spa',
    'accessibility',
    'safety_security',
    'child_friendly'
  ];
  
  if (newCategories.includes(backendCategory)) {
    return backendCategory.replace(/_/g, '-');
  }
  
  // Legacy mapping for backward compatibility → map to existing new category keys
  const legacyToNew: Record<string, string> = {
    'KITCHEN_EQUIPMENT': 'kitchen-dining',
    'BATHROOM_AMENITIES': 'bathrooms',
    'BEDROOM_AMENITIES': 'occupancy-sleeping',
    'LIVING_ROOM': 'living-spaces',
    'OUTDOOR_FACILITIES': 'outdoor-facilities',
    'POOL_AREA': 'outdoor-facilities',
    'ENTERTAINMENT': 'entertainment-gaming',
    'SAFETY_SECURITY': 'safety-security',
    'UTILITIES': 'service-staff',
    'ACCESSIBILITY': 'accessibility',
    'BUSINESS_FACILITIES': 'home-office',
    'CHILDREN_FACILITIES': 'child-friendly',
    'PET_FACILITIES': 'living-spaces',
    'OTHER': 'property-layout-spaces'
  };
  
  // If it's not in the legacy list, fall back to sanitized kebab-case
  return legacyToNew[backendCategory] || backendCategory.toLowerCase().replace(/_/g, '-');
}

/**
 * Map frontend photo category IDs (snake_case) to backend enum values (SCREAMING_SNAKE_CASE)
 */
function mapPhotoCategoryToBackend(frontendCategoryId: string): string {
  // Convert to uppercase for database enum
  return frontendCategoryId.toUpperCase();
}

/**
 * Map backend photo category enum values (SCREAMING_SNAKE_CASE) to frontend category IDs (snake_case)
 */
function mapPhotoCategoryToFrontend(backendCategory: string): string {
  // Convert to lowercase for frontend
  return backendCategory.toLowerCase();
}

/**
 * Map frontend villa data to backend schema
 */
export function mapVillaDataToBackend(frontendData: any) {
  return {
    // Villa Information
    villaName: frontendData.villaName,
    villaCode: frontendData.villaCode || generateVillaCode(frontendData.villaName),
    location: frontendData.location || frontendData.locationType || '',
    address: frontendData.villaAddress || frontendData.address || '',
    city: frontendData.villaCity || frontendData.city || '',
    country: frontendData.villaCountry || frontendData.country || '',
    zipCode: frontendData.villaPostalCode || frontendData.zipCode,
    bedrooms: parseInt(frontendData.bedrooms) || 0,
    bathrooms: parseInt(frontendData.bathrooms) || 0,
    maxGuests: parseInt(frontendData.maxGuests) || 0,
    propertySize: parseFloat(frontendData.villaArea) || null,
    plotSize: parseFloat(frontendData.landArea) || null,
    // Ensure enum casing aligns with backend expectations
    propertyType: frontendData.propertyType ? String(frontendData.propertyType).toUpperCase() : 'VILLA',
    yearBuilt: frontendData.yearBuilt ? parseInt(frontendData.yearBuilt) : null,
    renovationYear: frontendData.renovationYear ? parseInt(frontendData.renovationYear) : null,
    villaStyle: frontendData.villaStyle ? String(frontendData.villaStyle).toUpperCase() : null,
    description: frontendData.description,
    shortDescription: frontendData.shortDescription,
    
    // Google Maps Integration - FIXED CRITICAL ISSUE
    latitude: frontendData.latitude || parseLatLngFromCoordinates(frontendData.googleCoordinates)?.lat,
    longitude: frontendData.longitude || parseLatLngFromCoordinates(frontendData.googleCoordinates)?.lng,
    
    // External Links - NEWLY ADDED FIELDS
    googleMapsLink: frontendData.googleMapsLink,
    oldRatesCardLink: frontendData.oldRatesCardLink,
    iCalCalendarLink: frontendData.iCalCalendarLink,
    
    // Additional fields
    status: frontendData.status || 'DRAFT',
  };
}

/**
 * Map backend villa data to frontend schema
 */
export function mapVillaDataToFrontend(backendData: any) {
  console.log('🔍 mapVillaDataToFrontend input:', backendData);
  console.log('🔍 propertyType from backend:', backendData.propertyType, typeof backendData.propertyType);
  const result = {
    // Villa Information
    villaName: backendData.villaName,
    villaCode: backendData.villaCode,
    villaAddress: backendData.address,
    villaCity: backendData.city,
    villaCountry: backendData.country, // Fixed: was 'country', should be 'villaCountry'
    villaPostalCode: backendData.zipCode,
    bedrooms: backendData.bedrooms?.toString() || '',
    bathrooms: backendData.bathrooms?.toString() || '',
    maxGuests: backendData.maxGuests?.toString() || '',
    propertyType: backendData.propertyType || '',
    villaArea: backendData.propertySize?.toString() || '',
    landArea: backendData.plotSize?.toString() || '',
    locationType: backendData.location,
    
    // Villa Details - NEW FIELDS
    yearBuilt: backendData.yearBuilt?.toString() || '',
    renovationYear: backendData.renovationYear?.toString() || '',
    villaStyle: backendData.villaStyle || '',
    
    // Google Maps - FIXED COORDINATES MAPPING
    latitude: backendData.latitude?.toString() || '',
    longitude: backendData.longitude?.toString() || '',
    googleCoordinates: backendData.latitude && backendData.longitude 
      ? `${backendData.latitude}, ${backendData.longitude}` 
      : '',
    
    // External Links - NEWLY ADDED FIELDS
    googleMapsLink: backendData.googleMapsLink || '',
    oldRatesCardLink: backendData.oldRatesCardLink || '',
    iCalCalendarLink: backendData.iCalCalendarLink || '',
    
    // Additional fields
    description: backendData.description || '',
    shortDescription: backendData.shortDescription || '',
    status: backendData.status,
  };
  console.log('🔍 mapVillaDataToFrontend output:', result);
  console.log('🔍 propertyType in output:', result.propertyType);
  return result;
}

/**
 * Map frontend owner data to backend schema
 */
export function mapOwnerDataToBackend(frontendData: any) {
  // Handle name fields - now using separate firstName/lastName
  const firstName = frontendData.firstName || '';
  const lastName = frontendData.lastName || '';

  return {
    // Owner Type - Updated field mapping
    ownerType: frontendData.ownerType || 'INDIVIDUAL',
    
    // Personal Information - Updated field mappings
    firstName,
    lastName,
    email: frontendData.email,
    phone: frontendData.phone,
    phoneCountryCode: frontendData.phoneCountryCode,
    phoneDialCode: frontendData.phoneDialCode,
    alternativePhone: frontendData.alternativePhone,
    alternativePhoneCountryCode: frontendData.alternativePhoneCountryCode,
    alternativePhoneDialCode: frontendData.alternativePhoneDialCode,
    nationality: frontendData.nationality,
    passportNumber: frontendData.passportNumber,
    idNumber: frontendData.idNumber,
    address: frontendData.address,
    city: frontendData.city,
    country: frontendData.country,
    zipCode: frontendData.zipCode,
    
    // Company Information - Updated field mappings
    companyName: frontendData.companyName,
    companyAddress: frontendData.companyAddress,
    companyTaxId: frontendData.companyTaxId,
    companyVat: frontendData.companyVat,
    
    // Manager Information - Updated field mappings
    managerName: frontendData.managerName,
    managerEmail: frontendData.managerEmail,
    managerPhone: frontendData.managerPhone,
    managerPhoneCountryCode: frontendData.managerPhoneCountryCode,
    managerPhoneDialCode: frontendData.managerPhoneDialCode,
    
    // Property Contact Information
    propertyEmail: frontendData.propertyEmail,
    propertyWebsite: frontendData.propertyWebsite,
    
    // Additional Info
    preferredLanguage: frontendData.preferredLanguage || 'en',
    communicationPreference: frontendData.communicationPreference || 'EMAIL',
    notes: frontendData.notes,
  };
}

/**
 * Map frontend contractual details to backend schema
 */
export function mapContractualDetailsToBackend(frontendData: any) {
  const result = {
    // Contract Dates - Map contractSignatureDate to contractStartDate (frontend field -> backend field)
    contractStartDate: (frontendData.contractSignatureDate && frontendData.contractSignatureDate !== '') 
      ? new Date(frontendData.contractSignatureDate).toISOString() : 
      (frontendData.contractStartDate && frontendData.contractStartDate !== '')
      ? new Date(frontendData.contractStartDate).toISOString() : 
      new Date().toISOString(), // Use current date as fallback if no contract date provided
    contractEndDate: (frontendData.contractRenewalDate && frontendData.contractRenewalDate !== '') 
      ? new Date(frontendData.contractRenewalDate).toISOString() : 
      (frontendData.contractEndDate && frontendData.contractEndDate !== '')
      ? new Date(frontendData.contractEndDate).toISOString() : null,
    contractType: (frontendData.contractType && frontendData.contractType !== '') 
      ? frontendData.contractType.toUpperCase() : 'EXCLUSIVE',
    
    // Commission and Fees - Map serviceCharge to commissionRate
    commissionRate: frontendData.serviceCharge && frontendData.serviceCharge !== '' 
      ? parseFloat(frontendData.serviceCharge) 
      : frontendData.commissionRate && frontendData.commissionRate !== ''
      ? parseFloat(frontendData.commissionRate)
      : 0,
    managementFee: (frontendData.managementFee && frontendData.managementFee !== '') 
      ? parseFloat(frontendData.managementFee) : null,
    marketingFee: (frontendData.marketingFee && frontendData.marketingFee !== '') 
      ? parseFloat(frontendData.marketingFee) : null,
    
    // Payment Terms
    paymentTerms: (frontendData.paymentTerms && frontendData.paymentTerms !== '') 
      ? frontendData.paymentTerms : null,
    paymentSchedule: frontendData.paymentSchedule ? frontendData.paymentSchedule.toUpperCase() : 'MONTHLY',
    minimumStayNights: parseInt(frontendData.minimumStayNights) || 1,
    payoutDay1: (frontendData.payoutDay1 && frontendData.payoutDay1 !== '') 
      ? parseInt(frontendData.payoutDay1) : null,
    payoutDay2: (frontendData.payoutDay2 && frontendData.payoutDay2 !== '') 
      ? parseInt(frontendData.payoutDay2) : null,
    
    // VAT Information - NEWLY ADDED FIELDS
    vatRegistrationNumber: (frontendData.vatRegistrationNumber && frontendData.vatRegistrationNumber !== '') 
      ? frontendData.vatRegistrationNumber : null,
    dbdNumber: (frontendData.dbdNumber && frontendData.dbdNumber !== '') 
      ? frontendData.dbdNumber : null,
    vatPaymentTerms: (frontendData.vatPaymentTerms && frontendData.vatPaymentTerms !== '') 
      ? frontendData.vatPaymentTerms : null,
    paymentThroughIPL: frontendData.paymentThroughIPL || false,
    
    // Policies
    cancellationPolicy: frontendData.cancellationPolicy ? frontendData.cancellationPolicy.toUpperCase() : 'MODERATE',
    checkInTime: frontendData.checkInTime || '15:00',
    checkOutTime: frontendData.checkOutTime || '11:00',
    
    // Insurance
    insuranceProvider: (frontendData.insuranceProvider && frontendData.insuranceProvider !== '') 
      ? frontendData.insuranceProvider : null,
    insurancePolicyNumber: (frontendData.insurancePolicyNumber && frontendData.insurancePolicyNumber !== '') 
      ? frontendData.insurancePolicyNumber : null,
    insuranceExpiry: (frontendData.insuranceExpiry && frontendData.insuranceExpiry !== '') 
      ? new Date(frontendData.insuranceExpiry).toISOString() : null,
    
    // Special Terms
    specialTerms: (frontendData.specialTerms && frontendData.specialTerms !== '') 
      ? frontendData.specialTerms : null,
  };
  
  return result;
}

/**
 * Map frontend bank details to backend schema
 */
export function mapBankDetailsToBackend(frontendData: any) {
  console.log('🏦 mapBankDetailsToBackend - Frontend input:', frontendData);
  const mapped = {
    // Map frontend field names to database column names
    // Note: securityAcknowledged is not persisted - it's a session-only field
    accountHolderName: frontendData.accountName || frontendData.accountHolderName,
    bankName: frontendData.bankName,
    accountNumber: frontendData.bankAccountNumber || frontendData.accountNumber,
    swiftCode: frontendData.swiftBicCode || frontendData.swiftCode,
    iban: frontendData.iban,
    branchName: frontendData.bankBranch || frontendData.branchName,
    branchCode: frontendData.branchCode,
    branchAddress: frontendData.bankAddress || frontendData.branchAddress,
    bankAddress: frontendData.bankAddress, // Also map to bankAddress for compatibility
    bankCountry: frontendData.bankCountry,
    // Align with backend default USD to avoid inconsistency
    currency: frontendData.currency || 'USD',
    accountType: frontendData.accountType ? frontendData.accountType.toUpperCase() : 'CHECKING',
    routingNumber: frontendData.routingNumber,
    taxId: frontendData.taxId,
    notes: frontendData.bankNotes || frontendData.notes,
  };
  console.log('🏦 mapBankDetailsToBackend - Backend output:', mapped);
  return mapped;
}

// Helper function to get enum value or default
function getEnumValue(value: any, validValues: string[], defaultValue: string): string {
  if (!value) return defaultValue;
  const upperValue = value.toString().toUpperCase();
  return validValues.includes(upperValue) ? upperValue : defaultValue;
}

// Helper function to determine department from position
function getDepartmentFromPosition(position: string): string {
  const positionToDepartment: Record<string, string> = {
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
  const upperPosition = position?.toUpperCase() || 'OTHER';
  return positionToDepartment[upperPosition] || 'ADMINISTRATION';
}

// Helper function to get position display name (reverse mapping)
function getPositionDisplayName(enumValue: string): string {
  const positionMapping: Record<string, string> = {
    'VILLA_MANAGER': 'Villa Manager',
    'HOUSEKEEPER': 'Housekeeper',
    'GARDENER': 'Gardener',
    'POOL_MAINTENANCE': 'Pool Maintenance',
    'SECURITY': 'Security',
    'CHEF': 'Chef',
    'DRIVER': 'Driver',
    'CONCIERGE': 'Concierge',
    'MAINTENANCE': 'Maintenance',
    'OTHER': 'Other'
  };
  return positionMapping[enumValue] || enumValue;
}

// Helper function to derive transportation from benefits
function deriveTransportationFromBenefits(hasTransport: boolean): string {
  return hasTransport ? 'Company Vehicle' : 'Walking Distance';
}

/**
 * Map frontend staff data to backend schema
 */
export function mapStaffDataToBackend(frontendData: any) {
  console.log('🔍 SHERLOCK: mapStaffDataToBackend called with:', frontendData);
  
  // Use firstName and lastName directly from form
  const firstName = frontendData.firstName || '';
  const lastName = frontendData.lastName || '';

  const mappedData = {
    // Personal Information
    firstName,
    lastName,
    nickname: frontendData.nickname || null,
    email: frontendData.email || null,
    phone: frontendData.phone || '',
    idNumber: frontendData.idCard || frontendData.idNumber || null, // Frontend uses idCard
    passportNumber: frontendData.passportNumber || null,
    nationality: frontendData.nationality || null,
    dateOfBirth: frontendData.dateOfBirth ? new Date(frontendData.dateOfBirth).toISOString() : null,
    maritalStatus: frontendData.maritalStatus === true ? true : 
                   frontendData.maritalStatus === false ? false : null,
    
    // Employment Details - Map to proper enums
    position: getEnumValue(frontendData.position, ['VILLA_MANAGER', 'HOUSEKEEPER', 'GARDENER', 'POOL_MAINTENANCE', 'SECURITY', 'CHEF', 'DRIVER', 'CONCIERGE', 'MAINTENANCE', 'OTHER'], 'OTHER'),
    department: getDepartmentFromPosition(frontendData.position),
    employmentType: getEnumValue(frontendData.employmentType, ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'SEASONAL', 'FREELANCE'], 'FULL_TIME'),
    startDate: frontendData.startDate ? new Date(frontendData.startDate).toISOString() : new Date().toISOString(),
    endDate: frontendData.endDate ? new Date(frontendData.endDate).toISOString() : null,
    
    // Compensation - Map frontend financial fields to backend
    salary: parseFloat(frontendData.baseSalary || frontendData.salary || '0') || 0,
    salaryFrequency: getEnumValue(frontendData.salaryFrequency, ['HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUALLY'], 'MONTHLY'),
    currency: frontendData.currency || 'IDR',
    numberOfDaySalary: parseFloat(frontendData.numberOfDaySalary || '0') || 0,
    serviceCharge: parseFloat(frontendData.serviceCharge || '0') || 0,
    totalIncome: parseFloat(frontendData.totalIncome || '0') || 0,
    totalNetIncome: parseFloat(frontendData.totalNetIncome || '0') || 0,
    otherDeductions: parseFloat(frontendData.otherDeduct || frontendData.otherDeductions || '0') || 0,
    
    // Benefits
    hasAccommodation: frontendData.hasAccommodation || false,
    hasTransport: frontendData.hasTransport || (frontendData.transportation && frontendData.transportation !== 'Walking Distance') || false,
    hasHealthInsurance: frontendData.healthInsurance || false,
    hasWorkInsurance: frontendData.workInsurance || false,
    foodAllowance: frontendData.foodAllowance || frontendData.hasMeals || false,
    transportation: frontendData.transportation || null,
    
    // Emergency Contacts - Convert to structured JSON with firstName/lastName
    emergencyContacts: frontendData.emergencyContacts && frontendData.emergencyContacts.length > 0 ? 
      JSON.stringify(frontendData.emergencyContacts.filter((contact: any) => contact.firstName || contact.lastName || contact.phone).map((contact: any) => ({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phone || '',
        phoneCountryCode: contact.phoneCountryCode || '',
        phoneDialCode: contact.phoneDialCode || '',
        email: contact.email || '',
        relationship: contact.relationship || 'OTHER'
      }))) : null,
    
    // Status
    isActive: frontendData.isActive !== undefined ? frontendData.isActive : true,
  };
  
  console.log('🔄 Mapped staff data for backend:', mappedData);
  return mappedData;
}

/**
 * Map all onboarding step data to backend format
 */
export function mapOnboardingDataToBackend(step: number, frontendData: any) {
  // Return empty object if no data
  if (!frontendData || Object.keys(frontendData).length === 0) {
    return {};
  }

  switch (step) {
    case 1: // Villa Information
      return mapVillaDataToBackend(frontendData);
    case 2: // Owner Details
      return mapOwnerDataToBackend(frontendData);
    case 3: // Contractual Details
      return mapContractualDetailsToBackend(frontendData);
    case 4: // Bank Details
      return mapBankDetailsToBackend(frontendData);
    case 5: // OTA Credentials - Fixed mapping to preserve all platforms
      // Convert flat frontend structure to array of platform objects
      console.log('🔄 Frontend-to-backend OTA mapping input:', frontendData);
      const platforms = [];
      const otaPlatforms = [
        { key: 'bookingCom', platform: 'BOOKING_COM' },
        { key: 'airbnb', platform: 'AIRBNB' },
        { key: 'vrbo', platform: 'VRBO' },
        { key: 'expedia', platform: 'EXPEDIA' },
        { key: 'agoda', platform: 'AGODA' },
        { key: 'hotelsCom', platform: 'HOTELS_COM' },
        { key: 'tripadvisor', platform: 'TRIPADVISOR' },
      ];
      
      // Process all platforms - include both listed and platforms with existing data
      for (const { key, platform } of otaPlatforms) {
        const isListed = frontendData[`${key}Listed`];
        
        // Check if platform has any data (credentials, URLs, etc.)
        const hasAnyData = frontendData[`${key}Username`] || frontendData[`${key}Password`] || 
                          frontendData[`${key}PropertyId`] || frontendData[`${key}ApiKey`] || 
                          frontendData[`${key}ApiSecret`] || frontendData[`${key}ListingUrl`] ||
                          frontendData[`${key}AccountUrl`] || frontendData[`${key}PropertyUrl`];
                               
        console.log(`🏨 OTA Platform ${key} (${platform}):`, {
          isListed,
          hasAnyData,
          fields: {
            username: frontendData[`${key}Username`],
            password: frontendData[`${key}Password`] ? '[HIDDEN]' : '',
            propertyId: frontendData[`${key}PropertyId`],
            apiKey: frontendData[`${key}ApiKey`] ? '[HIDDEN]' : '',
            apiSecret: frontendData[`${key}ApiSecret`] ? '[HIDDEN]' : '',
          }
        });
                               
        // Include platform if it's listed OR has existing data
        if (isListed || hasAnyData) {
          platforms.push({
            platform,
            username: frontendData[`${key}Username`] || null,
            password: frontendData[`${key}Password`] || null,
            propertyId: frontendData[`${key}PropertyId`] || null,
            apiKey: frontendData[`${key}ApiKey`] || null,
            apiSecret: frontendData[`${key}ApiSecret`] || null,
            listingUrl: frontendData[`${key}ListingUrl`] || null,
            accountUrl: frontendData[`${key}AccountUrl`] || null,
            propertyUrl: frontendData[`${key}PropertyUrl`] || null,
            isActive: isListed, // This will be true for listed, false for unlisted with data
          });
        }
      }
      
      console.log('🔄 Frontend-to-backend OTA mapping output:', { platforms });
      return {
        platforms,
      };
    case 6: // Documents Upload
      return {
        documents: Array.isArray(frontendData.documents) ? frontendData.documents : [],
      };
    case 7: // Staff Configuration - Enhanced mapping
      console.log('🔄 Processing step 7 staff data for backend:', frontendData);
      // Handle both direct array and object with staff array
      const staffArray = Array.isArray(frontendData) ? frontendData : 
                        Array.isArray(frontendData.staff) ? frontendData.staff : [];
      console.log('🔄 Staff array for backend mapping:', staffArray.length, 'members');
      const mappedStaffForBackend = staffArray.map((staff: any) => mapStaffDataToBackend(staff));
      console.log('🔄 Final staff data being sent to backend:', { staff: mappedStaffForBackend });
      return {
        staff: mappedStaffForBackend,
      };
    case 8: // Facilities Checklist
      // Enhanced facilities mapping with proper field sanitization and category mapping
      console.log('🏗️ DataMapper: Frontend facilities data received:', frontendData);
      const facilitiesArray = Array.isArray(frontendData.facilities) ? frontendData.facilities : [];
      console.log('🏗️ DataMapper: Facilities array length:', facilitiesArray.length);
      
      const sanitizedFacilities = facilitiesArray.map((facility: any) => {
        const mapped = {
          category: mapFacilityCategoryToBackend(facility.category || 'other'),
          subcategory: facility.subcategory || getSubcategoryFromItemName(facility.itemName || facility.category),
          itemName: facility.itemName || '',
          isAvailable: Boolean(facility.available), // Map 'available' to 'isAvailable' for backend
          quantity: facility.quantity ? Math.max(0, parseInt(facility.quantity.toString())) : null,
          condition: validateCondition(facility.condition),
          notes: sanitizeText(facility.notes || facility.itemNotes || ''),
          specifications: sanitizeText(facility.specifications || ''),
          photoUrl: sanitizeUrl(facility.photoUrl || ''),
          productLink: sanitizeUrl(facility.productLink || ''),
          checkedBy: facility.checkedBy || null,
          lastCheckedAt: facility.lastCheckedAt || null,
        };
        console.log('🏗️ DataMapper: Mapping facility:', facility, '→', mapped);
        return mapped;
      });
      
      console.log('🏭 Facilities mapping - Input:', frontendData.facilities?.length || 0, 'facilities');
      console.log('🏭 Facilities mapping - Output sample:', sanitizedFacilities.slice(0, 2));
      
      return {
        facilities: sanitizedFacilities,
      };
    case 9: // Photo Upload
      return {
        photos: Array.isArray(frontendData.photos) ? frontendData.photos : [],
        bedrooms: Array.isArray(frontendData.bedrooms) ? frontendData.bedrooms : [],
      };
    case 10: // Review & Submit
      return {
        reviewNotes: frontendData.reviewNotes || '',
        agreedToTerms: frontendData.agreedToTerms || false,
      };
    default:
      return frontendData;
  }
}

/**
 * Map backend onboarding data to frontend format for each step
 */
export function mapOnboardingDataFromBackend(step: number, backendData: any) {
  if (!backendData) return {};

  switch (step) {
    case 1: // Villa Information
      return mapVillaDataToFrontend(backendData);
    case 2: // Owner Details - Updated mapping to match new frontend structure
      console.log('🔄 mapOnboardingDataFromBackend - Owner data mapping:');
      console.log('🔄 backendData keys:', Object.keys(backendData));
      console.log('🔄 backendData values:', backendData);
      
      const result = {
        // Owner Type
        ownerType: backendData.ownerType,
        
        // Personal Information - Updated field mappings
        firstName: backendData.firstName,
        lastName: backendData.lastName,
        email: backendData.email,
        phone: backendData.phone,
        phoneCountryCode: backendData.phoneCountryCode,
        phoneDialCode: backendData.phoneDialCode,
        alternativePhone: backendData.alternativePhone,
        alternativePhoneCountryCode: backendData.alternativePhoneCountryCode,
        alternativePhoneDialCode: backendData.alternativePhoneDialCode,
        nationality: backendData.nationality,
        passportNumber: backendData.passportNumber,
        idNumber: backendData.idNumber,
        address: backendData.address,
        city: backendData.city,
        country: backendData.country,
        zipCode: backendData.zipCode,
        
        // Company Information - Updated field mappings
        companyName: backendData.companyName,
        companyAddress: backendData.companyAddress,
        companyTaxId: backendData.companyTaxId,
        companyVat: backendData.companyVat,
        
        // Manager Information - Updated field mappings
        managerName: backendData.managerName,
        managerEmail: backendData.managerEmail,
        managerPhone: backendData.managerPhone,
        managerPhoneCountryCode: backendData.managerPhoneCountryCode,
        managerPhoneDialCode: backendData.managerPhoneDialCode,
        
        // Property Contact Information
        propertyEmail: backendData.propertyEmail,
        propertyWebsite: backendData.propertyWebsite,
        
        // Additional Info
        preferredLanguage: backendData.preferredLanguage,
        communicationPreference: backendData.communicationPreference,
        notes: backendData.notes,
      };
      
      console.log('🔄 mapOnboardingDataFromBackend - Owner mapped result:');
      console.log('🔄 result keys:', Object.keys(result));
      console.log('🔄 result values:', result);
      
      return result;
    case 3: // Contractual Details - Enhanced mapping
      const contractResult = {
        // Contract Dates - Convert ISO dates to YYYY-MM-DD format for HTML date inputs
        contractSignatureDate: backendData.contractStartDate 
          ? new Date(backendData.contractStartDate).toISOString().split('T')[0] : '',
        contractRenewalDate: backendData.contractEndDate 
          ? new Date(backendData.contractEndDate).toISOString().split('T')[0] : '',
        contractStartDate: backendData.contractStartDate 
          ? new Date(backendData.contractStartDate).toISOString().split('T')[0] : '',
        contractEndDate: backendData.contractEndDate 
          ? new Date(backendData.contractEndDate).toISOString().split('T')[0] : '',
        contractType: backendData.contractType || '',
        
        // Commission and Fees - Map backend 'commissionRate' field to frontend 'serviceCharge' field
        serviceCharge: backendData.commissionRate?.toString() || '', // Backend field: commissionRate -> Frontend field: serviceCharge
        managementFee: backendData.managementFee?.toString() || '',
        marketingFee: backendData.marketingFee?.toString() || '',
        
        // Payment Terms
        paymentTerms: backendData.paymentTerms || '',
        paymentSchedule: backendData.paymentSchedule || 'MONTHLY',
        minimumStayNights: backendData.minimumStayNights?.toString() || '1',
        payoutDay1: backendData.payoutDay1?.toString() || '',
        payoutDay2: backendData.payoutDay2?.toString() || '',
        
        // VAT Information - Newly added fields
        vatRegistrationNumber: backendData.vatRegistrationNumber || '',
        dbdNumber: backendData.dbdNumber || '',
        vatPaymentTerms: backendData.vatPaymentTerms || '',
        paymentThroughIPL: backendData.paymentThroughIPL || false,
        
        // Policies
        cancellationPolicy: backendData.cancellationPolicy || 'MODERATE',
        checkInTime: backendData.checkInTime || '15:00',
        checkOutTime: backendData.checkOutTime || '11:00',
        
        // Insurance - Convert date to YYYY-MM-DD format
        insuranceProvider: backendData.insuranceProvider || '',
        insurancePolicyNumber: backendData.insurancePolicyNumber || '',
        insuranceExpiry: backendData.insuranceExpiry 
          ? new Date(backendData.insuranceExpiry).toISOString().split('T')[0] : '',
        
        // Special Terms
        specialTerms: backendData.specialTerms || '',
      };
      
      return contractResult;
      
    case 4: // Bank Details - Fixed frontend field mapping
      console.log('🏦 mapOnboardingDataFromBackend step 4 - Backend input:', backendData);
      const bankDetailsResult = {
        // Map database columns to frontend field names
        accountName: backendData.accountHolderName || '',
        accountHolderName: backendData.accountHolderName || '',
        bankName: backendData.bankName || '',
        bankAccountNumber: backendData.accountNumber || '',
        accountNumber: backendData.accountNumber || '',
        swiftBicCode: backendData.swiftCode || '',
        swiftCode: backendData.swiftCode || '',
        iban: backendData.iban || '',
        bankBranch: backendData.branchName || '',
        branchName: backendData.branchName || '',
        branchCode: backendData.branchCode || '',
        bankAddress: backendData.branchAddress || backendData.bankAddress || '',
        branchAddress: backendData.branchAddress || backendData.bankAddress || '',
        bankCountry: backendData.bankCountry || '',
        currency: backendData.currency || 'IDR',
        accountType: backendData.accountType || 'CHECKING',
        routingNumber: backendData.routingNumber || '',
        taxId: backendData.taxId || '',
        bankNotes: backendData.notes || '',
        notes: backendData.notes || '',
      };
      console.log('🏦 mapOnboardingDataFromBackend step 4 - Frontend result:', bankDetailsResult);
      return bankDetailsResult;
    case 5: // OTA Credentials - Fixed backend data access
      // Convert backend array structure to flat frontend structure
      console.log('🔄 Backend-to-frontend OTA mapping input:', backendData);
      const otaData: any = {};
      const platformMapping: Record<string, string> = {
        'BOOKING_COM': 'bookingCom',
        'AIRBNB': 'airbnb',
        'VRBO': 'vrbo',
        'EXPEDIA': 'expedia',
        'AGODA': 'agoda',
        'HOTELS_COM': 'hotelsCom',
        'TRIPADVISOR': 'tripadvisor',
      };
      
      // Initialize all platforms as not listed
      Object.values(platformMapping).forEach(key => {
        otaData[`${key}Listed`] = false;
        otaData[`${key}Username`] = '';
        otaData[`${key}Password`] = '';
        otaData[`${key}ListingUrl`] = '';
        otaData[`${key}PropertyId`] = '';
        otaData[`${key}ApiKey`] = '';
        otaData[`${key}ApiSecret`] = '';
        otaData[`${key}AccountUrl`] = '';
        otaData[`${key}PropertyUrl`] = '';
      });
      
      // Populate data from backend - backendData is directly the otaCredentials array
      const platforms = Array.isArray(backendData) ? backendData : [];
      console.log('🔄 Processing platforms from backend:', platforms.length, 'platforms');
      platforms.forEach((platform: any) => {
        const key = platformMapping[platform.platform];
        console.log(`🔄 Processing platform ${platform.platform} -> key ${key}:`, {
          isActive: platform.isActive,
          username: platform.username,
          password: platform.password,
          hasData: !!(platform.username || platform.password || platform.propertyId || 
                     platform.apiKey || platform.apiSecret || platform.listingUrl ||
                     platform.accountUrl || platform.propertyUrl)
        });
        if (key) {
          // If platform has any credentials data, show it as listed to make it visible
          const hasCredentials = platform.username || platform.password || platform.propertyId || 
                                 platform.apiKey || platform.apiSecret || platform.listingUrl ||
                                 platform.accountUrl || platform.propertyUrl;
          
          console.log(`🏨 Backend-to-frontend mapping for ${key}:`, {
            platform: platform.platform,
            isActive: platform.isActive,
            hasCredentials,
            willBeListed: platform.isActive || hasCredentials || false,
            fields: {
              username: platform.username || '',
              password: platform.password ? '[HIDDEN]' : '',
              propertyId: platform.propertyId || '',
              apiKey: platform.apiKey ? '[HIDDEN]' : '',
              apiSecret: platform.apiSecret ? '[HIDDEN]' : '',
            }
          });
          
          // Show as listed if either isActive OR has credentials data
          otaData[`${key}Listed`] = platform.isActive || hasCredentials || false;
          otaData[`${key}Username`] = platform.username || '';
          otaData[`${key}Password`] = platform.password || '';
          otaData[`${key}ListingUrl`] = platform.listingUrl || '';
          otaData[`${key}PropertyId`] = platform.propertyId || '';
          otaData[`${key}ApiKey`] = platform.apiKey || '';
          otaData[`${key}ApiSecret`] = platform.apiSecret || '';
          otaData[`${key}AccountUrl`] = platform.accountUrl || '';
          otaData[`${key}PropertyUrl`] = platform.propertyUrl || '';
        }
      });
      
      console.log('🔄 Backend-to-frontend OTA mapping output:', otaData);
      return otaData;
    case 6: // Documents Upload
      return {
        documents: backendData.documents || [],
      };
    case 7: // Staff Configuration - Enhanced mapping  
      console.log('🔄 Processing backend staff data for step 7:', backendData);
      // Handle both direct array and nested staff array
      const staffArray = Array.isArray(backendData) ? backendData : 
                        Array.isArray(backendData.staff) ? backendData.staff : [];
      console.log('🔄 Staff array from backend:', staffArray);
      const mappedStaff = staffArray.map((staff: any) => mapStaffDataToFrontend(staff));
      console.log('🔄 Mapped staff for frontend:', mappedStaff);
      return mappedStaff; // Return array directly for StaffConfiguratorStep
    case 8: // Facilities
      // Enhanced facilities mapping from backend to frontend with category mapping
      // Accept both array input (direct facilities list) and object with facilities property
      const backendFacilities = Array.isArray(backendData)
        ? backendData
        : (backendData.facilities || []);
      const mappedFacilities = backendFacilities.map((facility: any) => ({
        category: mapFacilityCategoryToFrontend(facility.category),
        subcategory: facility.subcategory || '',
        itemName: facility.itemName,
        available: facility.isAvailable || false, // Map 'isAvailable' to 'available' for frontend
        quantity: facility.quantity || 0,
        condition: facility.condition || 'good',
        itemNotes: facility.notes || '',
        notes: facility.notes || '', // Alias for compatibility
        specifications: facility.specifications || '',
        photoUrl: facility.photoUrl || '',
        productLink: facility.productLink || '',
        checkedBy: facility.checkedBy || '',
        lastCheckedAt: facility.lastCheckedAt || null,
        id: facility.id || `${facility.category}-${facility.itemName}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
      }));
      
      console.log('🏭 Facilities reverse mapping - Input:', backendFacilities.length, 'facilities');
      console.log('🏭 Facilities reverse mapping - Output sample:', mappedFacilities.slice(0, 2));
      
      return { facilities: mappedFacilities };
    case 9: // Photos
      // Map backend photo data to frontend format
      const mappedPhotos = (backendData.photos || []).map((photo: any) => {
        // Use the public photo endpoint for better compatibility (no auth required for images)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        const previewUrl = `${API_URL}/api/photos/public/${photo.id}?t=${Date.now()}`;
        
        return {
          id: photo.id,
          file: null, // No file object for loaded photos
          category: mapPhotoCategoryToFrontend(photo.category),
          subfolder: photo.subfolder || undefined,
          preview: previewUrl, // Use public endpoint with cache buster
          uploaded: true, // Already uploaded to backend
          sharePointId: photo.sharePointFileId,
          sharePointPath: photo.sharePointPath,
          fileName: photo.fileName,
          fileUrl: photo.fileUrl,
          thumbnailUrl: photo.thumbnailUrl ? `${API_URL}/api/photos/public/${photo.id}` : undefined,
          isMain: photo.isMain,
          caption: photo.caption,
          altText: photo.altText,
        };
      });
      
      // Handle bedrooms data - it can come from multiple sources
      let bedroomsData = [];
      
      console.log('🛏️ DataMapper: Searching for bedrooms data in:', Object.keys(backendData));
      
      // Priority 1: Direct bedrooms array in backendData
      if (backendData.bedrooms && Array.isArray(backendData.bedrooms)) {
        bedroomsData = backendData.bedrooms;
        console.log('🛏️ DataMapper: Found bedrooms in direct backend data:', bedroomsData);
      }
      // Priority 2: Bedrooms from onboarding progress metadata
      else if (backendData.metadata && backendData.metadata.bedrooms && Array.isArray(backendData.metadata.bedrooms)) {
        bedroomsData = backendData.metadata.bedrooms;
        console.log('🛏️ DataMapper: Found bedrooms in metadata:', bedroomsData);
      }
      // Priority 3: Parse from JSON string in bedrooms field
      else if (typeof backendData.bedrooms === 'string') {
        try {
          bedroomsData = JSON.parse(backendData.bedrooms);
          console.log('🛏️ DataMapper: Parsed bedrooms from JSON string:', bedroomsData);
        } catch (e) {
          console.warn('🛏️ DataMapper: Failed to parse bedrooms JSON:', e, backendData.bedrooms);
          bedroomsData = [];
        }
      }
      // Priority 4: Check fieldProgress data if available (bedrooms field)
      else if (backendData.fieldProgress && typeof backendData.fieldProgress.bedrooms === 'string') {
        try {
          bedroomsData = JSON.parse(backendData.fieldProgress.bedrooms);
          console.log('🛏️ DataMapper: Found bedrooms in field progress:', bedroomsData);
        } catch (e) {
          console.warn('🛏️ DataMapper: Failed to parse bedrooms from field progress:', e);
          bedroomsData = [];
        }
      }
      // Priority 5: Check fieldProgress data if available (bedrooms_config field - backup)
      else if (backendData.fieldProgress && typeof backendData.fieldProgress.bedrooms_config === 'string') {
        try {
          bedroomsData = JSON.parse(backendData.fieldProgress.bedrooms_config);
          console.log('🛏️ DataMapper: Found bedrooms in field progress (bedrooms_config):', bedroomsData);
        } catch (e) {
          console.warn('🛏️ DataMapper: Failed to parse bedrooms_config from field progress:', e);
          bedroomsData = [];
        }
      }
      // Priority 6: Check if bedrooms is nested in villa data (common in onboarding progress)
      else if (backendData.villa && backendData.villa.fieldProgress && typeof backendData.villa.fieldProgress.bedrooms === 'string') {
        try {
          bedroomsData = JSON.parse(backendData.villa.fieldProgress.bedrooms);
          console.log('🛏️ DataMapper: Found bedrooms in villa fieldProgress:', bedroomsData);
        } catch (e) {
          console.warn('🛏️ DataMapper: Failed to parse bedrooms from villa fieldProgress:', e);
          bedroomsData = [];
        }
      }
      
      // Ensure bedrooms is always an array
      if (!Array.isArray(bedroomsData)) {
        console.warn('🛏️ DataMapper: Bedrooms data is not an array, defaulting to empty array');
        bedroomsData = [];
      }
      
      console.log('🛏️ DataMapper: Final bedrooms data for step 9:', bedroomsData);
      
      const finalResult = {
        photos: mappedPhotos,
        bedrooms: bedroomsData,
      };
      
      console.log('🛏️ DataMapper: Final step 9 result:', finalResult);
      console.log('🛏️ DataMapper: Bedrooms count in result:', finalResult.bedrooms.length);
      
      return finalResult;
    case 10: // Review
      return {
        reviewNotes: backendData.reviewNotes || '',
        agreedToTerms: backendData.agreedToTerms || false,
      };
    default:
      return backendData;
  }
}

/**
 * Map backend staff data to frontend schema
 */
export function mapStaffDataToFrontend(backendData: any) {
  console.log('🔄 Mapping backend staff data to frontend:', backendData);
  
  // Parse emergency contacts safely
  let parsedEmergencyContacts = [];
  try {
    if (backendData.emergencyContacts) {
      if (typeof backendData.emergencyContacts === 'string') {
        parsedEmergencyContacts = JSON.parse(backendData.emergencyContacts);
      } else if (Array.isArray(backendData.emergencyContacts)) {
        parsedEmergencyContacts = backendData.emergencyContacts;
      }
    }
  } catch (error) {
    console.warn('Failed to parse emergency contacts:', error);
    parsedEmergencyContacts = [];
  }

  // Ensure at least one empty emergency contact exists
  if (parsedEmergencyContacts.length === 0) {
    parsedEmergencyContacts = [{ firstName: '', lastName: '', phone: '', phoneCountryCode: '', phoneDialCode: '', email: '', relationship: 'OTHER' }];
  }

  const mappedData = {
    // System fields
    id: backendData.id || Math.random().toString(),
    
    // Personal Information
    firstName: backendData.firstName || '',
    lastName: backendData.lastName || '',
    fullName: `${backendData.firstName || ''} ${backendData.lastName || ''}`.trim(),
    nickname: backendData.nickname || '',
    email: backendData.email || '',
    phone: backendData.phone || '',
    phoneCountryCode: backendData.phoneCountryCode || '',
    phoneDialCode: backendData.phoneDialCode || '',
    idCard: backendData.idNumber || '', // Frontend uses idCard field name
    passportNumber: backendData.passportNumber || '',
    nationality: backendData.nationality || '',
    dateOfBirth: backendData.dateOfBirth ? backendData.dateOfBirth.split('T')[0] : '', // Convert ISO to YYYY-MM-DD
    maritalStatus: backendData.maritalStatus === true ? true : 
                   backendData.maritalStatus === false ? false : false,
    
    // Employment Details
    position: getPositionDisplayName(backendData.position || 'OTHER'),
    department: backendData.department || 'MANAGEMENT',
    employmentType: backendData.employmentType || 'FULL_TIME',
    startDate: backendData.startDate ? backendData.startDate.split('T')[0] : '', // Convert ISO to YYYY-MM-DD
    endDate: backendData.endDate ? backendData.endDate.split('T')[0] : '',
    
    // Compensation - Map backend fields to frontend field names
    baseSalary: (backendData.salary || 0).toString(),
    salary: (backendData.salary || 0).toString(),
    salaryFrequency: backendData.salaryFrequency || 'MONTHLY',
    currency: backendData.currency || 'IDR',
    numberOfDaySalary: (backendData.numberOfDaySalary || 0).toString(),
    serviceCharge: (backendData.serviceCharge || 0).toString(),
    foodAllowance: backendData.foodAllowance || false,
    transportation: backendData.transportation || deriveTransportationFromBenefits(backendData.hasTransport),
    totalIncome: (backendData.totalIncome || 0).toString(),
    totalNetIncome: (backendData.totalNetIncome || 0).toString(),
    otherDeduct: (backendData.otherDeductions || 0).toString(),
    
    // Benefits
    hasAccommodation: backendData.hasAccommodation || false,
    hasTransport: backendData.hasTransport || false,
    healthInsurance: backendData.hasHealthInsurance || false,
    workInsurance: backendData.hasWorkInsurance || false,
    
    // Emergency Contacts - Parse from JSON and ensure proper structure
    emergencyContacts: parsedEmergencyContacts,
    
    // Status fields
    isActive: backendData.isActive !== false
  };
  
  console.log('🔄 Mapped staff data for frontend:', mappedData);
  return mappedData;
}

// Helper functions
function generateVillaCode(villaName: string): string {
  const prefix = villaName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix || 'VLA'}-${suffix}`;
}

function parseLatLngFromCoordinates(coordinates: string): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  
  const parts = coordinates.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  // Validate ranges: latitude must be -90 to 90, longitude -180 to 180
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  
  return { lat, lng };
}