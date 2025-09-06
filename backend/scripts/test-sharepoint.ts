#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import sharePointService from '../src/services/sharePointService';
import microsoftGraphService from '../src/services/microsoftGraphService';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 SharePoint Test Script');
  console.log('=========================\n');
  
  try {
    console.log('🚀 Initializing services...');
    
    // Initialize Microsoft Graph service
    await microsoftGraphService.initialize();
    const graphStatus = microsoftGraphService.getStatus();
    console.log('Microsoft Graph Status:', graphStatus);
    
    // Initialize SharePoint service
    await sharePointService.initialize();
    const spStatus = sharePointService.getStatus();
    console.log('SharePoint Status:', spStatus);
    
    console.log('\n✅ Services initialized successfully');
    
    // Test: Get the problematic villa
    console.log('\n🏠 Testing problematic villa...');
    const villa = await prisma.villa.findUnique({
      where: { id: '24b49bc0-00d1-421c-b39b-9936102bd56a' },
      select: {
        id: true,
        villaName: true,
        villaCode: true,
        sharePointPath: true,
        documentsPath: true,
        photosPath: true,
      }
    });
    
    if (villa) {
      console.log('Villa found:', {
        name: villa.villaName,
        code: villa.villaCode,
        sharePointPath: villa.sharePointPath,
        documentsPath: villa.documentsPath,
        photosPath: villa.photosPath,
      });
      
      // Test SharePoint folder check
      console.log('\n📁 Testing SharePoint folder existence...');
      const folderExists = await sharePointService.checkVillaFolderExists(villa.id, villa.villaName);
      console.log('Folder exists:', folderExists);
      
      if (!folderExists) {
        console.log('\n🔨 Creating SharePoint folders...');
        await sharePointService.ensureVillaFolders(villa.id, villa.villaName);
        
        // Check updated villa
        const updatedVilla = await prisma.villa.findUnique({
          where: { id: villa.id },
          select: {
            villaCode: true,
            sharePointPath: true,
            documentsPath: true,
            photosPath: true,
          }
        });
        
        console.log('Updated villa:', updatedVilla);
      }
      
    } else {
      console.log('❌ Villa not found');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
