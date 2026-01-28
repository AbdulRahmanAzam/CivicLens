/**
 * Test Geo-Fencing Capability
 * Verifies that GPS coordinates can be matched to UCs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../src/models/City');
const Town = require('../src/models/Town');
const UC = require('../src/models/UC');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civiclens';

async function testGeoFencing() {
  try {
    console.log('\n🧪 Testing Geo-Fencing Capability\n');
    console.log('='.repeat(70));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test coordinates in different parts of Karachi
    const testLocations = [
      { name: 'New Karachi Area', lat: 24.9850, lng: 67.0550 },
      { name: 'North Nazimabad Area', lat: 24.9420, lng: 67.0350 },
      { name: 'Saddar Area', lat: 24.8550, lng: 67.0300 },
      { name: 'Gulshan-e-Iqbal Area', lat: 24.9200, lng: 67.1050 },
      { name: 'Orangi Town Area', lat: 24.9600, lng: 66.9700 }
    ];
    
    console.log('📍 Testing ' + testLocations.length + ' locations:\n');
    
    for (const loc of testLocations) {
      const uc = await UC.findByCoordinates(loc.lng, loc.lat);
      
      if (uc) {
        console.log('✅ ' + loc.name + ' [' + loc.lng + ', ' + loc.lat + ']');
        console.log('   Matched to: UC-' + uc.ucNumber.toString().padStart(2, '0') + ' ' + uc.name);
        console.log('   Code: ' + uc.code);
        console.log('   Town: ' + uc.town.name);
        console.log('   City: ' + uc.city.name + '\n');
      } else {
        console.log('❌ ' + loc.name + ' [' + loc.lng + ', ' + loc.lat + ']');
        console.log('   No UC match found (coordinates outside boundaries)\n');
      }
    }
    
    console.log('='.repeat(70));
    console.log('✅ Geo-fencing test complete!');
    console.log('='.repeat(70));
    
    console.log('\n💡 How it works:');
    console.log('   1. User submits complaint with GPS coordinates');
    console.log('   2. System calls UC.findByCoordinates(lng, lat)');
    console.log('   3. MongoDB performs $geoIntersects query on UC boundaries');
    console.log('   4. Complaint auto-assigned to correct UC Chairman');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testGeoFencing();
