#!/usr/bin/env tsx
/**
 * QUICK ONBOARDING WIZARD TEST
 * 
 * A simplified version of the comprehensive test to quickly identify
 * the most critical issues without running the full test suite.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuickTestResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical?: boolean;
}

class QuickOnboardingTest {
  private results: QuickTestResult[] = [];

  async runQuickTest(): Promise<void> {
    console.log('🚀 QUICK ONBOARDING WIZARD TEST');
    console.log('================================\n');

    await this.testDatabaseConnection();
    await this.testCoreTablesExist();
    await this.testSampleDataCreation();
    await this.testOnboardingFlow();
    
    this.displayResults();
    await this.cleanup();
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      await prisma.$connect();
      this.results.push({
        category: 'Database',
        status: 'pass',
        message: 'Database connection successful'
      });
    } catch (error) {
      this.results.push({
        category: 'Database',
        status: 'fail',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }
  }

  private async testCoreTablesExist(): Promise<void> {
    const tables = ['Villa', 'OnboardingProgress', 'OnboardingSession'];
    
    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT COUNT(*) FROM ${table}`;
        this.results.push({
          category: 'Schema',
          status: 'pass',
          message: `Table ${table} exists`
        });
      } catch (error) {
        this.results.push({
          category: 'Schema',
          status: 'fail',
          message: `Table ${table} missing or inaccessible`,
          critical: true
        });
      }
    }
  }

  private async testSampleDataCreation(): Promise<void> {
    try {
      // Create a test villa
      const testVilla = await prisma.villa.create({
        data: {
          villaCode: 'QUICK-TEST-001',
          villaName: 'Quick Test Villa',
          location: 'Test Location',
          address: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          bedrooms: 3,
          bathrooms: 2,
          maxGuests: 6,
          propertyType: 'VILLA',
          status: 'DRAFT'
        }
      });

      this.results.push({
        category: 'Data Creation',
        status: 'pass',
        message: `Test villa created successfully (${testVilla.id})`
      });

      // Try to create onboarding progress
      const onboardingProgress = await prisma.onboardingProgress.create({
        data: {
          villaId: testVilla.id,
          currentStep: 1,
          totalSteps: 10,
          villaInfoCompleted: false,
          ownerDetailsCompleted: false,
          contractualDetailsCompleted: false,
          bankDetailsCompleted: false,
          otaCredentialsCompleted: false,
          staffConfigCompleted: false,
          facilitiesCompleted: false,
          photosUploaded: false,
          documentsUploaded: false,
          reviewCompleted: false,
          status: 'IN_PROGRESS'
        }
      });

      this.results.push({
        category: 'Data Creation',
        status: 'pass',
        message: 'Onboarding progress record created successfully'
      });

    } catch (error) {
      this.results.push({
        category: 'Data Creation',
        status: 'fail',
        message: `Failed to create test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }
  }

  private async testOnboardingFlow(): Promise<void> {
    try {
      // Test basic onboarding operations
      const testVilla = await prisma.villa.findFirst({
        where: { villaCode: 'QUICK-TEST-001' }
      });

      if (!testVilla) {
        this.results.push({
          category: 'Onboarding Flow',
          status: 'fail',
          message: 'Test villa not found for onboarding flow test',
          critical: true
        });
        return;
      }

      // Test updating onboarding progress
      await prisma.onboardingProgress.update({
        where: { villaId: testVilla.id },
        data: {
          currentStep: 2,
          villaInfoCompleted: true
        }
      });

      this.results.push({
        category: 'Onboarding Flow',
        status: 'pass',
        message: 'Onboarding progress update successful'
      });

      // Test creating related records
      const owner = await prisma.owner.create({
        data: {
          villaId: testVilla.id,
          firstName: 'Test',
          lastName: 'Owner',
          email: 'test@example.com',
          phone: '+1234567890',
          address: '456 Owner Street',
          city: 'Owner City',
          country: 'USA'
        }
      });

      this.results.push({
        category: 'Onboarding Flow',
        status: 'pass',
        message: 'Related record creation successful (Owner)'
      });

    } catch (error) {
      this.results.push({
        category: 'Onboarding Flow',
        status: 'fail',
        message: `Onboarding flow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }
  }

  private displayResults(): void {
    console.log('📊 QUICK TEST RESULTS');
    console.log('=====================\n');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const critical = this.results.filter(r => r.critical).length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`🚨 Critical Issues: ${critical}\n`);

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`📁 ${category}:`);
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : 
                    result.status === 'fail' ? '❌' : '⚠️';
        const critical = result.critical ? ' 🚨 CRITICAL' : '';
        console.log(`   ${icon} ${result.message}${critical}`);
      }
      console.log('');
    }

    // Overall assessment
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (critical > 0) {
      console.log('❌ CRITICAL ISSUES FOUND - Not ready for production');
      console.log('   → Fix critical issues immediately before proceeding');
    } else if (failed > 0) {
      console.log('⚠️  ISSUES FOUND - Needs attention before production');
      console.log('   → Address failed tests before deployment');
    } else if (warnings > 0) {
      console.log('⚠️  WARNINGS FOUND - Review recommended');
      console.log('   → Address warnings for optimal operation');
    } else {
      console.log('✅ BASIC TESTS PASSED - Core functionality working');
      console.log('   → Run comprehensive tests for full production readiness');
    }

    console.log('\n💡 NEXT STEPS:');
    if (critical > 0 || failed > 0) {
      console.log('   1. Fix the issues identified above');
      console.log('   2. Re-run this quick test to verify fixes');
      console.log('   3. Run comprehensive test suite: tsx run-onboarding-comprehensive-test.ts');
    } else {
      console.log('   1. Run comprehensive test suite: tsx run-onboarding-comprehensive-test.ts');
      console.log('   2. Review the detailed production readiness document');
      console.log('   3. Address any issues found in comprehensive testing');
    }
    
    console.log('   4. Review docs/ONBOARDING_WIZARD_PRODUCTION_READINESS.md');
    console.log('');
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean up test data
      await prisma.villa.deleteMany({
        where: { villaCode: 'QUICK-TEST-001' }
      });
      
      console.log('🧹 Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Could not clean up test data:', error);
    }
    
    await prisma.$disconnect();
  }
}

// Run the quick test
if (require.main === module) {
  const quickTest = new QuickOnboardingTest();
  quickTest.runQuickTest().catch(console.error);
}

export default QuickOnboardingTest;