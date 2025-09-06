#!/usr/bin/env node

/**
 * Test script for SharePoint integration
 * Tests Microsoft Graph API connection and SharePoint operations
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function testSharePointIntegration() {
  console.log('🧪 Testing SharePoint Integration...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = [
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET', 
    'AZURE_TENANT_ID',
    'SHAREPOINT_SITE_URL',
    'SHAREPOINT_DRIVE_ID'
  ];

  let missingVars = [];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'AZURE_CLIENT_SECRET' ? '***' : value}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('\nPlease ensure all Azure AD and SharePoint credentials are configured.');
    return false;
  }

  console.log('\n🔗 Testing Microsoft Graph API Connection...');

  try {
    // Import services dynamically
    const { default: microsoftGraphService } = await import('../backend/src/services/microsoftGraphService.js');
    const { default: sharePointService } = await import('../backend/src/services/sharePointService.js');

    // Test Microsoft Graph service initialization
    console.log('1. Testing Microsoft Graph service...');
    await microsoftGraphService.initialize();
    console.log('✅ Microsoft Graph service initialized successfully');

    // Test basic API call
    console.log('2. Testing Graph API access...');
    const sites = await microsoftGraphService.getSites();
    console.log(`✅ Successfully retrieved ${sites?.length || 0} sites`);

    // Test SharePoint service
    console.log('3. Testing SharePoint service...');
    await sharePointService.initialize();
    console.log('✅ SharePoint service initialized successfully');

    // Test site access
    console.log('4. Testing site access...');
    const siteInfo = await sharePointService.getSiteInfo();
    if (siteInfo) {
      console.log(`✅ Site access successful: ${siteInfo.displayName || siteInfo.name}`);
    }

    // Test drive access  
    console.log('5. Testing drive access...');
    const driveInfo = await sharePointService.getDriveInfo();
    if (driveInfo) {
      console.log(`✅ Drive access successful: ${driveInfo.name}`);
    }

    console.log('\n🎉 SharePoint Integration Test PASSED!');
    console.log('\nNext steps:');
    console.log('- Test villa folder creation');
    console.log('- Test file upload operations');
    console.log('- Test document categorization');
    
    return true;

  } catch (error) {
    console.error('\n❌ SharePoint Integration Test FAILED!');
    console.error('Error details:', error.message);
    
    if (error.message.includes('AADSTS')) {
      console.log('\n🔍 This appears to be an Azure AD authentication error.');
      console.log('Common solutions:');
      console.log('1. Verify your Azure AD app registration');
      console.log('2. Check client ID, secret, and tenant ID');
      console.log('3. Ensure proper API permissions are granted');
      console.log('4. Check if admin consent is required');
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.log('\n🔍 This appears to be a SharePoint site/drive access error.');
      console.log('Common solutions:');
      console.log('1. Verify SHAREPOINT_SITE_URL is correct');
      console.log('2. Check SHAREPOINT_DRIVE_ID exists');
      console.log('3. Ensure the app has access to the SharePoint site');
    }

    return false;
  }
}

// Test data collection points mapping
function analyzeDataCollectionPoints() {
  console.log('\n📊 Data Collection Points Analysis:');
  console.log('==================================');
  
  const photoCategories = [
    'Logo', 'Floor Plan', 'Exterior Views', 'Interior Living Spaces',
    'Bedrooms', 'Bathrooms', 'Kitchen', 'Dining Areas',
    'Pool & Outdoor Areas', 'Garden & Landscaping', 
    'Amenities & Facilities', 'Views & Surroundings',
    'Staff Areas', 'Utility Areas', 'Videos', 'Drone Shots', 'Entertainment'
  ];

  const documentCategories = [
    'Contracts', 'Insurance', 'Inventory', 'Utilities',
    'Emergency Contacts', 'House Rules', 'Staff Contracts', 'Maintenance Contracts'
  ];

  console.log('📸 Photo Categories (17 total):');
  photoCategories.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. ${cat}`);
  });

  console.log('\n📄 Document Categories (8 total):');
  documentCategories.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. ${cat}`);
  });

  console.log('\n🗂️ Expected SharePoint Folder Structure:');
  console.log('Villas/{villaName}_{villaId}/');
  console.log('├── Legal_Documents/');
  documentCategories.forEach(cat => {
    console.log(`│   ├── ${cat.replace(/\s+/g, '_')}/`);
  });
  console.log('├── Media_Gallery/');
  photoCategories.forEach(cat => {
    console.log(`│   ├── ${cat.replace(/\s+/g, '_')}/`);
  });
  console.log('├── Agreements/');
  console.log('└── Marketing_Materials/');
}

// Main execution
async function main() {
  console.log('🏠 M1 Villa Management - SharePoint Integration Test');
  console.log('===================================================\n');

  // Analyze data collection points
  analyzeDataCollectionPoints();

  // Test SharePoint integration
  const success = await testSharePointIntegration();

  process.exit(success ? 0 : 1);
}

main().catch(console.error);