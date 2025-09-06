import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVillaCreation() {
  console.log('🧪 Testing Villa Creation Directly...');
  
  try {
    // Test 1: Simple villa creation
    console.log('1️⃣ Creating test villa...');
    
    const villa = await prisma.villa.create({
      data: {
        villaCode: 'TEST001',
        villaName: 'Test Villa Direct',
        location: 'Test Location',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        propertyType: 'VILLA',
        status: 'DRAFT',
        description: 'Test villa for debugging'
      }
    });
    
    console.log('✅ Villa created successfully:', {
      id: villa.id,
      villaName: villa.villaName,
      villaCode: villa.villaCode,
      status: villa.status
    });
    
    // Test 2: Fetch the villa
    console.log('2️⃣ Fetching created villa...');
    
    const fetchedVilla = await prisma.villa.findUnique({
      where: { id: villa.id }
    });
    
    console.log('✅ Villa fetched successfully:', fetchedVilla ? 'Found' : 'Not found');
    
    // Test 3: Update the villa
    console.log('3️⃣ Updating villa...');
    
    const updatedVilla = await prisma.villa.update({
      where: { id: villa.id },
      data: {
        villaName: 'Updated Test Villa'
      }
    });
    
    console.log('✅ Villa updated successfully:', updatedVilla.villaName);
    
    // Test 4: Delete the villa
    console.log('4️⃣ Cleaning up test villa...');
    
    await prisma.villa.delete({
      where: { id: villa.id }
    });
    
    console.log('✅ Test villa deleted successfully');
    
    console.log('\n🎉 All villa CRUD operations working correctly!');
    
  } catch (error) {
    console.error('❌ Villa creation test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

testVillaCreation();