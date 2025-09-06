#!/usr/bin/env tsx

/**
 * Environment Variables Validation Test Script
 * Validates that all required environment variables are properly configured
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../backend/src/utils/logger';
import microsoftGraphService from '../backend/src/services/microsoftGraphService';
import mockSharePointService from '../backend/src/services/mockSharePointService';

// Load environment variables
dotenv.config();

interface EnvironmentTest {
  name: string;
  test: () => Promise<boolean | string>;
  required: boolean;
  category: string;
}

const environmentTests: EnvironmentTest[] = [
  // Database Tests
  {
    name: 'DATABASE_URL',
    test: async () => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return 'DATABASE_URL not set';
      
      try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        return true;
      } catch (error) {
        return `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
    required: true,
    category: 'Database'
  },

  // Server Configuration Tests
  {
    name: 'PORT',
    test: async () => {
      const port = process.env.PORT || '4001';
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return 'Invalid port number';
      }
      return true;
    },
    required: true,
    category: 'Server'
  },

  {
    name: 'NODE_ENV',
    test: async () => {
      const env = process.env.NODE_ENV;
      if (!env) return 'NODE_ENV not set';
      if (!['development', 'production', 'test'].includes(env)) {
        return 'NODE_ENV must be development, production, or test';
      }
      return true;
    },
    required: true,
    category: 'Server'
  },

  {
    name: 'CORS_ORIGIN',
    test: async () => {
      const corsOrigin = process.env.CORS_ORIGIN;
      if (!corsOrigin) return 'CORS_ORIGIN not set';
      
      // Try to parse as comma-separated URLs
      const origins = corsOrigin.split(',').map(url => url.trim());
      const validUrls = origins.every(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return url === '*'; // Allow wildcard
        }
      });
      
      if (!validUrls) return 'Invalid CORS origins';
      return true;
    },
    required: true,
    category: 'Server'
  },

  // JWT Configuration Tests
  {
    name: 'JWT_SECRET',
    test: async () => {
      const secret = process.env.JWT_SECRET;
      if (!secret) return 'JWT_SECRET not set';
      if (secret.length < 32) return 'JWT_SECRET should be at least 32 characters';
      
      // Test JWT functionality
      try {
        const testPayload = { test: 'data' };
        const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
        const decoded = jwt.verify(token, secret) as any;
        if (decoded.test !== 'data') return 'JWT functionality test failed';
        return true;
      } catch (error) {
        return `JWT test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
    required: true,
    category: 'Security'
  },

  // Clerk Authentication Tests
  {
    name: 'CLERK_SECRET_KEY',
    test: async () => {
      const clerkSecret = process.env.CLERK_SECRET_KEY;
      if (!clerkSecret) return 'CLERK_SECRET_KEY not set';
      if (!clerkSecret.startsWith('sk_')) return 'CLERK_SECRET_KEY should start with sk_';
      return true;
    },
    required: true,
    category: 'Authentication'
  },

  {
    name: 'CLERK_JWT_ISSUER',
    test: async () => {
      const issuer = process.env.CLERK_JWT_ISSUER;
      if (!issuer) return 'CLERK_JWT_ISSUER not set';
      try {
        new URL(issuer);
        if (!issuer.includes('clerk.accounts.dev')) {
          return 'CLERK_JWT_ISSUER should be a Clerk domain';
        }
        return true;
      } catch {
        return 'CLERK_JWT_ISSUER should be a valid URL';
      }
    },
    required: true,
    category: 'Authentication'
  },

  // Microsoft Graph/SharePoint Tests
  {
    name: 'AZURE_CLIENT_ID',
    test: async () => {
      const clientId = process.env.AZURE_CLIENT_ID;
      if (!clientId) return 'AZURE_CLIENT_ID not set';
      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(clientId)) return 'AZURE_CLIENT_ID should be a valid UUID';
      return true;
    },
    required: false,
    category: 'Microsoft Graph'
  },

  {
    name: 'AZURE_CLIENT_SECRET',
    test: async () => {
      const clientSecret = process.env.AZURE_CLIENT_SECRET;
      if (!clientSecret) return 'AZURE_CLIENT_SECRET not set';
      if (clientSecret.length < 10) return 'AZURE_CLIENT_SECRET seems too short';
      return true;
    },
    required: false,
    category: 'Microsoft Graph'
  },

  {
    name: 'AZURE_TENANT_ID',
    test: async () => {
      const tenantId = process.env.AZURE_TENANT_ID;
      if (!tenantId) return 'AZURE_TENANT_ID not set';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tenantId)) return 'AZURE_TENANT_ID should be a valid UUID';
      return true;
    },
    required: false,
    category: 'Microsoft Graph'
  },

  {
    name: 'SHAREPOINT_SITE_URL',
    test: async () => {
      const siteUrl = process.env.SHAREPOINT_SITE_URL;
      if (!siteUrl) return 'SHAREPOINT_SITE_URL not set';
      try {
        const url = new URL(siteUrl);
        if (!url.hostname.includes('sharepoint.com')) {
          return 'SHAREPOINT_SITE_URL should be a SharePoint domain';
        }
        return true;
      } catch {
        return 'SHAREPOINT_SITE_URL should be a valid URL';
      }
    },
    required: false,
    category: 'SharePoint'
  },

  // Encryption Tests
  {
    name: 'ENCRYPTION_KEY',
    test: async () => {
      const key = process.env.ENCRYPTION_KEY;
      if (!key) return 'ENCRYPTION_KEY not set';
      if (key.length < 32) return 'ENCRYPTION_KEY should be at least 32 characters';
      if (key === 'dev_32_char_encryption_key_secure1') {
        return 'WARNING: Using default encryption key (change in production)';
      }
      return true;
    },
    required: true,
    category: 'Security'
  },

  // Rate Limiting Tests
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    test: async () => {
      const windowMs = process.env.RATE_LIMIT_WINDOW_MS || '900000';
      const num = parseInt(windowMs);
      if (isNaN(num) || num < 1000) return 'RATE_LIMIT_WINDOW_MS should be at least 1000ms';
      return true;
    },
    required: false,
    category: 'Security'
  },

  {
    name: 'RATE_LIMIT_MAX_REQUESTS',
    test: async () => {
      const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS || '100';
      const num = parseInt(maxRequests);
      if (isNaN(num) || num < 1) return 'RATE_LIMIT_MAX_REQUESTS should be at least 1';
      return true;
    },
    required: false,
    category: 'Security'
  }
];

async function runTests() {
  console.log('🔧 Environment Variables Validation\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    categories: {} as Record<string, { passed: number; failed: number; warnings: number }>
  };

  for (const test of environmentTests) {
    results.total++;
    
    if (!results.categories[test.category]) {
      results.categories[test.category] = { passed: 0, failed: 0, warnings: 0 };
    }

    try {
      const result = await test.test();
      
      if (result === true) {
        console.log(`✅ ${test.name}: PASS`);
        results.passed++;
        results.categories[test.category].passed++;
      } else {
        const isWarning = typeof result === 'string' && result.includes('WARNING');
        const status = isWarning ? 'WARNING' : 'FAIL';
        const icon = isWarning ? '⚠️' : test.required ? '❌' : '⚠️';
        
        console.log(`${icon} ${test.name}: ${status} - ${result}`);
        
        if (isWarning) {
          results.warnings++;
          results.categories[test.category].warnings++;
        } else {
          results.failed++;
          results.categories[test.category].failed++;
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.failed++;
      results.categories[test.category].failed++;
    }
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Warnings: ${results.warnings} ⚠️`);
  
  // Print category breakdown
  console.log('\n📋 By Category:');
  for (const [category, stats] of Object.entries(results.categories)) {
    const total = stats.passed + stats.failed + stats.warnings;
    console.log(`${category}: ${stats.passed}/${total} passed (${stats.failed} failed, ${stats.warnings} warnings)`);
  }

  // Test service integrations
  console.log('\n🔗 Testing Service Integrations:');
  
  try {
    console.log('Testing Microsoft Graph service...');
    await microsoftGraphService.initialize();
    console.log('✅ Microsoft Graph service initialized');
  } catch (error) {
    console.log('⚠️  Microsoft Graph service initialization failed (using mock)');
  }

  try {
    console.log('Testing SharePoint service...');
    await mockSharePointService.initialize();
    console.log('✅ SharePoint service initialized (mock)');
  } catch (error) {
    console.log('❌ SharePoint service initialization failed');
  }

  const criticalFailures = environmentTests.filter(test => test.required).length - 
                           environmentTests.filter(test => test.required && results.categories[test.category]?.passed > 0).length;

  if (criticalFailures === 0) {
    console.log('\n🎉 All critical environment variables are properly configured!');
    return 0;
  } else {
    console.log(`\n💥 ${criticalFailures} critical environment variable(s) failed validation!`);
    return 1;
  }
}

// Run the tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('❌ Fatal error during environment validation:', error);
  process.exit(1);
});