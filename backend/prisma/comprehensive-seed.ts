import { PrismaClient } from '@prisma/client';
import {
  PropertyType,
  VillaStatus,
  VillaStyle,
  CommunicationPreference,
  ContractType,
  PaymentSchedule,
  CancellationPolicy,
  StaffPosition,
  StaffDepartment,
  EmploymentType,
  SalaryFrequency,
  DocumentType,
  PhotoCategory,
  OTAPlatform,
  SyncStatus,
  OnboardingStatus,
  FacilityCategory,
  AgreementType,
  AgreementStatus
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate realistic onboarding session data
function getOnboardingSessionData(currentStep: number, status: OnboardingStatus, userEmail: string) {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30) + 1; // Started 1-30 days ago
  const sessionStartedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Calculate session metrics based on current step
  const stepsCompleted = status === OnboardingStatus.COMPLETED ? 10 : Math.max(0, currentStep - 1);
  const totalFields = 45; // Approximate total fields across all steps
  const fieldsPerStep = Math.floor(totalFields / 10);
  const fieldsCompleted = stepsCompleted * fieldsPerStep + Math.floor(Math.random() * fieldsPerStep);
  const fieldsSkipped = Math.floor(Math.random() * 3); // Random skip 0-2 fields
  
  // Time calculations (in minutes)
  const averageStepTime = 8 + Math.floor(Math.random() * 12); // 8-20 minutes per step
  const totalTimeSpent = stepsCompleted * averageStepTime + Math.floor(Math.random() * averageStepTime);
  
  const isCompleted = status === OnboardingStatus.COMPLETED;
  const completionPercentage = Math.round((stepsCompleted / 10) * 100);
  const estimatedTimeRemaining = isCompleted ? 0 : (10 - stepsCompleted) * averageStepTime;
  
  // Determine session end and activity times
  let sessionEndedAt = null;
  let lastActivityAt = sessionStartedAt;
  let completedAt = null;
  let submittedAt = null;
  let submittedForReview = false;
  
  if (isCompleted) {
    const endTime = new Date(sessionStartedAt.getTime() + totalTimeSpent * 60 * 1000);
    sessionEndedAt = endTime;
    lastActivityAt = endTime;
    completedAt = endTime;
    submittedAt = endTime;
    submittedForReview = true;
  } else if (currentStep > 1) {
    // Add some recent activity
    const hoursAgo = Math.floor(Math.random() * 48) + 1; // Last activity 1-48 hours ago
    lastActivityAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    if (currentStep >= 9) {
      submittedForReview = Math.random() > 0.5; // 50% chance of being submitted
      if (submittedForReview) {
        submittedAt = lastActivityAt;
      }
    }
  }
  
  return {
    userEmail,
    sessionStartedAt,
    sessionEndedAt,
    lastActivityAt,
    currentStep,
    stepsCompleted,
    stepsSkipped: Math.floor(Math.random() * 2), // 0-1 steps skipped
    fieldsCompleted,
    fieldsSkipped,
    totalFields,
    isCompleted,
    completedAt,
    submittedForReview,
    submittedAt,
    totalTimeSpent,
    averageStepTime
  };
}

