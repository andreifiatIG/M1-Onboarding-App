#!/usr/bin/env tsx
/**
 * Fix SharePoint Path Issues
 * This script resolves SharePoint folder path mismatches by:
 * 1. Auditing existing villa records
 * 2. Fixing villa codes and SharePoint paths
 * 3. Creating missing SharePoint folder structures
 */

import { PrismaClient } from '@prisma/client';
import sharePointService from '../src/services/sharePointService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface VillaAuditResult {
  id: string;
  villaName: string;
  villaCode: string;
  sharePointPath: string | null;
  hasSharePointIssue: boolean;
  recommendedAction: string;
}

async function auditVillaSharePointPaths(): Promise<VillaAuditResult[]> {
  console.log('🔍 Auditing villa SharePoint paths...\n');
  
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

  const auditResults: VillaAuditResult[] = [];

  for (const villa of villas) {
    let hasIssue = false;
    let recommendedAction = 'No action needed';

    // Check if villa code looks like a UUID (indicates it wasn't properly generated)
    const isUuidCode = villa.villaCode.length > 10 && villa.villaCode.includes('-');
    
    // Check if SharePoint path is missing
    const missingSharePointPath = !villa.sharePointPath;
    
    // Check if villa code needs to be generated
    const needsProperCode = isUuidCode || !villa.villaCode.startsWith('VIL');

    if (missingSharePointPath || needsProperCode) {
      hasIssue = true;
      
      if (needsProperCode && missingSharePointPath) {
        recommendedAction = 'Generate proper villa code and create SharePoint folders';
      } else if (needsProperCode) {
        recommendedAction = 'Generate proper villa code and update SharePoint path';
      } else if (missingSharePointPath) {
        recommendedAction = 'Create SharePoint folders and update path';
      }
    }

    auditResults.push({
      id: villa.id,
      villaName: villa.villaName,
      villaCode: villa.villaCode,
      sharePointPath: villa.sharePointPath,
      hasSharePointIssue: hasIssue,
      recommendedAction,
    });

    console.log(`📋 ${villa.villaName} (${villa.villaCode})`);
    console.log(`   SharePoint Path: ${villa.sharePointPath || 'MISSING'}`);
    console.log(`   Issue: ${hasIssue ? 'YES' : 'NO'}`);
    console.log(`   Action: ${recommendedAction}\n`);
  }

  return auditResults;
}

async function fixVillaSharePointPath(villaId: string, villaName: string): Promise<void> {
  console.log(`🔧 Fixing SharePoint path for ${villaName}...`);
  
  try {
    // Initialize SharePoint service
    await sharePointService.initialize();
    
    // This will trigger the villa code generation and folder creation
    await sharePointService.ensureVillaFolders(villaId, villaName);
    
    console.log(`✅ Fixed SharePoint path for ${villaName}`);
  } catch (error) {
    console.error(`❌ Failed to fix SharePoint path for ${villaName}:`, error);
    throw error;
  }
}

async function fixAllIssues(auditResults: VillaAuditResult[]): Promise<void> {
  const villasWithIssues = auditResults.filter(villa => villa.hasSharePointIssue);
  
  console.log(`🔧 Found ${villasWithIssues.length} villas with SharePoint issues`);
  console.log('Starting fixes...\n');

  for (const villa of villasWithIssues) {
    try {
      await fixVillaSharePointPath(villa.id, villa.villaName);
      console.log(`✅ Successfully fixed ${villa.villaName}\n`);
    } catch (error) {
      console.error(`❌ Failed to fix ${villa.villaName}:`, error);
      console.log(`⏭️ Continuing with next villa...\n`);
    }
  }
}

async function main() {
  console.log('🏠 M1 Villa Management - SharePoint Path Fix Tool');
  console.log('================================================\n');
  
  try {
    // Step 1: Audit existing villa SharePoint paths
    const auditResults = await auditVillaSharePointPaths();
    
    // Step 2: Show summary
    const totalVillas = auditResults.length;
    const villasWithIssues = auditResults.filter(v => v.hasSharePointIssue).length;
    
    console.log('📊 AUDIT SUMMARY');
    console.log('================');
    console.log(`Total villas: ${totalVillas}`);
    console.log(`Villas with SharePoint issues: ${villasWithIssues}`);
    console.log(`Villas without issues: ${totalVillas - villasWithIssues}\n`);
    
    if (villasWithIssues === 0) {
      console.log('🎉 All villas have proper SharePoint paths!');
      return;
    }

    // Step 3: Ask for confirmation (in a real environment, you might want user input)
    console.log('🔧 FIXING SHAREPOINT ISSUES');
    console.log('============================');
    
    // For now, auto-fix. In production, you might want to prompt for confirmation
    await fixAllIssues(auditResults);
    
    console.log('✅ SharePoint path fixes completed!');
    
  } catch (error) {
    console.error('❌ SharePoint path fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Add method to SharePointService to ensure villa folders
declare module '../src/services/sharePointService' {
  interface SharePointService {
    ensureVillaFolders(villaId: string, villaName: string): Promise<void>;
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { auditVillaSharePointPaths, fixVillaSharePointPath, fixAllIssues };
