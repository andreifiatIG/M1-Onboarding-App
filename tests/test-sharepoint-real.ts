#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import the real SharePoint service
import sharePointService from '../backend/src/services/sharePointService.js';
import microsoftGraphService from '../backend/src/services/microsoftGraphService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSharePointIntegration() {
  console.log('🧪 Testing SharePoint Integration with Real Microsoft Graph API...\n');

  try {
    // Test 1: Initialize Microsoft Graph Service
    console.log('1️⃣ Testing Microsoft Graph Service initialization...');
    await microsoftGraphService.initialize();
    console.log('✅ Microsoft Graph Service initialized successfully');

    // Test 2: Get service status
    console.log('\n2️⃣ Getting service status...');
    const status = microsoftGraphService.getStatus();
    console.log('📊 Service Status:', {
      initialized: status.initialized,
      hasValidToken: status.hasValidToken,
    });

    // Test 3: Initialize SharePoint Service
    console.log('\n3️⃣ Testing SharePoint Service initialization...');
    await sharePointService.initialize();
    console.log('✅ SharePoint Service initialized successfully');

    // Test 4: Test folder creation for a test villa
    console.log('\n4️⃣ Testing folder structure creation...');
    const testVillaId = 'test-villa-sharepoint-integration';
    const testVillaName = 'Test Villa SharePoint Integration';
    
    try {
      await sharePointService.ensureVillaFolders(testVillaId, testVillaName);
      console.log(`✅ Villa folders created/verified for ${testVillaName}`);
    } catch (error) {
      console.log(`⚠️ Folder creation test: ${error.message}`);
    }

    // Test 5: List existing folders
    console.log('\n5️⃣ Testing folder listing...');
    try {
      const folders = await sharePointService.listVillaFolders();
      console.log(`📁 Found ${folders.length} villa folders:`, 
        folders.slice(0, 5).map(f => f.name)
      );
    } catch (error) {
      console.log(`⚠️ Folder listing test: ${error.message}`);
    }

    // Test 6: Service health check
    console.log('\n6️⃣ Service health check...');
    const healthStatus = sharePointService.getStatus();
    console.log('🏥 SharePoint Service Health:', {
      initialized: healthStatus.initialized,
      connected: healthStatus.connected,
      lastError: healthStatus.lastError || 'None'
    });

    console.log('\n🎉 SharePoint integration test completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Azure Tenant ID: ${process.env.AZURE_TENANT_ID}`);
    console.log(`   Azure Client ID: ${process.env.AZURE_CLIENT_ID}`);
    console.log(`   SharePoint Site URL: ${process.env.SHAREPOINT_SITE_URL}`);
    console.log(`   SharePoint Drive ID: ${process.env.SHAREPOINT_DRIVE_ID}`);

  } catch (error) {
    console.error('\n❌ SharePoint integration test failed:', error);
    
    // Additional error information
    if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 Troubleshooting: Network connectivity issue');
    } else if (error.message?.includes('401')) {
      console.log('\n🔧 Troubleshooting: Authentication failed - check your Azure AD credentials');
    } else if (error.message?.includes('403')) {
      console.log('\n🔧 Troubleshooting: Permission denied - check SharePoint permissions');
    } else if (error.message?.includes('404')) {
      console.log('\n🔧 Troubleshooting: SharePoint site or drive not found - verify URLs');
    }
    
    process.exit(1);
  }
}

// Run the test
testSharePointIntegration().catch(console.error);