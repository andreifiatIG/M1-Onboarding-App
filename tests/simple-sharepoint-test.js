const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Simple SharePoint Test Starting...');

// Run the test using Node.js
exec('node -r ts-node/register test-sharepoint-folder-creation.ts', 
  { cwd: __dirname }, 
  (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Test failed:', error.message);
      console.error('STDERR:', stderr);
      return;
    }
    
    if (stderr) {
      console.error('STDERR:', stderr);
    }
    
    console.log('STDOUT:', stdout);
    console.log('✅ Test completed');
  }
);