// Comprehensive seed data for M1 Villa Management System
async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // First, clean existing data
  await prisma.$executeRaw`TRUNCATE TABLE "OnboardingSession", "SkippedItem", "StepFieldProgress", "OnboardingStepProgress", "OnboardingProgress", "FacilityChecklist", "Agreement", "Document", "Photo", "Staff", "OTACredentials", "BankDetails", "ContractualDetails", "Owner", "Villa" RESTART IDENTITY CASCADE;`;

  console.log('🗑️ Cleaned existing data');

  // Create 25 villas with varied data
  const villaData = [
    {
      villaCode: 'VIL-001',
      villaName: 'Sunset Paradise Villa',
      location: 'Seminyak Beach',
      address: 'Jl. Sunset Paradise No. 15',
      city: 'Seminyak',
      country: 'Indonesia',
      zipCode: '80361',
      latitude: -8.6918,
      longitude: 115.1619,
      bedrooms: 4,
      bathrooms: 5,
      maxGuests: 8,
      propertySize: 450.5,
      plotSize: 800.0,
      yearBuilt: 2018,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.BALINESE,
      status: VillaStatus.ACTIVE,
      description: 'Stunning beachfront villa with private pool and tropical gardens',
      shortDescription: 'Luxury beachfront villa in Seminyak',
      tags: ['beachfront', 'pool', 'tropical', 'luxury']
    },
    {
      villaCode: 'VIL-002',
      villaName: 'Ocean Breeze Estate',
      location: 'Mykonos Town',
      address: 'Elia Beach Road 42',
      city: 'Mykonos',
      country: 'Greece',
      zipCode: '84600',
      latitude: 37.4467,
      longitude: 25.3289,
      bedrooms: 6,
      bathrooms: 7,
      maxGuests: 12,
      propertySize: 650.0,
      plotSize: 1200.0,
      yearBuilt: 2020,
      renovationYear: 2023,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.MEDITERRANEAN,
      status: VillaStatus.ACTIVE,
      description: 'Spectacular hillside villa with panoramic Aegean Sea views',
      shortDescription: 'Mediterranean villa with sea views',
      tags: ['sea-view', 'hillside', 'mediterranean', 'panoramic']
    },
    {
      villaCode: 'VIL-003',
      villaName: 'Mountain View Retreat',
      location: 'Val d\'Orcia',
      address: 'Via della Pace 23',
      city: 'Pienza',
      country: 'Italy',
      zipCode: '53026',
      latitude: 43.0762,
      longitude: 11.6773,
      bedrooms: 3,
      bathrooms: 4,
      maxGuests: 6,
      propertySize: 320.0,
      plotSize: 600.0,
      yearBuilt: 1890,
      renovationYear: 2021,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.TRADITIONAL,
      status: VillaStatus.PENDING_REVIEW,
      description: 'Charming stone villa in the heart of Tuscan countryside',
      shortDescription: 'Traditional Tuscan stone villa',
      tags: ['countryside', 'stone', 'traditional', 'tuscany']
    },
    {
      villaCode: 'VIL-004',
      villaName: 'Azure Coast Mansion',
      location: 'Costa del Sol',
      address: 'Avenida del Mar 88',
      city: 'Marbella',
      country: 'Spain',
      zipCode: '29600',
      latitude: 36.5108,
      longitude: -4.8822,
      bedrooms: 8,
      bathrooms: 10,
      maxGuests: 16,
      propertySize: 850.0,
      plotSize: 2000.0,
      yearBuilt: 2019,
      propertyType: PropertyType.ESTATE,
      villaStyle: VillaStyle.LUXURY,
      status: VillaStatus.INACTIVE,
      description: 'Magnificent luxury mansion with private beach access',
      shortDescription: 'Ultra-luxury mansion on Costa del Sol',
      tags: ['beach-access', 'mansion', 'luxury', 'private']
    },
    {
      villaCode: 'VIL-005',
      villaName: 'Tropical Garden Villa',
      location: 'Kata Beach',
      address: '125 Patak Road',
      city: 'Phuket',
      country: 'Thailand',
      zipCode: '83100',
      latitude: 7.8167,
      longitude: 98.3000,
      bedrooms: 5,
      bathrooms: 6,
      maxGuests: 10,
      propertySize: 520.0,
      plotSize: 900.0,
      yearBuilt: 2017,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Modern tropical villa surrounded by lush gardens',
      shortDescription: 'Contemporary tropical villa',
      tags: ['tropical', 'garden', 'modern', 'lush']
    },
    {
      villaCode: 'VIL-006',
      villaName: 'Alpine Chalet Luxury',
      location: 'Verbier',
      address: 'Route des Creux 7',
      city: 'Bagnes',
      country: 'Switzerland',
      zipCode: '1936',
      latitude: 46.0963,
      longitude: 7.2286,
      bedrooms: 7,
      bathrooms: 8,
      maxGuests: 14,
      propertySize: 680.0,
      plotSize: 1500.0,
      yearBuilt: 2016,
      renovationYear: 2022,
      propertyType: PropertyType.CHALET,
      villaStyle: VillaStyle.LUXURY,
      status: VillaStatus.DRAFT,
      description: 'Exquisite alpine chalet with ski-in/ski-out access',
      shortDescription: 'Luxury alpine chalet in Verbier',
      tags: ['ski-access', 'alpine', 'chalet', 'mountain-view']
    },
    {
      villaCode: 'VIL-007',
      villaName: 'Coastal Harmony House',
      location: 'Byron Bay',
      address: '33 Lighthouse Road',
      city: 'Byron Bay',
      country: 'Australia',
      zipCode: '2481',
      latitude: -28.6474,
      longitude: 153.6020,
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      propertySize: 380.0,
      plotSize: 750.0,
      yearBuilt: 2019,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Sustainable beachside villa with solar panels and rainwater collection',
      shortDescription: 'Eco-friendly coastal villa',
      tags: ['sustainable', 'eco-friendly', 'coastal', 'solar']
    },
    {
      villaCode: 'VIL-008',
      villaName: 'Desert Oasis Resort',
      location: 'Palm Desert',
      address: '7890 Desert Willow Drive',
      city: 'Palm Desert',
      country: 'United States',
      zipCode: '92260',
      latitude: 33.7581,
      longitude: -116.3739,
      bedrooms: 6,
      bathrooms: 7,
      maxGuests: 12,
      propertySize: 580.0,
      plotSize: 1100.0,
      yearBuilt: 2020,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Modern desert retreat with infinity pool and mountain views',
      shortDescription: 'Contemporary desert villa',
      tags: ['desert', 'infinity-pool', 'mountain-view', 'modern']
    },
    {
      villaCode: 'VIL-009',
      villaName: 'Caribbean Paradise',
      location: 'Grace Bay',
      address: 'Conch Bar Road 156',
      city: 'Providenciales',
      country: 'Turks and Caicos',
      zipCode: 'TKCA 1ZZ',
      latitude: 21.7869,
      longitude: -72.2692,
      bedrooms: 5,
      bathrooms: 6,
      maxGuests: 10,
      propertySize: 480.0,
      plotSize: 850.0,
      yearBuilt: 2021,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Stunning beachfront villa on world-famous Grace Bay Beach',
      shortDescription: 'Beachfront villa on Grace Bay',
      tags: ['beachfront', 'caribbean', 'turquoise-water', 'paradise']
    },
    {
      villaCode: 'VIL-010',
      villaName: 'Scottish Highland Castle',
      location: 'Loch Katrine',
      address: 'Castle Road 1',
      city: 'Callander',
      country: 'Scotland',
      zipCode: 'FK17 8HZ',
      latitude: 56.2369,
      longitude: -4.5775,
      bedrooms: 9,
      bathrooms: 11,
      maxGuests: 18,
      propertySize: 1200.0,
      plotSize: 5000.0,
      yearBuilt: 1847,
      renovationYear: 2020,
      propertyType: PropertyType.ESTATE,
      villaStyle: VillaStyle.TRADITIONAL,
      status: VillaStatus.APPROVED,
      description: 'Historic castle estate with loch views and highland surroundings',
      shortDescription: 'Historic Highland castle estate',
      tags: ['castle', 'historic', 'loch-view', 'highland']
    },
    // Additional 15 villas for comprehensive testing
    {
      villaCode: 'VIL-011',
      villaName: 'Santorini Sunset Villa',
      location: 'Oia',
      address: 'Sunset Terrace 22',
      city: 'Santorini',
      country: 'Greece',
      zipCode: '84702',
      latitude: 36.4618,
      longitude: 25.3753,
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 6,
      propertySize: 280.0,
      plotSize: 400.0,
      yearBuilt: 2019,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.MEDITERRANEAN,
      status: VillaStatus.ACTIVE,
      description: 'Clifftop villa with iconic Santorini sunset views',
      shortDescription: 'Clifftop villa with sunset views',
      tags: ['clifftop', 'sunset', 'iconic', 'whitewashed']
    },
    {
      villaCode: 'VIL-012',
      villaName: 'Tokyo Modern Penthouse',
      location: 'Shibuya',
      address: '1-23-45 Shibuya',
      city: 'Tokyo',
      country: 'Japan',
      zipCode: '150-0002',
      latitude: 35.6598,
      longitude: 139.7006,
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      propertySize: 350.0,
      plotSize: null,
      yearBuilt: 2022,
      propertyType: PropertyType.PENTHOUSE,
      villaStyle: VillaStyle.MINIMALIST,
      status: VillaStatus.PENDING_REVIEW,
      description: 'Ultra-modern penthouse in the heart of Tokyo',
      shortDescription: 'Modern Tokyo penthouse',
      tags: ['city-center', 'modern', 'minimalist', 'skyline']
    },
    {
      villaCode: 'VIL-013',
      villaName: 'Moroccan Riad Luxury',
      location: 'Marrakech Medina',
      address: 'Rue Riad Zitoun Jdid 87',
      city: 'Marrakech',
      country: 'Morocco',
      zipCode: '40000',
      latitude: 31.6295,
      longitude: -7.9811,
      bedrooms: 6,
      bathrooms: 8,
      maxGuests: 12,
      propertySize: 520.0,
      plotSize: 800.0,
      yearBuilt: 1650,
      renovationYear: 2021,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.TRADITIONAL,
      status: VillaStatus.ACTIVE,
      description: 'Authentic restored riad with traditional Moroccan architecture',
      shortDescription: 'Traditional Moroccan riad',
      tags: ['riad', 'traditional', 'courtyard', 'authentic']
    },
    {
      villaCode: 'VIL-014',
      villaName: 'Aspen Ski Lodge',
      location: 'Snowmass',
      address: '456 Powder Bowl Road',
      city: 'Aspen',
      country: 'United States',
      zipCode: '81615',
      latitude: 39.2130,
      longitude: -106.9478,
      bedrooms: 8,
      bathrooms: 9,
      maxGuests: 16,
      propertySize: 720.0,
      plotSize: 1800.0,
      yearBuilt: 2018,
      propertyType: PropertyType.CHALET,
      villaStyle: VillaStyle.RUSTIC,
      status: VillaStatus.ACTIVE,
      description: 'Luxurious ski lodge with direct slope access and mountain views',
      shortDescription: 'Luxury ski lodge in Aspen',
      tags: ['ski-lodge', 'slope-access', 'rustic-luxury', 'mountain']
    },
    {
      villaCode: 'VIL-015',
      villaName: 'Bali Rice Terrace Villa',
      location: 'Ubud',
      address: 'Jl. Raya Tegallalang 34',
      city: 'Ubud',
      country: 'Indonesia',
      zipCode: '80571',
      latitude: -8.4095,
      longitude: 115.2890,
      bedrooms: 3,
      bathrooms: 4,
      maxGuests: 6,
      propertySize: 220.0,
      plotSize: 500.0,
      yearBuilt: 2020,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.BALINESE,
      status: VillaStatus.APPROVED,
      description: 'Serene villa overlooking famous Tegallalang rice terraces',
      shortDescription: 'Villa with rice terrace views',
      tags: ['rice-terraces', 'serene', 'cultural', 'nature']
    },
    {
      villaCode: 'VIL-016',
      villaName: 'Maldivian Overwater Villa',
      location: 'North Malé Atoll',
      address: 'Overwater Bungalow 12',
      city: 'Malé',
      country: 'Maldives',
      zipCode: '20026',
      latitude: 4.2105,
      longitude: 73.2207,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      propertySize: 180.0,
      plotSize: null,
      yearBuilt: 2021,
      propertyType: PropertyType.BUNGALOW,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Romantic overwater villa with direct lagoon access',
      shortDescription: 'Overwater villa in Maldives',
      tags: ['overwater', 'lagoon', 'romantic', 'tropical']
    },
    {
      villaCode: 'VIL-017',
      villaName: 'French Château Elegance',
      location: 'Loire Valley',
      address: 'Château de la Rose 1',
      city: 'Amboise',
      country: 'France',
      zipCode: '37400',
      latitude: 47.4130,
      longitude: 0.9831,
      bedrooms: 10,
      bathrooms: 12,
      maxGuests: 20,
      propertySize: 1500.0,
      plotSize: 10000.0,
      yearBuilt: 1580,
      renovationYear: 2019,
      propertyType: PropertyType.ESTATE,
      villaStyle: VillaStyle.TRADITIONAL,
      status: VillaStatus.ACTIVE,
      description: 'Magnificent Renaissance château with vineyard and gardens',
      shortDescription: 'Renaissance château in Loire Valley',
      tags: ['château', 'renaissance', 'vineyard', 'gardens']
    },
    {
      villaCode: 'VIL-018',
      villaName: 'Cape Town Wine Estate',
      location: 'Constantia',
      address: 'Wine Estate Road 78',
      city: 'Cape Town',
      country: 'South Africa',
      zipCode: '7806',
      latitude: -34.0305,
      longitude: 18.4207,
      bedrooms: 6,
      bathrooms: 7,
      maxGuests: 12,
      propertySize: 600.0,
      plotSize: 2500.0,
      yearBuilt: 2017,
      propertyType: PropertyType.ESTATE,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Contemporary wine estate with mountain and ocean views',
      shortDescription: 'Wine estate with mountain views',
      tags: ['wine-estate', 'mountain-view', 'contemporary', 'vineyard']
    },
    {
      villaCode: 'VIL-019',
      villaName: 'Costa Rican Eco Lodge',
      location: 'Manuel Antonio',
      address: 'Parque Nacional 45',
      city: 'Manuel Antonio',
      country: 'Costa Rica',
      zipCode: '60601',
      latitude: 9.3937,
      longitude: -84.1500,
      bedrooms: 4,
      bathrooms: 5,
      maxGuests: 8,
      propertySize: 320.0,
      plotSize: 1200.0,
      yearBuilt: 2020,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Sustainable eco-lodge in tropical rainforest setting',
      shortDescription: 'Eco-lodge in rainforest',
      tags: ['eco-lodge', 'rainforest', 'sustainable', 'wildlife']
    },
    {
      villaCode: 'VIL-020',
      villaName: 'Dubai Desert Palace',
      location: 'Al Maha Desert',
      address: 'Desert Conservation Reserve',
      city: 'Dubai',
      country: 'UAE',
      zipCode: '00000',
      latitude: 24.9526,
      longitude: 55.6044,
      bedrooms: 7,
      bathrooms: 9,
      maxGuests: 14,
      propertySize: 800.0,
      plotSize: 3000.0,
      yearBuilt: 2019,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.LUXURY,
      status: VillaStatus.ACTIVE,
      description: 'Opulent desert palace with private oasis and camel stables',
      shortDescription: 'Luxury desert palace',
      tags: ['desert', 'oasis', 'luxury', 'unique']
    },
    {
      villaCode: 'VIL-021',
      villaName: 'Norwegian Fjord Cabin',
      location: 'Geirangerfjord',
      address: 'Fjord View 12',
      city: 'Geiranger',
      country: 'Norway',
      zipCode: '6216',
      latitude: 62.1049,
      longitude: 7.2062,
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      propertySize: 250.0,
      plotSize: 800.0,
      yearBuilt: 2021,
      propertyType: PropertyType.CHALET,
      villaStyle: VillaStyle.MINIMALIST,
      status: VillaStatus.APPROVED,
      description: 'Modern cabin with dramatic fjord and waterfall views',
      shortDescription: 'Modern fjord cabin',
      tags: ['fjord', 'waterfall-view', 'scandinavian', 'nature']
    },
    {
      villaCode: 'VIL-022',
      villaName: 'Patagonian Wilderness Lodge',
      location: 'Torres del Paine',
      address: 'Estancia Road KM 15',
      city: 'Puerto Natales',
      country: 'Chile',
      zipCode: '6160000',
      latitude: -51.0781,
      longitude: -72.6094,
      bedrooms: 8,
      bathrooms: 6,
      maxGuests: 16,
      propertySize: 450.0,
      plotSize: 5000.0,
      yearBuilt: 2018,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.RUSTIC,
      status: VillaStatus.ACTIVE,
      description: 'Remote wilderness lodge with panoramic mountain views',
      shortDescription: 'Wilderness lodge in Patagonia',
      tags: ['wilderness', 'remote', 'mountain-view', 'adventure']
    },
    {
      villaCode: 'VIL-023',
      villaName: 'Icelandic Northern Lights Retreat',
      location: 'Thingvellir',
      address: 'Golden Circle 89',
      city: 'Selfoss',
      country: 'Iceland',
      zipCode: '801',
      latitude: 64.2554,
      longitude: -21.1318,
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 6,
      propertySize: 200.0,
      plotSize: 1500.0,
      yearBuilt: 2020,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.ACTIVE,
      description: 'Glass-walled retreat perfect for viewing Northern Lights',
      shortDescription: 'Northern Lights viewing retreat',
      tags: ['northern-lights', 'glass-walls', 'unique', 'aurora']
    },
    {
      villaCode: 'VIL-024',
      villaName: 'New Zealand Hobbiton Villa',
      location: 'Matamata',
      address: '501 Buckland Road',
      city: 'Matamata',
      country: 'New Zealand',
      zipCode: '3400',
      latitude: -37.8667,
      longitude: 175.6833,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      propertySize: 120.0,
      plotSize: 300.0,
      yearBuilt: 2019,
      propertyType: PropertyType.BUNGALOW,
      villaStyle: VillaStyle.RUSTIC,
      status: VillaStatus.DRAFT,
      description: 'Hobbit-hole inspired earth house with round doors and windows',
      shortDescription: 'Hobbit-hole inspired villa',
      tags: ['hobbit-hole', 'earth-house', 'unique', 'fantasy']
    },
    {
      villaCode: 'VIL-025',
      villaName: 'Antarctic Research Station Villa',
      location: 'King George Island',
      address: 'Research Base Alpha',
      city: 'Antarctic Peninsula',
      country: 'Antarctica',
      zipCode: '00000',
      latitude: -62.2333,
      longitude: -58.7167,
      bedrooms: 6,
      bathrooms: 4,
      maxGuests: 12,
      propertySize: 300.0,
      plotSize: null,
      yearBuilt: 2022,
      propertyType: PropertyType.VILLA,
      villaStyle: VillaStyle.CONTEMPORARY,
      status: VillaStatus.INACTIVE,
      description: 'Unique polar research station converted to luxury accommodation',
      shortDescription: 'Antarctic research station villa',
      tags: ['antarctic', 'research-station', 'extreme', 'unique']
    }
  ];

  // Create villas and related data
  for (let i = 0; i < villaData.length; i++) {
    const villa = villaData[i];
    console.log(`Creating villa ${i + 1}/25: ${villa.villaName}`);

    const createdVilla = await prisma.villa.create({
      data: villa
    });

    // Create owner for each villa
    const ownerNames = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@email.com' },
      { firstName: 'Michael', lastName: 'Wilson', email: 'michael.wilson@email.com' },
      { firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@email.com' },
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@email.com' },
      { firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.anderson@email.com' },
      { firstName: 'James', lastName: 'Taylor', email: 'james.taylor@email.com' },
      { firstName: 'Jennifer', lastName: 'Moore', email: 'jennifer.moore@email.com' },
      { firstName: 'Robert', lastName: 'Jackson', email: 'robert.jackson@email.com' },
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@email.com' },
      { firstName: 'William', lastName: 'Martinez', email: 'william.martinez@email.com' },
      { firstName: 'Patricia', lastName: 'Rodriguez', email: 'patricia.rodriguez@email.com' },
      { firstName: 'Richard', lastName: 'Lewis', email: 'richard.lewis@email.com' },
      { firstName: 'Linda', lastName: 'Walker', email: 'linda.walker@email.com' },
      { firstName: 'Joseph', lastName: 'Hall', email: 'joseph.hall@email.com' },
      { firstName: 'Susan', lastName: 'Allen', email: 'susan.allen@email.com' },
      { firstName: 'Christopher', lastName: 'Young', email: 'christopher.young@email.com' },
      { firstName: 'Karen', lastName: 'King', email: 'karen.king@email.com' },
      { firstName: 'Daniel', lastName: 'Wright', email: 'daniel.wright@email.com' },
      { firstName: 'Nancy', lastName: 'Lopez', email: 'nancy.lopez@email.com' },
      { firstName: 'Matthew', lastName: 'Hill', email: 'matthew.hill@email.com' },
      { firstName: 'Betty', lastName: 'Scott', email: 'betty.scott@email.com' },
      { firstName: 'Anthony', lastName: 'Green', email: 'anthony.green@email.com' },
      { firstName: 'Helen', lastName: 'Adams', email: 'helen.adams@email.com' },
      { firstName: 'Mark', lastName: 'Baker', email: 'mark.baker@email.com' }
    ];

    const owner = ownerNames[i % ownerNames.length];
    
    const createdOwner = await prisma.owner.create({
      data: {
        villaId: createdVilla.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: `+${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}`,
        alternativePhone: Math.random() > 0.7 ? `+${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}` : null,
        nationality: ['American', 'British', 'German', 'French', 'Italian', 'Spanish', 'Canadian', 'Australian'][Math.floor(Math.random() * 8)],
        address: `${Math.floor(Math.random() * 999 + 1)} ${['Oak Street', 'Main Avenue', 'Park Road', 'First Street', 'Second Avenue'][Math.floor(Math.random() * 5)]}`,
        city: villa.city,
        country: villa.country,
        zipCode: villa.zipCode || '00000',
        communicationPreference: [CommunicationPreference.EMAIL, CommunicationPreference.PHONE, CommunicationPreference.WHATSAPP][Math.floor(Math.random() * 3)]
      }
    });

    // Create contractual details
    await prisma.contractualDetails.create({
      data: {
        villaId: createdVilla.id,
        contractStartDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        contractEndDate: new Date(2027, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        contractType: [ContractType.EXCLUSIVE, ContractType.NON_EXCLUSIVE, ContractType.SEASONAL][Math.floor(Math.random() * 3)],
        commissionRate: Math.floor(Math.random() * 15 + 10), // 10-25%
        managementFee: Math.floor(Math.random() * 8 + 3), // 3-10%
        paymentSchedule: [PaymentSchedule.MONTHLY, PaymentSchedule.QUARTERLY][Math.floor(Math.random() * 2)],
        minimumStayNights: [3, 5, 7][Math.floor(Math.random() * 3)],
        cancellationPolicy: [CancellationPolicy.FLEXIBLE, CancellationPolicy.MODERATE, CancellationPolicy.STRICT][Math.floor(Math.random() * 3)],
        checkInTime: ['14:00', '15:00', '16:00'][Math.floor(Math.random() * 3)],
        checkOutTime: ['10:00', '11:00', '12:00'][Math.floor(Math.random() * 3)]
      }
    });

    // Create bank details
    await prisma.bankDetails.create({
      data: {
        villaId: createdVilla.id,
        accountHolderName: `${owner.firstName} ${owner.lastName}`,
        bankName: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'HSBC', 'Barclays'][Math.floor(Math.random() * 6)],
        accountNumber: `****${Math.floor(Math.random() * 9000 + 1000)}`, // Masked for security
        iban: villa.country === 'United States' ? null : `${villa.country.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 90000000000000000000 + 10000000000000000000)}`,
        currency: villa.country === 'United States' ? 'USD' : ['EUR', 'GBP', 'CHF', 'AUD'][Math.floor(Math.random() * 4)],
        isVerified: Math.random() > 0.3
      }
    });

    // Create 2-5 staff members per villa
    const staffCount = Math.floor(Math.random() * 4) + 2;
    const positions = [StaffPosition.VILLA_MANAGER, StaffPosition.HOUSEKEEPER, StaffPosition.GARDENER, StaffPosition.POOL_MAINTENANCE, StaffPosition.SECURITY, StaffPosition.CHEF];
    const departments = [StaffDepartment.MANAGEMENT, StaffDepartment.HOUSEKEEPING, StaffDepartment.MAINTENANCE, StaffDepartment.HOSPITALITY];
    const staffNames = ['Ana Martinez', 'Carlos Rodriguez', 'Maria Santos', 'João Silva', 'Pierre Dubois', 'Hans Mueller', 'Yuki Tanaka', 'Priya Patel'];

    for (let s = 0; s < staffCount; s++) {
      const staffName = staffNames[Math.floor(Math.random() * staffNames.length)].split(' ');
      const position = positions[s % positions.length];
      
      await prisma.staff.create({
        data: {
          villaId: createdVilla.id,
          firstName: staffName[0],
          lastName: staffName[1],
          email: Math.random() > 0.3 ? `${staffName[0].toLowerCase()}.${staffName[1].toLowerCase()}@email.com` : null,
          phone: `+${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}`,
          position: position,
          department: position === StaffPosition.VILLA_MANAGER ? StaffDepartment.MANAGEMENT :
                      position === StaffPosition.HOUSEKEEPER ? StaffDepartment.HOUSEKEEPING :
                      position === StaffPosition.CHEF ? StaffDepartment.HOSPITALITY :
                      StaffDepartment.MAINTENANCE,
          employmentType: [EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT][Math.floor(Math.random() * 3)],
          startDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          salary: Math.floor(Math.random() * 3000 + 1500), // $1500-4500
          salaryFrequency: SalaryFrequency.MONTHLY,
          currency: villa.country === 'United States' ? 'USD' : 'EUR',
          hasAccommodation: Math.random() > 0.6,
          hasMeals: Math.random() > 0.4,
          hasTransport: Math.random() > 0.7,
          hasHealthInsurance: Math.random() > 0.5
        }
      });
    }

    // Create 3-8 documents per villa
    const docCount = Math.floor(Math.random() * 6) + 3;
    const docTypes = [DocumentType.PROPERTY_CONTRACT, DocumentType.INSURANCE_CERTIFICATE, DocumentType.PROPERTY_TITLE, DocumentType.TAX_DOCUMENTS, DocumentType.INVENTORY_LIST, DocumentType.HOUSE_RULES];

    for (let d = 0; d < docCount; d++) {
      const docType = docTypes[d % docTypes.length];
      
      await prisma.document.create({
        data: {
          villaId: createdVilla.id,
          documentType: docType,
          fileName: `${docType.toLowerCase().replace('_', '-')}-${villa.villaCode.toLowerCase()}.pdf`,
          fileUrl: `https://storage.m1villamanagement.com/documents/${villa.villaCode}/${docType.toLowerCase().replace('_', '-')}-${villa.villaCode.toLowerCase()}.pdf`,
          fileSize: Math.floor(Math.random() * 5000000 + 100000), // 100KB to 5MB
          mimeType: 'application/pdf',
          description: `${docType.replace('_', ' ')} for ${villa.villaName}`,
          validFrom: Math.random() > 0.5 ? new Date(2024, 0, 1) : null,
          validUntil: Math.random() > 0.5 ? new Date(2026, 11, 31) : null
        }
      });
    }

    // Create 5-12 photos per villa
    const photoCount = Math.floor(Math.random() * 8) + 5;
    const photoCategories = [PhotoCategory.EXTERIOR_VIEWS, PhotoCategory.INTERIOR_LIVING_SPACES, PhotoCategory.BEDROOMS, PhotoCategory.BATHROOMS, PhotoCategory.POOL_OUTDOOR_AREAS, PhotoCategory.KITCHEN];

    for (let p = 0; p < photoCount; p++) {
      const category = photoCategories[p % photoCategories.length];
      
      await prisma.photo.create({
        data: {
          villaId: createdVilla.id,
          category: category,
          fileName: `${category.toLowerCase()}-${p + 1}-${villa.villaCode.toLowerCase()}.jpg`,
          fileUrl: `https://storage.m1villamanagement.com/photos/${villa.villaCode}/${category.toLowerCase()}-${p + 1}.jpg`,
          thumbnailUrl: `https://storage.m1villamanagement.com/photos/${villa.villaCode}/thumbs/${category.toLowerCase()}-${p + 1}-thumb.jpg`,
          fileSize: Math.floor(Math.random() * 3000000 + 500000), // 500KB to 3MB
          mimeType: 'image/jpeg',
          width: Math.floor(Math.random() * 2000 + 1200),
          height: Math.floor(Math.random() * 1500 + 800),
          caption: `Beautiful ${category.toLowerCase().replace('_', ' ')} of ${villa.villaName}`,
          isMain: p === 0, // First photo is main
          sortOrder: p
        }
      });
    }

    // Create OTA credentials (1-3 platforms per villa)
    const otaCount = Math.floor(Math.random() * 3) + 1;
    const otaPlatforms = [OTAPlatform.BOOKING_COM, OTAPlatform.AIRBNB, OTAPlatform.VRBO, OTAPlatform.EXPEDIA];

    for (let o = 0; o < otaCount; o++) {
      const platform = otaPlatforms[o % otaPlatforms.length];
      
      await prisma.oTACredentials.create({
        data: {
          villaId: createdVilla.id,
          platform: platform,
          propertyId: `${platform}_${villa.villaCode}_${Math.floor(Math.random() * 999999)}`,
          isActive: Math.random() > 0.2,
          syncStatus: [SyncStatus.SUCCESS, SyncStatus.PENDING, SyncStatus.FAILED][Math.floor(Math.random() * 3)],
          lastSyncAt: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) : null // Within last 7 days
        }
      });
    }

    // Create onboarding progress
    const progressStates = [
      { step: 10, status: OnboardingStatus.COMPLETED, allComplete: true },
      { step: 8, status: OnboardingStatus.IN_PROGRESS, allComplete: false },
      { step: 6, status: OnboardingStatus.IN_PROGRESS, allComplete: false },
      { step: 4, status: OnboardingStatus.IN_PROGRESS, allComplete: false },
      { step: 2, status: OnboardingStatus.IN_PROGRESS, allComplete: false }
    ];

    const progress = villa.status === VillaStatus.ACTIVE ? progressStates[0] : progressStates[Math.floor(Math.random() * progressStates.length)];

    await prisma.onboardingProgress.create({
      data: {
        villaId: createdVilla.id,
        currentStep: progress.step,
        totalSteps: 10,
        villaInfoCompleted: progress.step >= 1,
        ownerDetailsCompleted: progress.step >= 2,
        contractualDetailsCompleted: progress.step >= 3,
        bankDetailsCompleted: progress.step >= 4,
        otaCredentialsCompleted: progress.step >= 5,
        staffConfigCompleted: progress.step >= 6,
        facilitiesCompleted: progress.step >= 7,
        photosUploaded: progress.step >= 8,
        documentsUploaded: progress.step >= 9,
        reviewCompleted: progress.step >= 10,
        submittedAt: progress.step >= 9 ? new Date() : null,
        approvedAt: progress.status === OnboardingStatus.COMPLETED ? new Date() : null,
        status: progress.status
      }
    });

    // Create OnboardingSession for tracking user progress
    const sessionData = getOnboardingSessionData(progress.step, progress.status, createdOwner.email || `owner${i + 1}@example.com`);
    
    await prisma.onboardingSession.create({
      data: {
        villaId: createdVilla.id,
        userId: `user-${i + 1}`,
        userEmail: sessionData.userEmail,
        sessionStartedAt: sessionData.sessionStartedAt,
        sessionEndedAt: sessionData.sessionEndedAt,
        lastActivityAt: sessionData.lastActivityAt,
        currentStep: sessionData.currentStep,
        totalSteps: 10,
        stepsCompleted: sessionData.stepsCompleted,
        stepsSkipped: sessionData.stepsSkipped,
        fieldsCompleted: sessionData.fieldsCompleted,
        fieldsSkipped: sessionData.fieldsSkipped,
        totalFields: sessionData.totalFields,
        isCompleted: sessionData.isCompleted,
        completedAt: sessionData.completedAt,
        submittedForReview: sessionData.submittedForReview,
        submittedAt: sessionData.submittedAt,
        totalTimeSpent: sessionData.totalTimeSpent,
        averageStepTime: sessionData.averageStepTime,
      }
    });
  }

  console.log('✅ Comprehensive seeding completed successfully!');
  console.log(`📊 Created ${villaData.length} villas with complete data:`);
  console.log('   - Owners and contact information');
  console.log('   - Contractual and bank details');
  console.log('   - Staff assignments (2-5 per villa)');
  console.log('   - Documents (3-8 per villa)');
  console.log('   - Photos (5-12 per villa)');
  console.log('   - OTA platform credentials');
  console.log('   - Onboarding progress tracking');
  console.log('   - Onboarding session analytics (different stages)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });