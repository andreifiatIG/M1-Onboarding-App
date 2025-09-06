import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../backend/src/utils/logger';
import microsoftGraphService from '../backend/src/services/microsoftGraphService';
import sharePointService from '../backend/src/services/sharePointService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

interface TestResult {
  test: string;
  success: boolean;
  details?: any;
  error?: string;
}

/**
 * SharePoint Folder Creation Test Suite
 */
class SharePointFolderTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting SharePoint Folder Creation Tests\n');
    
    try {
      // Test 1: Initialize services
      await this.testServiceInitialization();
      
      // Test 2: Create test villa folder structure
      await this.testCreateVillaFolders();
      
      // Test 3: Create individual folders
      await this.testCreateIndividualFolders();
      
      // Test 4: List created folders
      await this.testListFolders();
      
      // Test 5: Clean up test folders
      await this.testCleanupFolders();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.printResults();
    }
  }

  private async testServiceInitialization(): Promise<void> {
    console.log('1️⃣ Testing service initialization...');
    
    try {
      // Initialize Microsoft Graph service
      await microsoftGraphService.initialize();
      const graphStatus = microsoftGraphService.getStatus();
      
      if (!graphStatus.initialized) {
        throw new Error('Microsoft Graph service failed to initialize');
      }
      
      // Initialize SharePoint service
      await sharePointService.initialize();
      const spStatus = sharePointService.getStatus();
      
      if (!spStatus.initialized) {
        throw new Error('SharePoint service failed to initialize');
      }
      
      this.results.push({
        test: 'Service Initialization',
        success: true,
        details: {
          microsoftGraph: graphStatus,
          sharePoint: spStatus
        }
      });
      
      console.log('✅ Services initialized successfully\n');
      
    } catch (error) {
      this.results.push({
        test: 'Service Initialization',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log('❌ Service initialization failed:', error);
      throw error;
    }
  }

  private async testCreateVillaFolders(): Promise<void> {
    console.log('2️⃣ Testing villa folder structure creation...');
    
    try {
      const testVillaId = 'TEST-001';
      const testVillaName = 'Test Villa Automation';
      
      console.log(`Creating folder structure for: ${testVillaName} (ID: ${testVillaId})`);
      
      const folderStructure = await sharePointService.createVillaFolders(testVillaId, testVillaName);
      
      this.results.push({
        test: 'Villa Folder Creation',
        success: true,
        details: {
          villaId: testVillaId,
          villaName: testVillaName,
          folderStructure
        }
      });
      
      console.log('✅ Villa folders created successfully:');
      console.log('   📁 Structure:', JSON.stringify(folderStructure, null, 2));
      console.log();
      
    } catch (error) {
      this.results.push({
        test: 'Villa Folder Creation',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log('❌ Villa folder creation failed:', error);
    }
  }

  private async testCreateIndividualFolders(): Promise<void> {
    console.log('3️⃣ Testing individual folder creation...');
    
    try {
      const client = microsoftGraphService.getClient();
      const config = sharePointService.getConfig();
      
      if (!config || !config.siteId || !config.driveId) {
        throw new Error('SharePoint configuration not available');
      }
      
      const testFolders = [
        '/TestAutomation',
        '/TestAutomation/Photos',
        '/TestAutomation/Documents',
        '/TestAutomation/Archives'
      ];
      
      const createdFolders = [];
      
      for (const folderPath of testFolders) {
        try {
          console.log(`Creating folder: ${folderPath}`);
          
          // Split path to get parent and folder name
          const pathParts = folderPath.split('/').filter(part => part);
          const folderName = pathParts.pop() || '';
          const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
          
          const folder = await microsoftGraphService.createFolder(
            config.siteId,
            config.driveId,
            parentPath,
            folderName
          );
          
          createdFolders.push({
            path: folderPath,
            folderId: folder.id,
            name: folder.name
          });
          
          console.log(`   ✅ Created: ${folderName} (ID: ${folder.id})`);
          
        } catch (error) {
          console.log(`   ⚠️ Failed to create ${folderPath}:`, error);
          // Continue with other folders
        }
      }
      
      this.results.push({
        test: 'Individual Folder Creation',
        success: createdFolders.length > 0,
        details: {
          attempted: testFolders.length,
          successful: createdFolders.length,
          folders: createdFolders
        }
      });
      
      console.log(`✅ Created ${createdFolders.length}/${testFolders.length} folders\n`);
      
    } catch (error) {
      this.results.push({
        test: 'Individual Folder Creation',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log('❌ Individual folder creation failed:', error);
    }
  }

  private async testListFolders(): Promise<void> {
    console.log('4️⃣ Testing folder listing...');
    
    try {
      const client = microsoftGraphService.getClient();
      const config = sharePointService.getConfig();
      
      if (!config || !config.siteId || !config.driveId) {
        throw new Error('SharePoint configuration not available');
      }
      
      // List root folders
      console.log('Listing root folders...');
      const rootFiles = await microsoftGraphService.listFiles(
        config.siteId,
        config.driveId,
        '/'
      );
      
      const folders = rootFiles.value?.filter((item: any) => item.folder) || [];
      
      console.log(`Found ${folders.length} folders in root:`);
      folders.forEach((folder: any, index: number) => {
        console.log(`   ${index + 1}. 📁 ${folder.name} (${folder.id})`);
      });
      
      // List Villas folder if it exists
      const villasFolder = folders.find((f: any) => f.name === 'Villas');
      if (villasFolder) {
        console.log('\nListing Villas subfolder...');
        const villaFiles = await microsoftGraphService.listFiles(
          config.siteId,
          config.driveId,
          '/Villas'
        );
        
        const villaSubfolders = villaFiles.value?.filter((item: any) => item.folder) || [];
        console.log(`Found ${villaSubfolders.length} villa folders:`);
        villaSubfolders.forEach((folder: any, index: number) => {
          console.log(`   ${index + 1}. 🏠 ${folder.name} (${folder.id})`);
        });
      }
      
      this.results.push({
        test: 'Folder Listing',
        success: true,
        details: {
          rootFolders: folders.length,
          villaFolders: villasFolder ? villaFiles?.value?.filter((item: any) => item.folder)?.length || 0 : 0,
          folders: folders.map((f: any) => ({ name: f.name, id: f.id }))
        }
      });
      
      console.log('✅ Folder listing completed\n');
      
    } catch (error) {
      this.results.push({
        test: 'Folder Listing',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log('❌ Folder listing failed:', error);
    }
  }

  private async testCleanupFolders(): Promise<void> {
    console.log('5️⃣ Testing cleanup (optional - remove test folders)...');
    
    try {
      const client = microsoftGraphService.getClient();
      const config = sharePointService.getConfig();
      
      if (!config || !config.siteId || !config.driveId) {
        throw new Error('SharePoint configuration not available');
      }
      
      // Find and delete TestAutomation folder
      const rootFiles = await microsoftGraphService.listFiles(
        config.siteId,
        config.driveId,
        '/'
      );
      
      const testFolder = rootFiles.value?.find((item: any) => 
        item.folder && item.name === 'TestAutomation'
      );
      
      if (testFolder) {
        console.log(`Deleting test folder: ${testFolder.name} (${testFolder.id})`);
        await microsoftGraphService.deleteFile(config.siteId, config.driveId, testFolder.id);
        console.log('✅ Test folder deleted');
      } else {
        console.log('ℹ️ No TestAutomation folder found to clean up');
      }
      
      this.results.push({
        test: 'Cleanup',
        success: true,
        details: {
          deletedFolder: testFolder ? testFolder.name : null
        }
      });
      
      console.log('✅ Cleanup completed\n');
      
    } catch (error) {
      this.results.push({
        test: 'Cleanup',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log('❌ Cleanup failed:', error);
    }
  }

  private printResults(): void {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`Overall: ${passed}/${total} tests passed\n`);
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${status} - ${result.test}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.success && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 4)}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (passed === total) {
      console.log('🎉 All tests passed! SharePoint integration is working correctly.');
    } else {
      console.log(`⚠️ ${total - passed} test(s) failed. Please check the errors above.`);
    }
  }
}

// Run the tests
const testSuite = new SharePointFolderTest();
testSuite.runAllTests().catch(console.error);