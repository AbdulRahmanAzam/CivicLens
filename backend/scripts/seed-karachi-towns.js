/**
 * Seed Script: Karachi Towns with GeoJSON Geometry
 * Creates Karachi city and all 25 towns with proper polygon boundaries
 * 
 * Run: node scripts/seed-karachi-towns.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../src/models/City');
const Town = require('../src/models/Town');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civiclens';

/**
 * Karachi City Data
 */
const KARACHI_CITY = {
  name: 'Karachi',
  code: 'KHI',
  province: 'Sindh',
  country: 'Pakistan',
  population: 16000000,
  center: {
    type: 'Point',
    coordinates: [67.0011, 24.8607] // [longitude, latitude]
  },
  boundary: {
    type: 'Polygon',
    coordinates: [[
      [66.8000, 24.7500],
      [67.3500, 24.7500],
      [67.3500, 25.1500],
      [66.8000, 25.1500],
      [66.8000, 24.7500]
    ]]
  }
};

/**
 * Karachi Towns with GeoJSON Geometry
 * District-wise organization with non-overlapping polygon boundaries
 * Boundaries follow approximate road/geographic divisions
 */
const KARACHI_TOWNS = [
  // ========================================
  // CENTRAL DISTRICT (Northern Karachi)
  // ========================================
  {
    town_id: "TMC-01",
    town_name: "New Karachi Town",
    district: "Central",
    city: "Karachi",
    population: 750000,
    center: { type: 'Point', coordinates: [67.0550, 24.9850] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0150, 24.9700],
        [67.0400, 24.9700],
        [67.0600, 24.9650],
        [67.0850, 24.9700],
        [67.0950, 24.9850],
        [67.0900, 25.0000],
        [67.0600, 25.0050],
        [67.0300, 25.0000],
        [67.0150, 24.9850],
        [67.0150, 24.9700]
      ]]
    }
  },
  {
    town_id: "TMC-02",
    town_name: "North Nazimabad Town",
    district: "Central",
    city: "Karachi",
    population: 680000,
    center: { type: 'Point', coordinates: [67.0350, 24.9420] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0050, 24.9250],
        [67.0400, 24.9200],
        [67.0600, 24.9250],
        [67.0600, 24.9650],
        [67.0400, 24.9700],
        [67.0150, 24.9700],
        [67.0050, 24.9550],
        [67.0050, 24.9250]
      ]]
    }
  },
  {
    town_id: "TMC-03",
    town_name: "Gulberg Town",
    district: "Central",
    city: "Karachi",
    population: 520000,
    center: { type: 'Point', coordinates: [67.0750, 24.9300] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0600, 24.9050],
        [67.0850, 24.9000],
        [67.0950, 24.9150],
        [67.0950, 24.9500],
        [67.0850, 24.9700],
        [67.0600, 24.9650],
        [67.0600, 24.9250],
        [67.0600, 24.9050]
      ]]
    }
  },
  {
    town_id: "TMC-04",
    town_name: "Liaquatabad Town",
    district: "Central",
    city: "Karachi",
    population: 450000,
    center: { type: 'Point', coordinates: [67.0200, 24.8850] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9950, 24.8650],
        [67.0200, 24.8600],
        [67.0450, 24.8650],
        [67.0450, 24.8950],
        [67.0400, 24.9200],
        [67.0050, 24.9250],
        [66.9950, 24.9100],
        [66.9950, 24.8650]
      ]]
    }
  },
  {
    town_id: "TMC-05",
    town_name: "Nazimabad Town",
    district: "Central",
    city: "Karachi",
    population: 420000,
    center: { type: 'Point', coordinates: [67.0500, 24.9100] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0450, 24.8950],
        [67.0600, 24.9050],
        [67.0600, 24.9250],
        [67.0400, 24.9200],
        [67.0350, 24.8950],
        [67.0450, 24.8950]
      ]]
    }
  },

  // ========================================
  // EAST DISTRICT
  // ========================================
  {
    town_id: "TMC-06",
    town_name: "Gulshan-e-Iqbal Town",
    district: "East",
    city: "Karachi",
    population: 850000,
    center: { type: 'Point', coordinates: [67.1050, 24.9200] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0850, 24.9000],
        [67.1150, 24.8900],
        [67.1350, 24.9000],
        [67.1350, 24.9400],
        [67.1200, 24.9550],
        [67.0950, 24.9500],
        [67.0850, 24.9350],
        [67.0850, 24.9000]
      ]]
    }
  },
  {
    town_id: "TMC-07",
    town_name: "Jamshed Town",
    district: "East",
    city: "Karachi",
    population: 580000,
    center: { type: 'Point', coordinates: [67.0650, 24.8700] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0450, 24.8500],
        [67.0700, 24.8450],
        [67.0850, 24.8550],
        [67.0850, 24.9000],
        [67.0600, 24.9050],
        [67.0450, 24.8950],
        [67.0450, 24.8500]
      ]]
    }
  },
  {
    town_id: "TMC-08",
    town_name: "Sohrab Goth Town",
    district: "East",
    city: "Karachi",
    population: 320000,
    center: { type: 'Point', coordinates: [67.1150, 24.9700] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0950, 24.9500],
        [67.1200, 24.9550],
        [67.1350, 24.9600],
        [67.1400, 24.9850],
        [67.1200, 24.9950],
        [67.0950, 24.9850],
        [67.0900, 24.9700],
        [67.0950, 24.9500]
      ]]
    }
  },
  {
    town_id: "TMC-09",
    town_name: "Safoora Town",
    district: "East",
    city: "Karachi",
    population: 280000,
    center: { type: 'Point', coordinates: [67.1500, 24.9200] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1350, 24.9000],
        [67.1600, 24.8950],
        [67.1750, 24.9100],
        [67.1700, 24.9400],
        [67.1500, 24.9500],
        [67.1350, 24.9400],
        [67.1350, 24.9000]
      ]]
    }
  },
  {
    town_id: "TMC-10",
    town_name: "Chanesar Town",
    district: "East",
    city: "Karachi",
    population: 250000,
    center: { type: 'Point', coordinates: [67.1550, 24.9600] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1350, 24.9600],
        [67.1500, 24.9500],
        [67.1700, 24.9400],
        [67.1800, 24.9550],
        [67.1750, 24.9800],
        [67.1550, 24.9850],
        [67.1400, 24.9850],
        [67.1350, 24.9600]
      ]]
    }
  },

  // ========================================
  // WEST DISTRICT
  // ========================================
  {
    town_id: "TMC-11",
    town_name: "Orangi Town",
    district: "West",
    city: "Karachi",
    population: 950000,
    center: { type: 'Point', coordinates: [66.9700, 24.9600] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9350, 24.9350],
        [66.9800, 24.9300],
        [67.0050, 24.9350],
        [67.0050, 24.9550],
        [67.0150, 24.9700],
        [67.0150, 24.9850],
        [66.9800, 24.9950],
        [66.9500, 24.9900],
        [66.9350, 24.9650],
        [66.9350, 24.9350]
      ]]
    }
  },
  {
    town_id: "TMC-12",
    town_name: "Manghopir Town",
    district: "West",
    city: "Karachi",
    population: 380000,
    center: { type: 'Point', coordinates: [66.9600, 25.0150] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9200, 24.9900],
        [66.9500, 24.9900],
        [66.9800, 24.9950],
        [67.0150, 24.9850],
        [67.0300, 25.0000],
        [67.0200, 25.0400],
        [66.9700, 25.0500],
        [66.9300, 25.0350],
        [66.9200, 24.9900]
      ]]
    }
  },
  {
    town_id: "TMC-13",
    town_name: "Mominabad Town",
    district: "West",
    city: "Karachi",
    population: 420000,
    center: { type: 'Point', coordinates: [66.9400, 24.9150] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9100, 24.8950],
        [66.9450, 24.8900],
        [66.9800, 24.9000],
        [66.9800, 24.9300],
        [66.9350, 24.9350],
        [66.9100, 24.9200],
        [66.9100, 24.8950]
      ]]
    }
  },

  // ========================================
  // MALIR DISTRICT
  // ========================================
  {
    town_id: "TMC-14",
    town_name: "Gadap Town",
    district: "Malir",
    city: "Karachi",
    population: 450000,
    center: { type: 'Point', coordinates: [67.2200, 25.0100] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1750, 24.9800],
        [67.2100, 24.9700],
        [67.2600, 24.9850],
        [67.2800, 25.0200],
        [67.2600, 25.0600],
        [67.2100, 25.0700],
        [67.1700, 25.0400],
        [67.1550, 24.9850],
        [67.1750, 24.9800]
      ]]
    }
  },
  {
    town_id: "TMC-15",
    town_name: "Malir Town",
    district: "Malir",
    city: "Karachi",
    population: 520000,
    center: { type: 'Point', coordinates: [67.2000, 24.8900] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1650, 24.8600],
        [67.2000, 24.8500],
        [67.2350, 24.8600],
        [67.2400, 24.8950],
        [67.2200, 24.9350],
        [67.1800, 24.9300],
        [67.1650, 24.9000],
        [67.1650, 24.8600]
      ]]
    }
  },
  {
    town_id: "TMC-16",
    town_name: "Ibrahim Hyderi Town",
    district: "Malir",
    city: "Karachi",
    population: 280000,
    center: { type: 'Point', coordinates: [67.1800, 24.8100] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1500, 24.7850],
        [67.1800, 24.7750],
        [67.2150, 24.7900],
        [67.2200, 24.8200],
        [67.2000, 24.8500],
        [67.1650, 24.8600],
        [67.1400, 24.8350],
        [67.1500, 24.7850]
      ]]
    }
  },

  // ========================================
  // KORANGI DISTRICT
  // ========================================
  {
    town_id: "TMC-17",
    town_name: "Korangi Town",
    district: "Korangi",
    city: "Karachi",
    population: 680000,
    center: { type: 'Point', coordinates: [67.1350, 24.8250] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1100, 24.8000],
        [67.1400, 24.7950],
        [67.1500, 24.7850],
        [67.1400, 24.8350],
        [67.1650, 24.8600],
        [67.1500, 24.8700],
        [67.1200, 24.8650],
        [67.1050, 24.8350],
        [67.1100, 24.8000]
      ]]
    }
  },
  {
    town_id: "TMC-18",
    town_name: "Landhi Town",
    district: "Korangi",
    city: "Karachi",
    population: 720000,
    center: { type: 'Point', coordinates: [67.2100, 24.8350] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1800, 24.8100],
        [67.2150, 24.7900],
        [67.2450, 24.8000],
        [67.2550, 24.8300],
        [67.2400, 24.8650],
        [67.2200, 24.8700],
        [67.1800, 24.8550],
        [67.1800, 24.8100]
      ]]
    }
  },
  {
    town_id: "TMC-19",
    town_name: "Model Colony Town",
    district: "Korangi",
    city: "Karachi",
    population: 380000,
    center: { type: 'Point', coordinates: [67.1350, 24.8800] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.1200, 24.8650],
        [67.1500, 24.8700],
        [67.1650, 24.8600],
        [67.1650, 24.9000],
        [67.1500, 24.9100],
        [67.1150, 24.9000],
        [67.1050, 24.8850],
        [67.1200, 24.8650]
      ]]
    }
  },
  {
    town_id: "TMC-20",
    town_name: "Shah Faisal Town",
    district: "Korangi",
    city: "Karachi",
    population: 420000,
    center: { type: 'Point', coordinates: [67.0950, 24.8700] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0700, 24.8450],
        [67.0850, 24.8400],
        [67.1100, 24.8450],
        [67.1100, 24.8700],
        [67.1050, 24.8850],
        [67.0850, 24.9000],
        [67.0700, 24.8900],
        [67.0700, 24.8450]
      ]]
    }
  },

  // ========================================
  // SOUTH DISTRICT
  // ========================================
  {
    town_id: "TMC-21",
    town_name: "Saddar Town",
    district: "South",
    city: "Karachi",
    population: 620000,
    center: { type: 'Point', coordinates: [67.0300, 24.8550] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [67.0050, 24.8350],
        [67.0350, 24.8300],
        [67.0550, 24.8400],
        [67.0700, 24.8450],
        [67.0700, 24.8700],
        [67.0450, 24.8800],
        [67.0200, 24.8600],
        [66.9950, 24.8650],
        [67.0050, 24.8350]
      ]]
    }
  },
  {
    town_id: "TMC-22",
    town_name: "Lyari Town",
    district: "South",
    city: "Karachi",
    population: 550000,
    center: { type: 'Point', coordinates: [66.9800, 24.8450] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9550, 24.8250],
        [66.9850, 24.8200],
        [67.0050, 24.8350],
        [66.9950, 24.8650],
        [66.9700, 24.8700],
        [66.9450, 24.8550],
        [66.9400, 24.8350],
        [66.9550, 24.8250]
      ]]
    }
  },

  // ========================================
  // KEAMARI DISTRICT
  // ========================================
  {
    town_id: "TMC-23",
    town_name: "Baldia Town",
    district: "Keamari",
    city: "Karachi",
    population: 580000,
    center: { type: 'Point', coordinates: [66.9450, 24.8950] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9100, 24.8700],
        [66.9450, 24.8650],
        [66.9700, 24.8700],
        [66.9800, 24.9000],
        [66.9450, 24.8900],
        [66.9100, 24.8950],
        [66.9100, 24.9200],
        [66.9000, 24.9050],
        [66.9100, 24.8700]
      ]]
    }
  },
  {
    town_id: "TMC-24",
    town_name: "Mauripur Town",
    district: "Keamari",
    city: "Karachi",
    population: 320000,
    center: { type: 'Point', coordinates: [66.9200, 24.8250] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.8900, 24.8000],
        [66.9250, 24.7900],
        [66.9550, 24.8050],
        [66.9550, 24.8250],
        [66.9400, 24.8350],
        [66.9200, 24.8450],
        [66.8950, 24.8350],
        [66.8900, 24.8000]
      ]]
    }
  },
  {
    town_id: "TMC-25",
    town_name: "Kemari Town",
    district: "Keamari",
    city: "Karachi",
    population: 350000,
    center: { type: 'Point', coordinates: [66.9300, 24.8600] },
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [66.9100, 24.8450],
        [66.9200, 24.8450],
        [66.9450, 24.8550],
        [66.9450, 24.8650],
        [66.9100, 24.8700],
        [66.9000, 24.8600],
        [66.9100, 24.8450]
      ]]
    }
  }
];

