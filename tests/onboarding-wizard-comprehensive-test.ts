/**
 * COMPREHENSIVE ONBOARDING WIZARD TEST SUITE
 * 
 * This test suite evaluates the complete onboarding flow to identify
 * production readiness issues, missing features, and areas for improvement.
 * 
 * @author M1 Villa Management System
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../backend/src/server';
import onboardingService from '../backend/src/services/onboardingService';

const prisma = new PrismaClient();

interface TestResults {
  testSuite: string;
  passed: number;
  failed: number;
  issues: ProductionIssue[];
}

interface ProductionIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'functionality' | 'performance' | 'security' | 'usability' | 'reliability';
  issue: string;
  recommendation: string;
  location?: string;
}

class OnboardingWizardTestSuite {
  private testResults: TestResults[] = [];
  private productionIssues: ProductionIssue[] = [];
  private testVillaId: string | null = null;
  private testUserId = 'test-user-onboarding-123';
  private authToken: string | null = null;

  constructor() {
    console.log('🧪 Starting Comprehensive Onboarding Wizard Test Suite');
  }

  /**
   * PHASE 1: INITIALIZATION AND SETUP TESTS
   */
  async testInitialization(): Promise<TestResults> {
    console.log('📋 Phase 1: Testing Initialization & Setup');
    const results: TestResults = { testSuite: 'Initialization', passed: 0, failed: 0, issues: [] };

    try {
      // Test 1: Database connection and schema validation
      const villaCount = await prisma.villa.count();
      const onboardingProgressCount = await prisma.onboardingProgress.count();
      const onboardingSessionCount = await prisma.onboardingSession.count();
      
      console.log(`✅ Database connectivity: Villas: ${villaCount}, Progress: ${onboardingProgressCount}, Sessions: ${onboardingSessionCount}`);
      results.passed++;

      // Test 2: Required tables exist
      const requiredTables = [
        'Villa', 'Owner', 'ContractualDetails', 'BankDetails', 'OTACredentials',
        'Staff', 'Document', 'Photo', 'OnboardingProgress', 'OnboardingSession',
        'OnboardingStepProgress', 'StepFieldProgress', 'SkippedItem'
      ];

      for (const table of requiredTables) {
        try {
          await prisma.$queryRaw`SELECT COUNT(*) FROM ${table}`;
          results.passed++;
        } catch (error) {
          results.failed++;
          results.issues.push({
            severity: 'critical',
            category: 'functionality',
            issue: `Missing required table: ${table}`,
            recommendation: `Create table ${table} using Prisma migrations`,
            location: 'Database Schema'
          });
        }
      }

      // Test 3: Create test villa for comprehensive testing
      const testVilla = await prisma.villa.create({
        data: {
          villaCode: 'TEST-WIZARD-001',
          villaName: 'Test Villa for Onboarding Wizard',
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

      this.testVillaId = testVilla.id;
      console.log(`✅ Test villa created: ${testVilla.villaCode} (${testVilla.id})`);
      results.passed++;

    } catch (error) {
      results.failed++;
      results.issues.push({
        severity: 'critical',
        category: 'functionality',
        issue: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendation: 'Check database connection and schema setup',
        location: 'Test Setup'
      });
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * PHASE 2: STEP-BY-STEP VALIDATION TESTS
   */
  async testStepByStepFlow(): Promise<TestResults> {
    console.log('🏗️ Phase 2: Testing Step-by-Step Flow');
    const results: TestResults = { testSuite: 'Step Flow', passed: 0, failed: 0, issues: [] };

    if (!this.testVillaId) {
      results.failed++;
      results.issues.push({
        severity: 'critical',
        category: 'functionality',
        issue: 'No test villa ID available for step testing',
        recommendation: 'Ensure initialization test passes first',
        location: 'Test Setup'
      });
      return results;
    }

    const steps = [
      { step: 1, name: 'Villa Information', requiredFields: ['villaName', 'location', 'bedrooms', 'bathrooms'] },
      { step: 2, name: 'Owner Details', requiredFields: ['firstName', 'lastName', 'email'] },
      { step: 3, name: 'Contractual Details', requiredFields: ['contractStartDate', 'contractType'] },
      { step: 4, name: 'Bank Details', requiredFields: ['accountHolderName', 'bankName'] },
      { step: 5, name: 'OTA Credentials', requiredFields: [] }, // Optional
      { step: 6, name: 'Documents Upload', requiredFields: [] }, // Optional
      { step: 7, name: 'Staff Configuration', requiredFields: [] }, // Optional
      { step: 8, name: 'Facilities Checklist', requiredFields: [] }, // Optional
      { step: 9, name: 'Photo Upload', requiredFields: [] }, // Optional
      { step: 10, name: 'Review & Submit', requiredFields: [] }
    ];

    for (const stepConfig of steps) {
      try {
        // Test step initialization
        const progress = await onboardingService.getOnboardingProgress(this.testVillaId);
        
        if (!progress) {
          // Initialize onboarding progress
          await onboardingService.initializeOnboarding(this.testVillaId, this.testUserId);
          results.passed++;
        }

        // Test step data validation
        const testData = this.generateTestDataForStep(stepConfig.step);
        
        // Test step update
        await onboardingService.updateStepProgress(
          this.testVillaId,
          stepConfig.step,
          testData,
          false // Not completed yet
        );

        console.log(`✅ Step ${stepConfig.step} (${stepConfig.name}): Data update successful`);
        results.passed++;

        // Test field validation for required fields
        for (const field of stepConfig.requiredFields) {
          if (!testData[field]) {
            results.issues.push({
              severity: 'medium',
              category: 'usability',
              issue: `Step ${stepConfig.step}: Required field '${field}' not validated`,
              recommendation: `Add validation for required field '${field}' in step ${stepConfig.step}`,
              location: `Step ${stepConfig.step} - ${stepConfig.name}`
            });
          }
        }

        // Test step completion
        await onboardingService.updateStepProgress(
          this.testVillaId,
          stepConfig.step,
          testData,
          true // Mark as completed
        );

        console.log(`✅ Step ${stepConfig.step} (${stepConfig.name}): Completion successful`);
        results.passed++;

      } catch (error) {
        results.failed++;
        results.issues.push({
          severity: 'high',
          category: 'functionality',
          issue: `Step ${stepConfig.step} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: `Debug step ${stepConfig.step} implementation and data handling`,
          location: `Step ${stepConfig.step} - ${stepConfig.name}`
        });
      }
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * PHASE 3: API ENDPOINT TESTS
   */
  async testApiEndpoints(): Promise<TestResults> {
    console.log('🔌 Phase 3: Testing API Endpoints');
    const results: TestResults = { testSuite: 'API Endpoints', passed: 0, failed: 0, issues: [] };

    if (!this.testVillaId) return results;

    const endpoints = [
      { method: 'GET', path: `/api/onboarding/${this.testVillaId}`, description: 'Get onboarding progress' },
      { method: 'POST', path: `/api/onboarding/${this.testVillaId}/step`, description: 'Update step progress' },
      { method: 'POST', path: `/api/onboarding/${this.testVillaId}/submit`, description: 'Submit for review' },
      { method: 'POST', path: `/api/onboarding/${this.testVillaId}/skip`, description: 'Skip field/step' },
    ];

    for (const endpoint of endpoints) {
      try {
        let response;
        
        switch (endpoint.method) {
          case 'GET':
            response = await request(app)
              .get(endpoint.path)
              .set('Authorization', `Bearer ${this.authToken || 'test-token'}`);
            break;
            
          case 'POST':
            if (endpoint.path.includes('/step')) {
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${this.authToken || 'test-token'}`)
                .send({
                  step: 1,
                  data: { villaName: 'Test Villa Updated' },
                  completed: false
                });
            } else if (endpoint.path.includes('/submit')) {
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${this.authToken || 'test-token'}`)
                .send({});
            } else if (endpoint.path.includes('/skip')) {
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${this.authToken || 'test-token'}`)
                .send({
                  step: 5,
                  field: 'otaUsername',
                  reason: 'Not applicable'
                });
            }
            break;
        }

        if (response && response.status < 400) {
          console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
          results.passed++;
        } else {
          results.failed++;
          results.issues.push({
            severity: 'high',
            category: 'functionality',
            issue: `API endpoint failed: ${endpoint.method} ${endpoint.path} returned ${response?.status}`,
            recommendation: `Check endpoint implementation and authentication`,
            location: `API: ${endpoint.path}`
          });
        }

      } catch (error) {
        results.failed++;
        results.issues.push({
          severity: 'high',
          category: 'functionality',
          issue: `API endpoint error: ${endpoint.method} ${endpoint.path} - ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: `Debug endpoint ${endpoint.path} implementation`,
          location: `API: ${endpoint.path}`
        });
      }
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * PHASE 4: DATA PERSISTENCE AND CONSISTENCY TESTS
   */
  async testDataPersistence(): Promise<TestResults> {
    console.log('💾 Phase 4: Testing Data Persistence & Consistency');
    const results: TestResults = { testSuite: 'Data Persistence', passed: 0, failed: 0, issues: [] };

    if (!this.testVillaId) return results;

    try {
      // Test 1: Verify all step data was saved
      const villa = await prisma.villa.findUnique({
        where: { id: this.testVillaId },
        include: {
          owner: true,
          contractualDetails: true,
          bankDetails: true,
          otaCredentials: true,
          staff: true,
          documents: true,
          photos: true,
          onboarding: true,
          onboardingSession: true
        }
      });

      if (villa) {
        console.log('✅ Villa data retrieved successfully');
        results.passed++;

        // Test data completeness
        const expectedRelations = ['owner', 'contractualDetails', 'bankDetails', 'onboarding'];
        for (const relation of expectedRelations) {
          if (villa[relation as keyof typeof villa]) {
            console.log(`✅ ${relation} data exists`);
            results.passed++;
          } else {
            results.issues.push({
              severity: 'medium',
              category: 'reliability',
              issue: `Missing ${relation} data after onboarding completion`,
              recommendation: `Ensure ${relation} step saves data correctly`,
              location: `Data Persistence - ${relation}`
            });
          }
        }

        // Test onboarding progress consistency
        const onboardingProgress = await prisma.onboardingProgress.findUnique({
          where: { villaId: this.testVillaId }
        });

        if (onboardingProgress) {
          console.log(`✅ Onboarding progress: ${onboardingProgress.currentStep}/10 steps`);
          results.passed++;
          
          if (onboardingProgress.currentStep < 10) {
            results.issues.push({
              severity: 'medium',
              category: 'functionality',
              issue: 'Onboarding progress not updated to final step after completion',
              recommendation: 'Ensure all completed steps update the progress counter',
              location: 'OnboardingProgress tracking'
            });
          }
        } else {
          results.failed++;
          results.issues.push({
            severity: 'high',
            category: 'reliability',
            issue: 'OnboardingProgress record not created',
            recommendation: 'Ensure onboarding initialization creates progress record',
            location: 'OnboardingProgress creation'
          });
        }

      } else {
        results.failed++;
        results.issues.push({
          severity: 'critical',
          category: 'reliability',
          issue: 'Test villa data not found after step completion',
          recommendation: 'Check data saving mechanisms in onboarding flow',
          location: 'Data Persistence'
        });
      }

    } catch (error) {
      results.failed++;
      results.issues.push({
        severity: 'high',
        category: 'reliability',
        issue: `Data persistence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendation: 'Debug database operations and data saving logic',
        location: 'Data Persistence'
      });
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * PHASE 5: PERFORMANCE AND SCALABILITY TESTS
   */
  async testPerformance(): Promise<TestResults> {
    console.log('⚡ Phase 5: Testing Performance & Scalability');
    const results: TestResults = { testSuite: 'Performance', passed: 0, failed: 0, issues: [] };

    try {
      // Test 1: Step loading performance
      const stepLoadTimes: number[] = [];
      
      for (let step = 1; step <= 10; step++) {
        const startTime = Date.now();
        await onboardingService.getOnboardingProgress(this.testVillaId!);
        const loadTime = Date.now() - startTime;
        stepLoadTimes.push(loadTime);
      }

      const avgLoadTime = stepLoadTimes.reduce((a, b) => a + b, 0) / stepLoadTimes.length;
      const maxLoadTime = Math.max(...stepLoadTimes);

      console.log(`✅ Average step load time: ${avgLoadTime.toFixed(2)}ms, Max: ${maxLoadTime}ms`);
      
      if (avgLoadTime < 500) {
        results.passed++;
      } else {
        results.issues.push({
          severity: 'medium',
          category: 'performance',
          issue: `Slow step loading: Average ${avgLoadTime.toFixed(2)}ms`,
          recommendation: 'Optimize database queries and add caching',
          location: 'Step Loading Performance'
        });
      }

      if (maxLoadTime > 2000) {
        results.issues.push({
          severity: 'high',
          category: 'performance',
          issue: `Very slow step detected: ${maxLoadTime}ms`,
          recommendation: 'Investigate and optimize slow database queries',
          location: 'Step Loading Performance'
        });
      }

      // Test 2: Concurrent user simulation
      const concurrentUsers = 5;
      const concurrentPromises = [];
      
      for (let i = 0; i < concurrentUsers; i++) {
        const promise = onboardingService.getOnboardingProgress(this.testVillaId!);
        concurrentPromises.push(promise);
      }

      const concurrentStartTime = Date.now();
      await Promise.all(concurrentPromises);
      const concurrentTime = Date.now() - concurrentStartTime;

      console.log(`✅ Concurrent users test: ${concurrentUsers} users, ${concurrentTime}ms total`);
      
      if (concurrentTime < 3000) {
        results.passed++;
      } else {
        results.issues.push({
          severity: 'medium',
          category: 'performance',
          issue: `Poor concurrent performance: ${concurrentTime}ms for ${concurrentUsers} users`,
          recommendation: 'Optimize for concurrent access, consider connection pooling',
          location: 'Concurrent Access Performance'
        });
      }

    } catch (error) {
      results.failed++;
      results.issues.push({
        severity: 'medium',
        category: 'performance',
        issue: `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendation: 'Debug performance testing setup',
        location: 'Performance Testing'
      });
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * PHASE 6: ERROR HANDLING AND EDGE CASES
   */
  async testErrorHandling(): Promise<TestResults> {
    console.log('🛡️ Phase 6: Testing Error Handling & Edge Cases');
    const results: TestResults = { testSuite: 'Error Handling', passed: 0, failed: 0, issues: [] };

    // Test 1: Invalid villa ID
    try {
      await onboardingService.getOnboardingProgress('invalid-uuid');
      results.failed++;
      results.issues.push({
        severity: 'medium',
        category: 'reliability',
        issue: 'Invalid villa ID should throw error but didn\'t',
        recommendation: 'Add proper input validation for villa IDs',
        location: 'Input Validation'
      });
    } catch (error) {
      console.log('✅ Invalid villa ID properly rejected');
      results.passed++;
    }

    // Test 2: Invalid step number
    try {
      await onboardingService.updateStepProgress(this.testVillaId!, 15, {}, false);
      results.failed++;
      results.issues.push({
        severity: 'medium',
        category: 'reliability',
        issue: 'Invalid step number should throw error but didn\'t',
        recommendation: 'Add step number validation (1-10)',
        location: 'Step Validation'
      });
    } catch (error) {
      console.log('✅ Invalid step number properly rejected');
      results.passed++;
    }

    // Test 3: Database connection failure simulation
    // Note: This would be implemented with proper mocking in a full test suite

    // Test 4: Large data payload
    try {
      const largeData = {
        description: 'x'.repeat(10000), // 10KB string
        tags: Array(1000).fill('tag'),   // Large array
      };
      
      await onboardingService.updateStepProgress(this.testVillaId!, 1, largeData, false);
      console.log('✅ Large data payload handled');
      results.passed++;
    } catch (error) {
      results.issues.push({
        severity: 'low',
        category: 'reliability',
        issue: 'Large data payloads not handled gracefully',
        recommendation: 'Add data size validation and limits',
        location: 'Data Validation'
      });
    }

    this.testResults.push(results);
    return results;
  }

  /**
   * HELPER METHODS
   */
  private generateTestDataForStep(step: number): any {
    const testData: Record<number, any> = {
      1: { // Villa Information
        villaName: 'Test Comprehensive Villa',
        location: 'Test Location',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 8,
        propertyType: 'VILLA',
        description: 'A comprehensive test villa for onboarding wizard testing'
      },
      2: { // Owner Details  
        firstName: 'Test',
        lastName: 'Owner',
        email: 'test.owner@example.com',
        phone: '+1234567890',
        nationality: 'American',
        address: '456 Owner Street',
        city: 'Owner City',
        country: 'USA'
      },
      3: { // Contractual Details
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2026-12-31'),
        contractType: 'EXCLUSIVE',
        commissionRate: 15,
        managementFee: 5
      },
      4: { // Bank Details
        accountHolderName: 'Test Owner',
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        currency: 'USD'
      },
      5: { // OTA Credentials
        bookingComListed: true,
        bookingComUsername: 'testuser',
        airbnbListed: true,
        airbnbUsername: 'testairbnb'
      },
      6: { // Documents (simulated)
        documents: []
      },
      7: { // Staff
        staff: [
          {
            firstName: 'Test',
            lastName: 'Manager',
            position: 'VILLA_MANAGER',
            email: 'manager@test.com'
          }
        ]
      },
      8: { // Facilities
        facilities: {
          basic_property_pool: true,
          basic_property_garden: true,
          security_alarm_system: true
        }
      },
      9: { // Photos (simulated)
        photos: []
      },
      10: { // Review & Submit
        agreedToTerms: true,
        submissionDate: new Date()
      }
    };

    return testData[step] || {};
  }

  /**
   * CLEANUP
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    if (this.testVillaId) {
      try {
        // Delete test villa and related data (cascade delete)
        await prisma.villa.delete({
          where: { id: this.testVillaId }
        });
        console.log('✅ Test villa cleanup completed');
      } catch (error) {
        console.error('❌ Cleanup failed:', error);
      }
    }
    
    await prisma.$disconnect();
  }

  /**
   * GENERATE FINAL REPORT
   */
  generateReport(): {
    summary: any;
    productionReadinessScore: number;
    criticalIssues: ProductionIssue[];
    recommendations: string[];
  } {
    console.log('\n🎯 GENERATING COMPREHENSIVE REPORT...\n');

    // Collect all issues
    const allIssues = this.testResults.flatMap(result => result.issues);
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
    const highIssues = allIssues.filter(issue => issue.severity === 'high');
    const mediumIssues = allIssues.filter(issue => issue.severity === 'medium');
    const lowIssues = allIssues.filter(issue => issue.severity === 'low');

    // Calculate scores
    const totalTests = this.testResults.reduce((sum, result) => sum + result.passed + result.failed, 0);
    const passedTests = this.testResults.reduce((sum, result) => sum + result.passed, 0);
    const failedTests = this.testResults.reduce((sum, result) => sum + result.failed, 0);
    
    const testPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Production readiness score (0-100)
    const productionReadinessScore = Math.max(0, 
      testPassRate 
      - (criticalIssues.length * 20)
      - (highIssues.length * 10) 
      - (mediumIssues.length * 5)
      - (lowIssues.length * 2)
    );

    const summary = {
      totalTests,
      passedTests,
      failedTests,
      testPassRate: Math.round(testPassRate * 100) / 100,
      issuesSummary: {
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length,
        total: allIssues.length
      },
      testSuiteResults: this.testResults.map(result => ({
        suite: result.testSuite,
        passed: result.passed,
        failed: result.failed,
        issues: result.issues.length
      }))
    };

    // Generate recommendations
    const recommendations = [
      ...criticalIssues.length > 0 ? ['🚨 CRITICAL: Address all critical issues before production deployment'] : [],
      ...highIssues.length > 5 ? ['⚠️ HIGH PRIORITY: Resolve high-severity issues for stable operation'] : [],
      'Implement comprehensive error handling and input validation',
      'Add performance monitoring and caching mechanisms', 
      'Set up automated testing pipeline with CI/CD integration',
      'Create detailed user documentation and admin guides',
      'Implement proper logging and monitoring for production',
      'Add data backup and recovery procedures',
      'Set up security scanning and vulnerability assessments',
      'Create rollback procedures for failed deployments'
    ];

    return {
      summary,
      productionReadinessScore: Math.round(productionReadinessScore),
      criticalIssues,
      recommendations
    };
  }

  /**
   * MAIN TEST RUNNER
   */
  async runComprehensiveTest(): Promise<void> {
    console.log('🚀 STARTING COMPREHENSIVE ONBOARDING WIZARD TEST\n');
    
    try {
      // Run all test phases
      await this.testInitialization();
      await this.testStepByStepFlow();
      await this.testApiEndpoints();
      await this.testDataPersistence();
      await this.testPerformance();
      await this.testErrorHandling();

      // Generate and display report
      const report = this.generateReport();
      
      console.log('📊 COMPREHENSIVE TEST REPORT');
      console.log('=' * 50);
      console.log(`Production Readiness Score: ${report.productionReadinessScore}/100`);
      console.log(`Total Tests: ${report.summary.totalTests} (Passed: ${report.summary.passedTests}, Failed: ${report.summary.failedTests})`);
      console.log(`Test Pass Rate: ${report.summary.testPassRate}%`);
      console.log('\n📋 Issues Summary:');
      console.log(`  Critical: ${report.summary.issuesSummary.critical}`);
      console.log(`  High: ${report.summary.issuesSummary.high}`);
      console.log(`  Medium: ${report.summary.issuesSummary.medium}`);
      console.log(`  Low: ${report.summary.issuesSummary.low}`);

      if (report.criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES:');
        report.criticalIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.issue}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
          console.log(`   Location: ${issue.location || 'Not specified'}\n`);
        });
      }

      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });

      console.log('\n' + '=' * 50);
      console.log(`Production Readiness: ${report.productionReadinessScore >= 80 ? '✅ READY' : report.productionReadinessScore >= 60 ? '⚠️ NEEDS WORK' : '❌ NOT READY'}`);

    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use in test runners
export default OnboardingWizardTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new OnboardingWizardTestSuite();
  testSuite.runComprehensiveTest().catch(console.error);
}