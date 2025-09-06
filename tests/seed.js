// Villa Management System - Seed Data Script
// Total Records: 50 distributed across all models

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting villa management system seed...');

  // Clear existing data (optional - uncomment if needed)
  // await prisma.stepFieldProgress.deleteMany();
  // await prisma.onboardingStepProgress.deleteMany();
  // await prisma.skippedItem.deleteMany();
  // await prisma.onboardingSession.deleteMany();
  // await prisma.onboardingProgress.deleteMany();
  // await prisma.facilityChecklist.deleteMany();
  // await prisma.agreement.deleteMany();
  // await prisma.document.deleteMany();
  // await prisma.photo.deleteMany();
  // await prisma.staff.deleteMany();
  // await prisma.otaCredentials.deleteMany();
  // await prisma.bankDetails.deleteMany();
  // await prisma.contractualDetails.deleteMany();
  // await prisma.owner.deleteMany();
  // await prisma.villa.deleteMany();

  // 1. Create 5 Villas (Records 1-5)
  const villas = await Promise.all([
    prisma.villa.create({
      data: {
        villaCode: 'VIL001',
        villaName: 'Villa Serenity',
        location: 'Seminyak',
        address: 'Jl. Petitenget No. 15',
        city: 'Badung',
        country: 'Indonesia',
        zipCode: '80361',
        latitude: -8.6905,
        longitude: 115.1656,
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 8,
        propertySize: 350.5,
        plotSize: 500.0,
        yearBuilt: 2018,
        renovationYear: 2022,
        propertyType: 'VILLA',
        villaStyle: 'BALINESE',
        description: 'A stunning 4-bedroom villa with traditional Balinese architecture, featuring a private pool and lush tropical gardens.',
        shortDescription: 'Luxury Balinese villa with pool and gardens',
        tags: ['pool', 'garden', 'traditional', 'seminyak'],
        status: 'ACTIVE',
        isActive: true,
        sharePointPath: '/villas/serenity',
        documentsPath: '/documents/vil001',
        photosPath: '/photos/vil001',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01')
      }
    }),
    
    prisma.villa.create({
      data: {
        villaCode: 'VIL002',
        villaName: 'Ocean Breeze Villa',
        location: 'Canggu',
        address: 'Jl. Pantai Berawa No. 88',
        city: 'Badung',
        country: 'Indonesia',
        zipCode: '80351',
        latitude: -8.6482,
        longitude: 115.1374,
        bedrooms: 5,
        bathrooms: 4,
        maxGuests: 10,
        propertySize: 450.0,
        plotSize: 600.0,
        yearBuilt: 2020,
        propertyType: 'VILLA',
        villaStyle: 'MODERN',
        description: 'Contemporary 5-bedroom villa steps from Berawa Beach with panoramic ocean views and modern amenities.',
        shortDescription: 'Modern beachfront villa with ocean views',
        tags: ['beachfront', 'modern', 'ocean-view', 'canggu'],
        status: 'ACTIVE',
        isActive: true,
        sharePointPath: '/villas/ocean-breeze',
        documentsPath: '/documents/vil002',
        photosPath: '/photos/vil002',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-05')
      }
    }),

    prisma.villa.create({
      data: {
        villaCode: 'VIL003',
        villaName: 'Jungle Retreat',
        location: 'Ubud',
        address: 'Jl. Monkey Forest Road No. 25',
        city: 'Gianyar',
        country: 'Indonesia',
        zipCode: '80571',
        latitude: -8.5069,
        longitude: 115.2625,
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        propertySize: 280.0,
        plotSize: 400.0,
        yearBuilt: 2019,
        propertyType: 'VILLA',
        villaStyle: 'RUSTIC',
        description: 'Eco-friendly villa nestled in the heart of Ubud jungle with sustainable design and natural materials.',
        shortDescription: 'Eco-villa in Ubud jungle setting',
        tags: ['eco-friendly', 'jungle', 'rustic', 'ubud'],
        status: 'PENDING_REVIEW',
        isActive: true,
        sharePointPath: '/villas/jungle-retreat',
        documentsPath: '/documents/vil003',
        photosPath: '/photos/vil003',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10')
      }
    }),

    prisma.villa.create({
      data: {
        villaCode: 'VIL004',
        villaName: 'Sunset Paradise',
        location: 'Jimbaran',
        address: 'Jl. Four Seasons No. 12',
        city: 'Badung',
        country: 'Indonesia',
        zipCode: '80364',
        latitude: -8.7984,
        longitude: 115.1635,
        bedrooms: 6,
        bathrooms: 5,
        maxGuests: 12,
        propertySize: 550.0,
        plotSize: 800.0,
        yearBuilt: 2021,
        propertyType: 'VILLA',
        villaStyle: 'LUXURY',
        description: 'Luxurious 6-bedroom villa with infinity pool overlooking Jimbaran Bay, perfect for large groups.',
        shortDescription: 'Luxury villa with bay views and infinity pool',
        tags: ['luxury', 'infinity-pool', 'bay-view', 'jimbaran'],
        status: 'ACTIVE',
        isActive: true,
        sharePointPath: '/villas/sunset-paradise',
        documentsPath: '/documents/vil004',
        photosPath: '/photos/vil004',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25')
      }
    }),

    prisma.villa.create({
      data: {
        villaCode: 'VIL005',
        villaName: 'Cliff Edge Villa',
        location: 'Uluwatu',
        address: 'Jl. Raya Uluwatu No. 45',
        city: 'Badung',
        country: 'Indonesia',
        zipCode: '80364',
        latitude: -8.8289,
        longitude: 115.0844,
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 8,
        propertySize: 400.0,
        plotSize: 500.0,
        yearBuilt: 2017,
        renovationYear: 2023,
        propertyType: 'VILLA',
        villaStyle: 'CONTEMPORARY',
        description: 'Spectacular clifftop villa with dramatic ocean views and modern architecture in prestigious Uluwatu.',
        shortDescription: 'Clifftop villa with dramatic ocean views',
        tags: ['clifftop', 'ocean-view', 'contemporary', 'uluwatu'],
        status: 'DRAFT',
        isActive: true,
        sharePointPath: '/villas/cliff-edge',
        documentsPath: '/documents/vil005',
        photosPath: '/photos/vil005',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-08')
      }
    })
  ]);

  console.log('✅ Created 5 villas');

  // 2. Create 5 Owners (Records 6-10) - One per villa
  await Promise.all(villas.map((villa, index) => {
    const owners = [
      {
        firstName: 'James',
        lastName: 'Anderson',
        email: 'james.anderson@email.com',
        phone: '+61412345678',
        phoneCountryCode: 'AU',
        phoneDialCode: '+61',
        nationality: 'Australian',
        address: '123 Collins Street',
        city: 'Melbourne',
        country: 'Australia',
        zipCode: '3000',
        preferredLanguage: 'en',
        communicationPreference: 'EMAIL',
        notes: 'Prefers email communication, available Australian business hours'
      },
      {
        firstName: 'Sophie',
        lastName: 'Mueller',
        email: 'sophie.mueller@email.com',
        phone: '+4915123456789',
        phoneCountryCode: 'DE',
        phoneDialCode: '+49',
        nationality: 'German',
        address: 'Unter den Linden 15',
        city: 'Berlin',
        country: 'Germany',
        zipCode: '10117',
        preferredLanguage: 'de',
        communicationPreference: 'WHATSAPP',
        notes: 'Speaks English and German, prefers WhatsApp for quick updates'
      },
      {
        firstName: 'Hiroshi',
        lastName: 'Tanaka',
        email: 'hiroshi.tanaka@email.com',
        phone: '+819012345678',
        phoneCountryCode: 'JP',
        phoneDialCode: '+81',
        nationality: 'Japanese',
        address: '1-1-1 Shibuya',
        city: 'Tokyo',
        country: 'Japan',
        zipCode: '150-0002',
        preferredLanguage: 'ja',
        communicationPreference: 'EMAIL',
        notes: 'Business executive, prefers formal communication'
      },
      {
        firstName: 'Isabella',
        lastName: 'Rodriguez',
        email: 'isabella.rodriguez@email.com',
        phone: '+34612345678',
        phoneCountryCode: 'ES',
        phoneDialCode: '+34',
        nationality: 'Spanish',
        address: 'Gran Via 25',
        city: 'Madrid',
        country: 'Spain',
        zipCode: '28013',
        preferredLanguage: 'es',
        communicationPreference: 'PHONE',
        notes: 'Architect, interested in design and maintenance updates'
      },
      {
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.thompson@email.com',
        phone: '+14155551234',
        phoneCountryCode: 'US',
        phoneDialCode: '+1',
        nationality: 'American',
        address: '500 Market Street',
        city: 'San Francisco',
        country: 'USA',
        zipCode: '94105',
        preferredLanguage: 'en',
        communicationPreference: 'EMAIL',
        notes: 'Tech entrepreneur, travels frequently to Asia'
      }
    ];

    return prisma.owner.create({
      data: {
        ...owners[index],
        villaId: villa.id
      }
    });
  }));

  console.log('✅ Created 5 owners');

  // 3. Create 5 Contractual Details (Records 11-15) - One per villa
  await Promise.all(villas.map((villa, index) => {
    const contracts = [
      {
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2026-12-31'),
        contractType: 'EXCLUSIVE',
        commissionRate: 20.0,
        managementFee: 500.0,
        marketingFee: 200.0,
        paymentSchedule: 'MONTHLY',
        payoutDay1: 15,
        payoutDay2: 30,
        cancellationPolicy: 'MODERATE',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        minimumStayNights: 3
      },
      {
        contractStartDate: new Date('2024-02-01'),
        contractEndDate: new Date('2027-01-31'),
        contractType: 'EXCLUSIVE',
        commissionRate: 18.0,
        managementFee: 600.0,
        marketingFee: 250.0,
        paymentSchedule: 'MONTHLY',
        payoutDay1: 10,
        payoutDay2: 25,
        cancellationPolicy: 'FLEXIBLE',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        minimumStayNights: 2
      },
      {
        contractStartDate: new Date('2024-03-01'),
        contractType: 'SEASONAL',
        commissionRate: 25.0,
        managementFee: 400.0,
        paymentSchedule: 'MONTHLY',
        payoutDay1: 20,
        cancellationPolicy: 'STRICT',
        checkInTime: '16:00',
        checkOutTime: '10:00',
        minimumStayNights: 5
      },
      {
        contractStartDate: new Date('2024-01-15'),
        contractEndDate: new Date('2029-01-14'),
        contractType: 'EXCLUSIVE',
        commissionRate: 15.0,
        managementFee: 800.0,
        marketingFee: 300.0,
        paymentSchedule: 'MONTHLY',
        payoutDay1: 5,
        payoutDay2: 20,
        cancellationPolicy: 'MODERATE',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        minimumStayNights: 7
      },
      {
        contractStartDate: new Date('2024-02-10'),
        contractType: 'NON_EXCLUSIVE',
        commissionRate: 22.0,
        managementFee: 450.0,
        paymentSchedule: 'MONTHLY',
        payoutDay1: 12,
        cancellationPolicy: 'SUPER_STRICT',
        checkInTime: '16:00',
        checkOutTime: '10:00',
        minimumStayNights: 4
      }
    ];

    return prisma.contractualDetails.create({
      data: {
        ...contracts[index],
        villaId: villa.id
      }
    });
  }));

  console.log('✅ Created 5 contractual details');

  // 4. Create 5 Bank Details (Records 16-20) - One per villa
  await Promise.all(villas.map((villa, index) => {
    const bankDetails = [
      {
        accountHolderName: 'James Anderson',
        bankName: 'Commonwealth Bank of Australia',
        accountNumber: '123456789',
        iban: 'AU1234567890123456',
        swiftCode: 'CTBAAU2S',
        currency: 'AUD',
        bankCountry: 'Australia',
        isVerified: true,
        verifiedAt: new Date('2024-01-20')
      },
      {
        accountHolderName: 'Sophie Mueller',
        bankName: 'Deutsche Bank AG',
        accountNumber: '987654321',
        iban: 'DE89370400440532013000',
        swiftCode: 'DEUTDEFF',
        currency: 'EUR',
        bankCountry: 'Germany',
        isVerified: true,
        verifiedAt: new Date('2024-02-05')
      },
      {
        accountHolderName: 'Hiroshi Tanaka',
        bankName: 'Mitsubishi UFJ Bank',
        accountNumber: '1122334455',
        swiftCode: 'BOTKJPJT',
        currency: 'JPY',
        bankCountry: 'Japan',
        isVerified: false
      },
      {
        accountHolderName: 'Isabella Rodriguez',
        bankName: 'Banco Santander',
        accountNumber: '5544332211',
        iban: 'ES9121000418450200051332',
        swiftCode: 'BSCHESMM',
        currency: 'EUR',
        bankCountry: 'Spain',
        isVerified: true,
        verifiedAt: new Date('2024-01-25')
      },
      {
        accountHolderName: 'Michael Thompson',
        bankName: 'Bank of America',
        accountNumber: '9988776655',
        swiftCode: 'BOFAUS3N',
        currency: 'USD',
        bankCountry: 'USA',
        isVerified: false
      }
    ];

    return prisma.bankDetails.create({
      data: {
        ...bankDetails[index],
        villaId: villa.id
      }
    });
  }));

  console.log('✅ Created 5 bank details');

  // 5. Create 10 OTA Credentials (Records 21-30) - Multiple per villa
  const otaCredentials = [
    { villaId: villas[0].id, platform: 'BOOKING_COM', propertyId: 'BK123456', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[0].id, platform: 'AIRBNB', propertyId: 'AB789012', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[1].id, platform: 'BOOKING_COM', propertyId: 'BK234567', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[1].id, platform: 'VRBO', propertyId: 'VR345678', isActive: true, syncStatus: 'PENDING' },
    { villaId: villas[2].id, platform: 'AIRBNB', propertyId: 'AB456789', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[2].id, platform: 'AGODA', propertyId: 'AG567890', isActive: false, syncStatus: 'FAILED' },
    { villaId: villas[3].id, platform: 'BOOKING_COM', propertyId: 'BK678901', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[3].id, platform: 'EXPEDIA', propertyId: 'EX789012', isActive: true, syncStatus: 'SUCCESS' },
    { villaId: villas[4].id, platform: 'AIRBNB', propertyId: 'AB890123', isActive: false, syncStatus: 'PENDING' },
    { villaId: villas[4].id, platform: 'DIRECT', propertyId: 'DIR001', isActive: true, syncStatus: 'SUCCESS' }
  ];

  await Promise.all(otaCredentials.map(cred => 
    prisma.otaCredentials.create({ data: cred })
  ));

  console.log('✅ Created 10 OTA credentials');

  // 6. Create 8 Staff Members (Records 31-38) - Distributed across villas
  const staffMembers = [
    { villaId: villas[0].id, firstName: 'Wayan', lastName: 'Sutrisna', phone: '+6281234567890', position: 'VILLA_MANAGER', department: 'MANAGEMENT', employmentType: 'FULL_TIME', startDate: new Date('2024-01-01'), salary: 800.0, currency: 'USD' },
    { villaId: villas[0].id, firstName: 'Kadek', lastName: 'Sari', phone: '+6281234567891', position: 'HOUSEKEEPER', department: 'HOUSEKEEPING', employmentType: 'FULL_TIME', startDate: new Date('2024-01-01'), salary: 400.0, currency: 'USD' },
    { villaId: villas[1].id, firstName: 'Made', lastName: 'Wijaya', phone: '+6281234567892', position: 'VILLA_MANAGER', department: 'MANAGEMENT', employmentType: 'FULL_TIME', startDate: new Date('2024-02-01'), salary: 850.0, currency: 'USD' },
    { villaId: villas[1].id, firstName: 'Putu', lastName: 'Ayu', phone: '+6281234567893', position: 'CHEF', department: 'HOSPITALITY', employmentType: 'PART_TIME', startDate: new Date('2024-02-01'), salary: 600.0, currency: 'USD' },
    { villaId: villas[2].id, firstName: 'Ketut', lastName: 'Budi', phone: '+6281234567894', position: 'GARDENER', department: 'MAINTENANCE', employmentType: 'CONTRACT', startDate: new Date('2024-03-01'), salary: 350.0, currency: 'USD' },
    { villaId: villas[3].id, firstName: 'Nyoman', lastName: 'Indra', phone: '+6281234567895', position: 'VILLA_MANAGER', department: 'MANAGEMENT', employmentType: 'FULL_TIME', startDate: new Date('2024-01-15'), salary: 900.0, currency: 'USD' },
    { villaId: villas[3].id, firstName: 'Gede', lastName: 'Surya', phone: '+6281234567896', position: 'SECURITY', department: 'SECURITY', employmentType: 'FULL_TIME', startDate: new Date('2024-01-15'), salary: 450.0, currency: 'USD' },
    { villaId: villas[4].id, firstName: 'Komang', lastName: 'Dewi', phone: '+6281234567897', position: 'HOUSEKEEPER', department: 'HOUSEKEEPING', employmentType: 'PART_TIME', startDate: new Date('2024-02-10'), salary: 380.0, currency: 'USD' }
  ];

  await Promise.all(staffMembers.map(staff => 
    prisma.staff.create({ data: staff })
  ));

  console.log('✅ Created 8 staff members');

  // 7. Create 10 Photos (Records 39-48) - Multiple per villa
  const photos = [
    { villaId: villas[0].id, category: 'EXTERIOR_VIEWS', fileName: 'serenity_exterior_1.jpg', fileUrl: '/photos/serenity_exterior_1.jpg', fileSize: 2048576, mimeType: 'image/jpeg', isMain: true, sortOrder: 1 },
    { villaId: villas[0].id, category: 'POOL_OUTDOOR_AREAS', fileName: 'serenity_pool_1.jpg', fileUrl: '/photos/serenity_pool_1.jpg', fileSize: 1835024, mimeType: 'image/jpeg', sortOrder: 2 },
    { villaId: villas[1].id, category: 'EXTERIOR_VIEWS', fileName: 'ocean_breeze_exterior.jpg', fileUrl: '/photos/ocean_breeze_exterior.jpg', fileSize: 2156789, mimeType: 'image/jpeg', isMain: true, sortOrder: 1 },
    { villaId: villas[1].id, category: 'VIEWS_SURROUNDINGS', fileName: 'ocean_breeze_view.jpg', fileUrl: '/photos/ocean_breeze_view.jpg', fileSize: 1923456, mimeType: 'image/jpeg', sortOrder: 2 },
    { villaId: villas[2].id, category: 'EXTERIOR_VIEWS', fileName: 'jungle_retreat_exterior.jpg', fileUrl: '/photos/jungle_retreat_exterior.jpg', fileSize: 1987654, mimeType: 'image/jpeg', isMain: true, sortOrder: 1 },
    { villaId: villas[2].id, category: 'GARDEN_LANDSCAPING', fileName: 'jungle_retreat_garden.jpg', fileUrl: '/photos/jungle_retreat_garden.jpg', fileSize: 1765432, mimeType: 'image/jpeg', sortOrder: 2 },
    { villaId: villas[3].id, category: 'EXTERIOR_VIEWS', fileName: 'sunset_paradise_exterior.jpg', fileUrl: '/photos/sunset_paradise_exterior.jpg', fileSize: 2345678, mimeType: 'image/jpeg', isMain: true, sortOrder: 1 },
    { villaId: villas[3].id, category: 'POOL_OUTDOOR_AREAS', fileName: 'sunset_paradise_infinity.jpg', fileUrl: '/photos/sunset_paradise_infinity.jpg', fileSize: 2098765, mimeType: 'image/jpeg', sortOrder: 2 },
    { villaId: villas[4].id, category: 'EXTERIOR_VIEWS', fileName: 'cliff_edge_exterior.jpg', fileUrl: '/photos/cliff_edge_exterior.jpg', fileSize: 2234567, mimeType: 'image/jpeg', isMain: true, sortOrder: 1 },
    { villaId: villas[4].id, category: 'VIEWS_SURROUNDINGS', fileName: 'cliff_edge_ocean_view.jpg', fileUrl: '/photos/cliff_edge_ocean_view.jpg', fileSize: 2087654, mimeType: 'image/jpeg', sortOrder: 2 }
  ];

  await Promise.all(photos.map(photo => 
    prisma.photo.create({ data: photo })
  ));

  console.log('✅ Created 10 photos');

  // 8. Create 5 Onboarding Progress Records (Records 49-50 + 3 more to reach 50)
  await Promise.all(villas.map((villa, index) => {
    const progressData = [
      { currentStep: 10, villaInfoCompleted: true, ownerDetailsCompleted: true, contractualDetailsCompleted: true, bankDetailsCompleted: true, otaCredentialsCompleted: true, staffConfigCompleted: true, facilitiesCompleted: true, photosUploaded: true, documentsUploaded: true, reviewCompleted: true, status: 'COMPLETED', submittedAt: new Date('2024-01-25') },
      { currentStep: 8, villaInfoCompleted: true, ownerDetailsCompleted: true, contractualDetailsCompleted: true, bankDetailsCompleted: true, otaCredentialsCompleted: true, staffConfigCompleted: true, facilitiesCompleted: false, photosUploaded: true, documentsUploaded: false, reviewCompleted: false, status: 'IN_PROGRESS' },
      { currentStep: 5, villaInfoCompleted: true, ownerDetailsCompleted: true, contractualDetailsCompleted: false, bankDetailsCompleted: false, otaCredentialsCompleted: true, staffConfigCompleted: false, facilitiesCompleted: false, photosUploaded: false, documentsUploaded: false, reviewCompleted: false, status: 'IN_PROGRESS' },
      { currentStep: 10, villaInfoCompleted: true, ownerDetailsCompleted: true, contractualDetailsCompleted: true, bankDetailsCompleted: true, otaCredentialsCompleted: true, staffConfigCompleted: true, facilitiesCompleted: true, photosUploaded: true, documentsUploaded: true, reviewCompleted: true, status: 'APPROVED', submittedAt: new Date('2024-01-30'), approvedAt: new Date('2024-02-05') },
      { currentStep: 2, villaInfoCompleted: true, ownerDetailsCompleted: false, contractualDetailsCompleted: false, bankDetailsCompleted: false, otaCredentialsCompleted: false, staffConfigCompleted: false, facilitiesCompleted: false, photosUploaded: false, documentsUploaded: false, reviewCompleted: false, status: 'IN_PROGRESS' }
    ];

    return prisma.onboardingProgress.create({
      data: {
        ...progressData[index],
        villaId: villa.id
      }
    });
  }));

  console.log('✅ Created 5 onboarding progress records');

  console.log('🎉 Seed completed successfully!');
  console.log('📊 Total records created: 50');
  console.log('🏡 Villas: 5');
  console.log('👤 Owners: 5');
  console.log('📋 Contractual Details: 5');
  console.log('🏦 Bank Details: 5');
  console.log('🌐 OTA Credentials: 10');
  console.log('👷 Staff: 8');
  console.log('📸 Photos: 10');
  console.log('📈 Onboarding Progress: 5');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });