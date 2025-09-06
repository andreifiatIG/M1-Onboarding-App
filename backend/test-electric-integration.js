#!/usr/bin/env node

// Test ElectricSQL integration with all database tables

import fetch from 'node-fetch';

const ELECTRIC_URL = 'http://localhost:5133';
const TABLES_TO_TEST = [
  'BankDetails',
  'ContractualDetails', 
  'Document',
  'FacilityChecklist',
  'OTACredentials',
  'OnboardingBackup',
  'OnboardingProgress',
  'OnboardingSession',
  'OnboardingStepProgress',
  'Owner',
  'Photo',
  'SkippedItem',
  'Staff',
  'StepFieldProgress',
  'Villa'
];

async function testElectricHealth() {
  try {
    console.log('🏥 Testing ElectricSQL health...');
    const response = await fetch(`${ELECTRIC_URL}/v1/health`);
    const health = await response.json();
    
    if (health.status === 'active') {
      console.log('✅ ElectricSQL is active and healthy');
      return true;
    } else {
      console.log('❌ ElectricSQL health check failed:', health);
      return false;
    }
  } catch (error) {
    console.log('❌ ElectricSQL health check error:', error.message);
    return false;
  }
}

async function testTableAccess(tableName) {
  try {
    const quotedTable = `"${tableName}"`;
    const url = `${ELECTRIC_URL}/v1/shape?table=${encodeURIComponent(quotedTable)}&offset=-1`;
    
    console.log(`📊 Testing table: ${tableName}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.log(`❌ ${tableName}: ${error.message || 'Request failed'}`);
      return false;
    }
    
    const data = await response.json();
    const recordCount = Array.isArray(data) ? data.length : 0;
    
    console.log(`✅ ${tableName}: ${recordCount} records accessible`);
    return true;
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
    return false;
  }
}

async function testRealTimeSync() {
  try {
    console.log('⚡ Testing real-time sync capabilities...');
    
    // Test with a live stream request (this would normally be kept open)
    const quotedTable = '"Villa"';
    const url = `${ELECTRIC_URL}/v1/shape?table=${encodeURIComponent(quotedTable)}&offset=-1&live=true`;
    
    const response = await fetch(url);
    if (response.ok) {
      console.log('✅ Real-time sync endpoint accessible');
      // We don't wait for the stream in this test
      return true;
    } else {
      console.log('❌ Real-time sync endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Real-time sync test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 ElectricSQL Integration Test');
  console.log('================================');
  
  // Test health
  const isHealthy = await testElectricHealth();
  if (!isHealthy) {
    console.log('💥 ElectricSQL is not healthy, aborting tests');
    process.exit(1);
  }
  
  console.log('');
  
  // Test all tables
  const results = [];
  for (const table of TABLES_TO_TEST) {
    const success = await testTableAccess(table);
    results.push({ table, success });
  }
  
  console.log('');
  
  // Test real-time sync
  const syncWorks = await testRealTimeSync();
  
  console.log('');
  console.log('📋 Summary:');
  console.log('============');
  
  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Tables accessible: ${successCount}/${results.length}`);
  console.log(`⚡ Real-time sync: ${syncWorks ? 'Working' : 'Failed'}`);
  
  if (successCount === results.length && syncWorks) {
    console.log('🎉 All tests passed! ElectricSQL is fully integrated.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
    
    // Show failed tables
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('❌ Failed tables:', failed.map(f => f.table).join(', '));
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