/**
 * Color mapping for districts
 */
const DISTRICT_COLORS = {
  'Central': '#3B82F6',  // Blue
  'East': '#10B981',     // Green
  'West': '#F59E0B',     // Amber
  'Malir': '#8B5CF6',    // Purple
  'Korangi': '#EF4444',  // Red
  'South': '#EC4899',    // Pink
  'Keamari': '#06B6D4',  // Cyan
};

/**
 * Seed the database
 */
async function seedKarachiTowns() {
  try {
    console.log('🚀 Starting Karachi Towns Seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find or Create Karachi City
    console.log('📍 Setting up Karachi City...');
    let city = await City.findOne({ code: 'KHI' });
    
    if (!city) {
      city = await City.create(KARACHI_CITY);
      console.log('  ✨ Created Karachi city');
    } else {
      // Update city data
      city.set(KARACHI_CITY);
      await city.save();
      console.log('  ♻️  Updated existing Karachi city');
    }
    console.log(`  📌 City ID: ${city._id}\n`);

    // Step 2: Seed Towns
    console.log('🏘️  Seeding Towns...\n');
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const townData of KARACHI_TOWNS) {
      try {
        // Check if town exists
        let town = await Town.findOne({ code: townData.town_id });
        
        const townDoc = {
          name: townData.town_name,
          code: townData.town_id,
          city: city._id,
          center: townData.center,
          boundary: townData.boundary,
          population: townData.population,
          isActive: true,
          metadata: {
            district: townData.district,
            districtColor: DISTRICT_COLORS[townData.district] || '#6B7280',
          }
        };

        if (!town) {
          town = await Town.create(townDoc);
          console.log(`  ✅ Created: ${townData.town_name} (${townData.district})`);
          created++;
        } else {
          town.set(townDoc);
          await town.save();
          console.log(`  ♻️  Updated: ${townData.town_name} (${townData.district})`);
          updated++;
        }
      } catch (err) {
        console.error(`  ❌ Error with ${townData.town_name}: ${err.message}`);
        errors++;
      }
    }

    // Step 3: Update City Stats (manually, since UC model not loaded)
    console.log('\n📊 Updating city statistics...');
    city.stats.totalTowns = created + updated;
    await city.save();
    console.log('  ✅ City stats updated\n');

    // Summary
    console.log('=' .repeat(50));
    console.log('📋 SEEDING SUMMARY');
    console.log('=' .repeat(50));
    console.log(`  🆕 Created: ${created} towns`);
    console.log(`  ♻️  Updated: ${updated} towns`);
    console.log(`  ❌ Errors: ${errors} towns`);
    console.log(`  📍 Total: ${KARACHI_TOWNS.length} towns`);
    console.log('=' .repeat(50));

    // Verify
    const townCount = await Town.countDocuments({ city: city._id, isActive: true });
    console.log(`\n✅ Verification: ${townCount} active towns in database\n`);

    console.log('🎉 Seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seeder
seedKarachiTowns();
