#!/usr/bin/env tsx
/**
 * Comprehensive SharePoint System Fix
 * 
 * This script provides a permanent solution to SharePoint path issues by:
 * 1. Auditing all villa records and their SharePoint status
 * 2. Fixing inconsistent villa codes 
 * 3. Creating missing SharePoint folder structures
 * 4. Updating database records with correct paths
 * 5. Verifying the fixes work correctly
 */

import { PrismaClient } from '@prisma/client';
import sharePointService from '../src/services/sharePointService';
import microsoftGraphService from '../src/services/microsoftGraphService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface VillaIssue {
  id: string;
  villaName: string;
  villaCode: string;
  sharePointPath: string | null;
  issues: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface FixResult {
  villaId: string;
  villaName: string;
  action: string;
  success: boolean;
  newVillaCode?: string;
  newSharePointPath?: string;
  error?: string;
}

class SharePointSystemFixer {
  private fixResults: FixResult[] = [];
  
  async runCompleteFix(): Promise<void> {
    console.log('🔧 SharePoint System Comprehensive Fix');
    console.log('=====================================\n');
    
    try {
      // Step 1: Initialize services
      await this.initializeServices();
      
      // Step 2: Audit all villas
      const villaIssues = await this.auditAllVillas();
      
      // Step 3: Display audit results
      this.displayAuditResults(villaIssues);
      
      // Step 4: Fix all issues
      await this.fixAllIssues(villaIssues);
      
      // Step 5: Verify fixes
      await this.verifyFixes();
      
      // Step 6: Display final results
      this.displayResults();
      
    } catch (error) {
      console.error('💥 System fix failed:', error);
      throw error;
    }
  }
  
