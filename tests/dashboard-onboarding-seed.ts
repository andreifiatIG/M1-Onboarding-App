import { PrismaClient } from '@prisma/client';
import { OnboardingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDashboardOnboardingData() {
  console.log('🌱 Seeding Dashboard Onboarding Data...');

  // Get existing villas to create realistic onboarding sessions
  const villas = await prisma.villa.findMany({
    take: 10,
    include: {
      onboarding: true,
    }
  });

  // Create varied onboarding progress scenarios
  const onboardingScenarios = [
    {
      currentStep: 10,
      status: OnboardingStatus.COMPLETED,
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
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
    },
    {
      currentStep: 8,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: true,
      staffConfigCompleted: true,
      facilitiesCompleted: true,
      photosUploaded: true,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 6,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: true,
      staffConfigCompleted: true,
      facilitiesCompleted: false,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 4,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: false,
      staffConfigCompleted: false,
      facilitiesCompleted: false,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 2,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: false,
      bankDetailsCompleted: false,
      otaCredentialsCompleted: false,
      staffConfigCompleted: false,
      facilitiesCompleted: false,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 9,
      status: OnboardingStatus.PENDING_REVIEW,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: true,
      staffConfigCompleted: true,
      facilitiesCompleted: true,
      photosUploaded: true,
      documentsUploaded: true,
      reviewCompleted: false,
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      approvedAt: null,
    },
    {
      currentStep: 7,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: true,
      staffConfigCompleted: true,
      facilitiesCompleted: true,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 3,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: false,
      otaCredentialsCompleted: false,
      staffConfigCompleted: false,
      facilitiesCompleted: false,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 5,
      status: OnboardingStatus.IN_PROGRESS,
      villaInfoCompleted: true,
      ownerDetailsCompleted: true,
      contractualDetailsCompleted: true,
      bankDetailsCompleted: true,
      otaCredentialsCompleted: true,
      staffConfigCompleted: false,
      facilitiesCompleted: false,
      photosUploaded: false,
      documentsUploaded: false,
      reviewCompleted: false,
      submittedAt: null,
      approvedAt: null,
    },
    {
      currentStep: 10,
      status: OnboardingStatus.COMPLETED,
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
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    }
  ];

  // Update onboarding progress for each villa
  for (let i = 0; i < Math.min(villas.length, 10); i++) {
    const villa = villas[i];
    const scenario = onboardingScenarios[i];

    if (villa.onboarding) {
      await prisma.onboardingProgress.update({
        where: { id: villa.onboarding.id },
        data: {
          ...scenario,
          updatedAt: new Date(),
        }
      });
      console.log(`✅ Updated onboarding for ${villa.villaName} (Step ${scenario.currentStep}/10 - ${scenario.status})`);
    }
  }

  console.log('✅ Dashboard onboarding data seeded successfully!');
  console.log(`📊 Created varied onboarding scenarios:`);
  console.log(`   - 2 COMPLETED villas`);
  console.log(`   - 1 PENDING_REVIEW villa`);
  console.log(`   - 7 IN_PROGRESS villas at different stages`);
}

seedDashboardOnboardingData()
  .catch((e) => {
    console.error('❌ Error seeding dashboard onboarding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });