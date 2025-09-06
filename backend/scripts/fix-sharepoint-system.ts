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
    
    const villaIssues: VillaIssue[] = [];
    
    for (const villa of villas) {
      const issues: string[] = [];
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      
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
          }
        } catch (error: any) {
          if (error.statusCode === 404) {
            issues.push('SharePoint folder does not exist');
            priority = 'HIGH';
          }
        }
      }
      
      if (issues.length > 0) {
        villaIssues.push({
          id: villa.id,
          villaName: villa.villaName,
          villaCode: villa.villaCode,
          sharePointPath: villa.sharePointPath,
          issues,
          priority,
        });
      }
    }
    
    return villaIssues;
  }
  
  private displayAuditResults(villaIssues: VillaIssue[]): void {\n    console.log('📊 AUDIT RESULTS');\n    console.log('================');\n    \n    const high = villaIssues.filter(v => v.priority === 'HIGH').length;\n    const medium = villaIssues.filter(v => v.priority === 'MEDIUM').length;\n    const low = villaIssues.filter(v => v.priority === 'LOW').length;\n    \n    console.log(`🔴 High Priority Issues: ${high}`);\n    console.log(`🟡 Medium Priority Issues: ${medium}`);\n    console.log(`🟢 Low Priority Issues: ${low}`);\n    console.log(`📈 Total Villas with Issues: ${villaIssues.length}\\n`);\n    \n    // Show detailed issues for high priority\n    const highPriorityIssues = villaIssues.filter(v => v.priority === 'HIGH');\n    if (highPriorityIssues.length > 0) {\n      console.log('🔴 HIGH PRIORITY ISSUES:');\n      highPriorityIssues.forEach((villa, index) => {\n        console.log(`${index + 1}. ${villa.villaName} (${villa.villaCode})`);\n        villa.issues.forEach(issue => console.log(`   - ${issue}`));\n        console.log();\n      });\n    }\n  }\n  \n  private async fixAllIssues(villaIssues: VillaIssue[]): Promise<void> {\n    console.log('🔧 FIXING ALL ISSUES');\n    console.log('====================\\n');\n    \n    // Sort by priority: HIGH -> MEDIUM -> LOW\n    const sortedIssues = villaIssues.sort((a, b) => {\n      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };\n      return priorityOrder[b.priority] - priorityOrder[a.priority];\n    });\n    \n    for (const villa of sortedIssues) {\n      console.log(`🏠 Fixing: ${villa.villaName} (${villa.priority} priority)`);\n      \n      try {\n        // Fix villa code if needed\n        let newVillaCode = villa.villaCode;\n        if (villa.issues.includes('Invalid villa code format')) {\n          newVillaCode = await this.fixVillaCode(villa.id, villa.villaName);\n        }\n        \n        // Create or fix SharePoint folders\n        const sharePointPath = await this.ensureSharePointFolders(villa.id, villa.villaName);\n        \n        this.fixResults.push({\n          villaId: villa.id,\n          villaName: villa.villaName,\n          action: 'FIXED',\n          success: true,\n          newVillaCode: newVillaCode !== villa.villaCode ? newVillaCode : undefined,\n          newSharePointPath: sharePointPath,\n        });\n        \n        console.log(`✅ Successfully fixed ${villa.villaName}\\n`);\n        \n      } catch (error) {\n        console.error(`❌ Failed to fix ${villa.villaName}:`, error);\n        \n        this.fixResults.push({\n          villaId: villa.id,\n          villaName: villa.villaName,\n          action: 'FAILED',\n          success: false,\n          error: error instanceof Error ? error.message : String(error),\n        });\n      }\n    }\n  }\n  \n  private async fixVillaCode(villaId: string, villaName: string): Promise<string> {\n    console.log(`   📝 Generating new villa code for ${villaName}...`);\n    \n    // Get all existing villa codes\n    const existingCodes = await prisma.villa.findMany({\n      select: { villaCode: true },\n      where: {\n        villaCode: {\n          startsWith: 'VIL',\n          not: villaId // Exclude current villa\n        }\n      }\n    });\n\n    // Find next available number\n    const codeNumbers = existingCodes\n      .map(v => v.villaCode)\n      .filter(code => code.match(/^VIL\\d{6}$/))\n      .map(code => parseInt(code.substring(3)))\n      .filter(num => !isNaN(num))\n      .sort((a, b) => a - b);\n\n    let nextNumber = 1;\n    for (const num of codeNumbers) {\n      if (num === nextNumber) {\n        nextNumber++;\n      } else {\n        break;\n      }\n    }\n\n    const newCode = `VIL${String(nextNumber).padStart(6, '0')}`;\n    \n    await prisma.villa.update({\n      where: { id: villaId },\n      data: { villaCode: newCode }\n    });\n    \n    console.log(`   📝 Generated villa code: ${newCode}`);\n    return newCode;\n  }\n  \n  private async ensureSharePointFolders(villaId: string, villaName: string): Promise<string> {\n    console.log(`   📁 Ensuring SharePoint folders for ${villaName}...`);\n    \n    // This will create folders if they don't exist and update the database\n    await sharePointService.ensureVillaFolders(villaId, villaName);\n    \n    // Get the updated villa data\n    const updatedVilla = await prisma.villa.findUnique({\n      where: { id: villaId },\n      select: { sharePointPath: true }\n    });\n    \n    if (!updatedVilla?.sharePointPath) {\n      throw new Error('Failed to create or update SharePoint path');\n    }\n    \n    console.log(`   📁 SharePoint path: ${updatedVilla.sharePointPath}`);\n    return updatedVilla.sharePointPath;\n  }\n  \n  private async verifyFixes(): Promise<void> {\n    console.log('🔍 VERIFYING FIXES');\n    console.log('==================\\n');\n    \n    const successfulFixes = this.fixResults.filter(r => r.success);\n    \n    for (const fix of successfulFixes) {\n      try {\n        console.log(`🔍 Verifying ${fix.villaName}...`);\n        \n        // Verify villa exists and has correct data\n        const villa = await prisma.villa.findUnique({\n          where: { id: fix.villaId },\n          select: {\n            villaCode: true,\n            sharePointPath: true,\n            documentsPath: true,\n            photosPath: true,\n          }\n        });\n        \n        if (!villa) {\n          throw new Error('Villa not found in database');\n        }\n        \n        if (!villa.villaCode.match(/^VIL\\d{6}$/)) {\n          throw new Error('Villa code still invalid');\n        }\n        \n        if (!villa.sharePointPath) {\n          throw new Error('SharePoint path still missing');\n        }\n        \n        // Verify SharePoint folder exists\n        const config = sharePointService.getConfig();\n        if (config?.siteId && config?.driveId) {\n          await microsoftGraphService.getClient()\n            .api(`/sites/${config.siteId}/drives/${config.driveId}/root:${villa.sharePointPath}`)\n            .get();\n        }\n        \n        console.log(`✅ ${fix.villaName} verification passed`);\n        \n      } catch (error) {\n        console.error(`❌ ${fix.villaName} verification failed:`, error);\n        fix.success = false;\n        fix.error = `Verification failed: ${error instanceof Error ? error.message : String(error)}`;\n      }\n    }\n    \n    console.log();\n  }\n  \n  private displayResults(): void {\n    console.log('📊 FINAL RESULTS');\n    console.log('================');\n    \n    const successful = this.fixResults.filter(r => r.success).length;\n    const failed = this.fixResults.filter(r => !r.success).length;\n    \n    console.log(`✅ Successfully Fixed: ${successful}`);\n    console.log(`❌ Failed to Fix: ${failed}`);\n    console.log(`📈 Total Processed: ${this.fixResults.length}\\n`);\n    \n    if (failed > 0) {\n      console.log('❌ FAILED FIXES:');\n      this.fixResults\n        .filter(r => !r.success)\n        .forEach((result, index) => {\n          console.log(`${index + 1}. ${result.villaName}`);\n          console.log(`   Error: ${result.error}`);\n          console.log();\n        });\n    }\n    \n    if (successful > 0) {\n      console.log('✅ SUCCESSFUL FIXES:');\n      this.fixResults\n        .filter(r => r.success)\n        .forEach((result, index) => {\n          console.log(`${index + 1}. ${result.villaName}`);\n          if (result.newVillaCode) {\n            console.log(`   New Villa Code: ${result.newVillaCode}`);\n          }\n          if (result.newSharePointPath) {\n            console.log(`   SharePoint Path: ${result.newSharePointPath}`);\n          }\n          console.log();\n        });\n    }\n    \n    if (successful === this.fixResults.length) {\n      console.log('🎉 ALL FIXES SUCCESSFUL! SharePoint system is now fully operational.');\n    }\n  }\n}\n\nasync function main() {\n  const fixer = new SharePointSystemFixer();\n  \n  try {\n    await fixer.runCompleteFix();\n  } catch (error) {\n    console.error('💥 System fix failed:', error);\n    process.exit(1);\n  } finally {\n    await prisma.$disconnect();\n  }\n}\n\n// Run if called directly\nif (require.main === module) {\n  main().catch(console.error);\n}\n\nexport { SharePointSystemFixer };
