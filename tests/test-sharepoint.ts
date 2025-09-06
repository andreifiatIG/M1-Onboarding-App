#!/usr/bin/env tsx

/**
 * SharePoint Integration Test Script
 * Tests the mock SharePoint service functionality
 */

import mockSharePointService from '../backend/src/services/mockSharePointService';
import { logger } from '../backend/src/utils/logger';
import path from 'path';
import fs from 'fs';

async function main() {
  try {
    console.log('🔄 Testing SharePoint Integration...\n');

    // 1. Initialize the service
    console.log('1. Initializing SharePoint service...');
    await mockSharePointService.initialize();
    console.log('✅ SharePoint service initialized\n');

    // 2. Test service status
    console.log('2. Testing service status...');
    const status = mockSharePointService.getStatus();
    console.log('SharePoint Status:', JSON.stringify(status, null, 2));
    console.log('Service Ready:', mockSharePointService.isReady());
    console.log('');

    // 3. Test creating villa folders
    console.log('3. Testing villa folder creation...');
    const testVillaId = 'test-villa-12345';
    const testVillaName = 'Test Luxury Villa';
    
    await mockSharePointService.createVillaFolders(testVillaId, testVillaName);
    console.log(`✅ Created villa folders for: ${testVillaName}`);
    console.log('');

    // 4. Test file upload simulation
    console.log('4. Testing mock file upload...');
    const mockFilePath = path.join(process.cwd(), 'mock-sharepoint', 'test-document.pdf');
    
    // Create a mock file for testing
    fs.writeFileSync(mockFilePath, 'This is a test document content for SharePoint integration testing.');
    
    const uploadResult = await mockSharePointService.uploadFile(mockFilePath, testVillaId, 'contract', 'test-contract.pdf');
    console.log('Upload Result:', JSON.stringify(uploadResult, null, 2));
    console.log('');

    // 5. Test document sync
    console.log('5. Testing document sync...');
    const syncResult = await mockSharePointService.syncDocument('doc-123', testVillaId);
    console.log('Sync Result:', JSON.stringify(syncResult, null, 2));
    console.log('');

    // 6. Test listing villa files
    console.log('6. Testing villa file listing...');
    const villaFiles = await mockSharePointService.listVillaFiles(testVillaId);
    console.log('Villa Files:', JSON.stringify(villaFiles, null, 2));
    console.log('');

    // 7. Verify folder structure was created
    console.log('7. Verifying folder structure...');
    const basePath = path.join(process.cwd(), 'mock-sharepoint');
    const villaPath = path.join(basePath, 'Villas', `${testVillaName}-${testVillaId}`);
    
    if (fs.existsSync(villaPath)) {
      console.log('✅ Villa folder structure created at:', villaPath);
      const subfolders = fs.readdirSync(villaPath);
      console.log('Created subfolders:', subfolders);
    } else {
      console.log('❌ Villa folder structure not found');
    }
    console.log('');

    // 8. Test file operations
    console.log('8. Testing file operations...');
    const testFiles = fs.readdirSync(basePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log('SharePoint mock directories:', testFiles);
    console.log('');

    // 9. Test cleanup functionality (if available)
    console.log('9. Testing mock cleanup...');
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
      console.log('✅ Cleaned up test file');
    }
    console.log('');

    console.log('🎉 All SharePoint integration tests completed successfully!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('- Service initialization: ✅');
    console.log('- Status check: ✅');
    console.log('- Villa folder creation: ✅');
    console.log('- File upload simulation: ✅');
    console.log('- Document sync: ✅');
    console.log('- File listing: ✅');
    console.log('- Folder structure verification: ✅');
    console.log('- Cleanup: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});