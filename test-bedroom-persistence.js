#!/usr/bin/env node

const axios = require('axios');

async function testBedroomPersistence() {
  const API_URL = 'http://localhost:4001/api';
  const testVillaId = 'test-villa-id'; // Replace with actual villa ID
  const authToken = 'your-auth-token'; // Replace with actual auth token
  
  const testBedrooms = [
    { id: '1', name: 'Master Suite', bedType: 'King' },
    { id: '2', name: 'Ocean View Room', bedType: 'Queen' },
    { id: '3', name: 'Kids Room', bedType: 'Bunk Bed' }
  ];
  
  console.log('🧪 Testing Bedroom Persistence');
  console.log('================================\n');
  
  try {
    // Step 1: Save bedroom data
    console.log('1️⃣ Saving bedroom configuration...');
    const saveResponse = await axios.put(
      `${API_URL}/onboarding/${testVillaId}/field-progress/9/bedrooms`,
      {
        value: JSON.stringify(testBedrooms)
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Auto-Save': 'true',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Save response:', saveResponse.data);
    
    // Step 2: Retrieve bedroom data
    console.log('\n2️⃣ Retrieving bedroom configuration...');
    const getResponse = await axios.get(
      `${API_URL}/onboarding/${testVillaId}/field-progress/9`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ Retrieved data:', getResponse.data);
    
    // Step 3: Verify the data
    console.log('\n3️⃣ Verifying bedroom data...');
    if (getResponse.data.data && getResponse.data.data.bedrooms) {
      const retrievedBedrooms = JSON.parse(getResponse.data.data.bedrooms);
      console.log('📊 Retrieved bedrooms:', retrievedBedrooms);
      
      if (retrievedBedrooms.length === testBedrooms.length) {
        console.log('✅ Bedroom count matches!');
        
        // Check each bedroom
        retrievedBedrooms.forEach((bedroom, index) => {
          const original = testBedrooms[index];
          if (bedroom.name === original.name && bedroom.bedType === original.bedType) {
            console.log(`✅ Bedroom ${index + 1} matches: ${bedroom.name} - ${bedroom.bedType}`);
          } else {
            console.log(`❌ Bedroom ${index + 1} mismatch!`);
          }
        });
      } else {
        console.log('❌ Bedroom count mismatch!');
      }
    } else {
      console.log('❌ No bedroom data found in response!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
console.log('📝 Note: Update the testVillaId and authToken before running!');
console.log('You can get these from the browser developer tools while using the app.\n');

// Uncomment to run:
// testBedroomPersistence();