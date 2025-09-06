import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const villas = await prisma.villa.count();
  const owners = await prisma.owner.count();
  const staff = await prisma.staff.count();
  const photos = await prisma.photo.count();
  const documents = await prisma.document.count();
  const onboardingSessions = await prisma.onboardingSession.count();
  
  console.log('🎯 Database Summary:');
  console.log(`📋 Villas: ${villas}`);
  console.log(`👤 Owners: ${owners}`);
  console.log(`👨‍💼 Staff: ${staff}`);
  console.log(`📸 Photos: ${photos}`);
  console.log(`📄 Documents: ${documents}`);
  console.log(`📈 Onboarding Sessions: ${onboardingSessions}`);
  
  await prisma.$disconnect();
}

checkData().catch(console.error);