  private async initializeServices(): Promise<void> {
    console.log('🚀 Initializing SharePoint services...');
    
    try {
      await microsoftGraphService.initialize();
      await sharePointService.initialize();
      
      const spStatus = sharePointService.getStatus();
      const graphStatus = microsoftGraphService.getStatus();
      
      if (!spStatus.initialized || !graphStatus.initialized) {
        throw new Error('Failed to initialize SharePoint services');
      }
      
      console.log('✅ SharePoint services initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }
  
  private async auditAllVillas(): Promise<VillaIssue[]> {
    console.log('🔍 Auditing all villa records...\n');
    
    const villas = await prisma.villa.findMany({
      select: {
        id: true,
        villaName: true,
        villaCode: true,
        sharePointPath: true,
        documentsPath: true,
        photosPath: true,
      },
    });
    
    console.log(`Found ${villas.length} villas to audit\n`);
    
    const villaIssues: VillaIssue[] = [];
    
    for (const villa of villas) {
      const issues: string[] = [];
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      
      console.log(`Auditing: ${villa.villaName} (${villa.villaCode})`);
      
      // Check villa code format
      if (!villa.villaCode.match(/^VIL\d{6}$/)) {
        issues.push('Invalid villa code format');
        priority = 'HIGH';
      }
      
      // Check if SharePoint path is missing
      if (!villa.sharePointPath) {
        issues.push('Missing SharePoint path');
        if (priority !== 'HIGH') priority = 'MEDIUM';
      }
      
      // Check if paths are consistent
      if (villa.sharePointPath && !villa.documentsPath) {
        issues.push('Missing documents path');
        if (priority === 'LOW') priority = 'MEDIUM';
      }
      
      if (villa.sharePointPath && !villa.photosPath) {
        issues.push('Missing photos path');
        if (priority === 'LOW') priority = 'MEDIUM';
      }
      
      // If there are issues, verify SharePoint folder existence
      if (issues.length > 0 && villa.sharePointPath) {
        try {
          const config = sharePointService.getConfig();
          if (config?.siteId && config?.driveId) {
            await microsoftGraphService.getClient()
              .api(`/sites/${config.siteId}/drives/${config.driveId}/root:${villa.sharePointPath}`)
              .get();
            console.log(`  ✅ SharePoint folder exists: ${villa.sharePointPath}`);
          }
        } catch (error: any) {
          if (error.statusCode === 404) {
            issues.push('SharePoint folder does not exist');
            priority = 'HIGH';
            console.log(`  ❌ SharePoint folder missing: ${villa.sharePointPath}`);
          }
        }
      }
      
      if (issues.length > 0) {
        console.log(`  Issues found: ${issues.join(', ')}`);
        villaIssues.push({
          id: villa.id,
          villaName: villa.villaName,
          villaCode: villa.villaCode,
          sharePointPath: villa.sharePointPath,
          issues,
          priority,
        });
      } else {
        console.log(`  ✅ No issues found`);
      }
    }
    
    return villaIssues;
  }
  
  private displayAuditResults(villaIssues: VillaIssue[]): void {
    console.log('\n📊 AUDIT RESULTS');
    console.log('================');
    
    const high = villaIssues.filter(v => v.priority === 'HIGH').length;
    const medium = villaIssues.filter(v => v.priority === 'MEDIUM').length;
    const low = villaIssues.filter(v => v.priority === 'LOW').length;
    
    console.log(`🔴 High Priority Issues: ${high}`);
    console.log(`🟡 Medium Priority Issues: ${medium}`);
    console.log(`🟢 Low Priority Issues: ${low}`);
    console.log(`📈 Total Villas with Issues: ${villaIssues.length}\n`);
    
    // Show detailed issues for high priority
    const highPriorityIssues = villaIssues.filter(v => v.priority === 'HIGH');
    if (highPriorityIssues.length > 0) {
      console.log('🔴 HIGH PRIORITY ISSUES:');
      highPriorityIssues.forEach((villa, index) => {
        console.log(`${index + 1}. ${villa.villaName} (${villa.villaCode})`);
        villa.issues.forEach(issue => console.log(`   - ${issue}`));
        console.log();
      });
    }
  }
  
  private async fixAllIssues(villaIssues: VillaIssue[]): Promise<void> {
    console.log('🔧 FIXING ALL ISSUES');
    console.log('====================\n');
    
    // Sort by priority: HIGH -> MEDIUM -> LOW
    const sortedIssues = villaIssues.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const villa of sortedIssues) {
      console.log(`🏠 Fixing: ${villa.villaName} (${villa.priority} priority)`);
      
      try {
        // Fix villa code if needed
        let newVillaCode = villa.villaCode;
        if (villa.issues.includes('Invalid villa code format')) {
          newVillaCode = await this.fixVillaCode(villa.id, villa.villaName);
        }
        
        // Create or fix SharePoint folders
        const sharePointPath = await this.ensureSharePointFolders(villa.id, villa.villaName);
        
        this.fixResults.push({
          villaId: villa.id,
          villaName: villa.villaName,
          action: 'FIXED',
          success: true,
          newVillaCode: newVillaCode !== villa.villaCode ? newVillaCode : undefined,
          newSharePointPath: sharePointPath,
        });
        
        console.log(`✅ Successfully fixed ${villa.villaName}\n`);
        
      } catch (error) {
        console.error(`❌ Failed to fix ${villa.villaName}:`, error);
        
        this.fixResults.push({
          villaId: villa.id,
          villaName: villa.villaName,
          action: 'FAILED',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  
  private async fixVillaCode(villaId: string, villaName: string): Promise<string> {
    console.log(`   📝 Generating new villa code for ${villaName}...`);
    
    // Get all existing villa codes
    const existingCodes = await prisma.villa.findMany({
      select: { villaCode: true },
      where: {
        villaCode: {
          startsWith: 'VIL',
          not: villaId // Exclude current villa
        }
      }
    });

    // Find next available number
    const codeNumbers = existingCodes
      .map(v => v.villaCode)
      .filter(code => code.match(/^VIL\d{6}$/))
      .map(code => parseInt(code.substring(3)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    for (const num of codeNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    const newCode = `VIL${String(nextNumber).padStart(6, '0')}`;
    
    await prisma.villa.update({
      where: { id: villaId },
      data: { villaCode: newCode }
    });
    
    console.log(`   📝 Generated villa code: ${newCode}`);
    return newCode;
  }
  
  private async ensureSharePointFolders(villaId: string, villaName: string): Promise<string> {
    console.log(`   📁 Ensuring SharePoint folders for ${villaName}...`);
    
    // This will create folders if they don't exist and update the database
    await sharePointService.ensureVillaFolders(villaId, villaName);
    
    // Get the updated villa data
    const updatedVilla = await prisma.villa.findUnique({
      where: { id: villaId },
      select: { sharePointPath: true }
    });
    
    if (!updatedVilla?.sharePointPath) {
      throw new Error('Failed to create or update SharePoint path');
    }
    
    console.log(`   📁 SharePoint path: ${updatedVilla.sharePointPath}`);
    return updatedVilla.sharePointPath;
  }
  
  private async verifyFixes(): Promise<void> {
    console.log('🔍 VERIFYING FIXES');
    console.log('==================\n');
    
    const successfulFixes = this.fixResults.filter(r => r.success);
    
    for (const fix of successfulFixes) {
      try {
        console.log(`🔍 Verifying ${fix.villaName}...`);
        
        // Verify villa exists and has correct data
        const villa = await prisma.villa.findUnique({
          where: { id: fix.villaId },
          select: {
            villaCode: true,
            sharePointPath: true,
            documentsPath: true,
            photosPath: true,
          }
        });
        
        if (!villa) {
          throw new Error('Villa not found in database');
        }
        
        if (!villa.villaCode.match(/^VIL\d{6}$/)) {
          throw new Error('Villa code still invalid');
        }
        
        if (!villa.sharePointPath) {
          throw new Error('SharePoint path still missing');
        }
        
        // Verify SharePoint folder exists
        const config = sharePointService.getConfig();
        if (config?.siteId && config?.driveId) {
          await microsoftGraphService.getClient()
            .api(`/sites/${config.siteId}/drives/${config.driveId}/root:${villa.sharePointPath}`)
            .get();
        }
        
        console.log(`✅ ${fix.villaName} verification passed`);
        
      } catch (error) {
        console.error(`❌ ${fix.villaName} verification failed:`, error);
        fix.success = false;
        fix.error = `Verification failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    
    console.log();
  }
  
  private displayResults(): void {
    console.log('📊 FINAL RESULTS');
    console.log('================');
    
    const successful = this.fixResults.filter(r => r.success).length;
    const failed = this.fixResults.filter(r => !r.success).length;
    
    console.log(`✅ Successfully Fixed: ${successful}`);
    console.log(`❌ Failed to Fix: ${failed}`);
    console.log(`📈 Total Processed: ${this.fixResults.length}\n`);
    
    if (failed > 0) {
      console.log('❌ FAILED FIXES:');
      this.fixResults
        .filter(r => !r.success)
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.villaName}`);
          console.log(`   Error: ${result.error}`);
          console.log();
        });
    }
    
    if (successful > 0) {
      console.log('✅ SUCCESSFUL FIXES:');
      this.fixResults
        .filter(r => r.success)
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.villaName}`);
          if (result.newVillaCode) {
            console.log(`   New Villa Code: ${result.newVillaCode}`);
          }
          if (result.newSharePointPath) {
            console.log(`   SharePoint Path: ${result.newSharePointPath}`);
          }
          console.log();
        });
    }
    
    if (successful === this.fixResults.length) {
      console.log('🎉 ALL FIXES SUCCESSFUL! SharePoint system is now fully operational.');
    }
  }
}

async function main() {
  const fixer = new SharePointSystemFixer();
  
  try {
    await fixer.runCompleteFix();
  } catch (error) {
    console.error('💥 System fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SharePointSystemFixer };
