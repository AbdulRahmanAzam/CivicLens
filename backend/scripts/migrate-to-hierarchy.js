/**
 * Database Migration Script for CivicLens Backend Redesign
 * 
 * This script migrates existing data to the new schema:
 * 1. Migrates old roles (officer/supervisor/admin) to new roles
 * 2. Creates sample City/Town/UC hierarchy
 * 3. Assigns existing complaints to UCs based on location
 * 
 * Usage: node scripts/migrate-to-hierarchy.js [--dry-run]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { User, Complaint, Category, City, Town, UC } = require('../src/models');

const isDryRun = process.argv.includes('--dry-run');

const log = (message) => {
  const prefix = isDryRun ? '[DRY-RUN]' : '[MIGRATE]';
  console.log(`${prefix} ${message}`);
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civiclens');
    log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Migrate user roles from old system to new
 */
const migrateUserRoles = async () => {
  log('=== Migrating User Roles ===');
  
  // Role mapping: old → new
  const roleMapping = {
    superadmin: 'website_admin',
    admin: 'website_admin',
    supervisor: 'town_chairman',
    officer: 'uc_chairman',
    citizen: 'citizen',
  };

  const users = await User.find({});
  let migratedCount = 0;

  for (const user of users) {
    const oldRole = user.role;
    const newRole = roleMapping[oldRole];
    
    if (newRole && newRole !== oldRole) {
      log(`  User ${user.email}: ${oldRole} → ${newRole}`);
      
      if (!isDryRun) {
        user.role = newRole;
        await user.save();
      }
      migratedCount++;
    }
  }

  log(`Migrated ${migratedCount} user roles`);
  return migratedCount;
};

/**
 * Create sample hierarchy if none exists
 */
const createSampleHierarchy = async () => {
  log('=== Creating Sample Hierarchy ===');

  const existingCities = await City.countDocuments();
  if (existingCities > 0) {
    log('Hierarchy already exists, skipping sample creation');
    return;
  }

  if (isDryRun) {
    log('Would create: Lahore City → 4 Towns → 12 UCs');
    return;
  }

  // Create Lahore as sample city
  const lahore = await City.create({
    name: 'Lahore',
    code: 'LHR',
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [74.2, 31.4],
        [74.5, 31.4],
        [74.5, 31.6],
        [74.2, 31.6],
        [74.2, 31.4],
      ]],
    },
    population: 11000000,
  });

  log(`Created city: ${lahore.name}`);

  // Create 4 sample towns
  const towns = [
    { name: 'Data Ganj Bakhsh Town', code: 'DGB', center: [74.35, 31.55] },
    { name: 'Ravi Town', code: 'RVT', center: [74.25, 31.58] },
    { name: 'Gulberg Town', code: 'GLB', center: [74.36, 31.52] },
    { name: 'Allama Iqbal Town', code: 'AIT', center: [74.30, 31.48] },
  ];

  for (const townData of towns) {
    const town = await Town.create({
      name: townData.name,
      code: townData.code,
      city: lahore._id,
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [townData.center[0] - 0.05, townData.center[1] - 0.03],
          [townData.center[0] + 0.05, townData.center[1] - 0.03],
          [townData.center[0] + 0.05, townData.center[1] + 0.03],
          [townData.center[0] - 0.05, townData.center[1] + 0.03],
          [townData.center[0] - 0.05, townData.center[1] - 0.03],
        ]],
      },
    });

    log(`  Created town: ${town.name}`);

    // Create 3 UCs per town
    for (let i = 1; i <= 3; i++) {
      const ucCenter = [
        townData.center[0] + (i - 2) * 0.03,
        townData.center[1],
      ];

      const uc = await UC.create({
        name: `UC-${townData.code}-${i}`,
        code: `${townData.code}${i}`,
        ucNumber: i,
        town: town._id,
        city: lahore._id,
        center: {
          type: 'Point',
          coordinates: ucCenter,
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [ucCenter[0] - 0.015, ucCenter[1] - 0.02],
            [ucCenter[0] + 0.015, ucCenter[1] - 0.02],
            [ucCenter[0] + 0.015, ucCenter[1] + 0.02],
            [ucCenter[0] - 0.015, ucCenter[1] + 0.02],
            [ucCenter[0] - 0.015, ucCenter[1] - 0.02],
          ]],
        },
      });

      // Update town with UC reference
      await Town.findByIdAndUpdate(town._id, { $push: { ucs: uc._id } });

      log(`    Created UC: ${uc.name}`);
    }

    // Update city with town reference
    await City.findByIdAndUpdate(lahore._id, { $push: { towns: town._id } });
  }

  log('Sample hierarchy created successfully');
};

/**
 * Assign existing complaints to UCs based on location
 */
const assignComplaintsToUCs = async () => {
  log('=== Assigning Complaints to UCs ===');

  const complaintsWithoutUC = await Complaint.find({ ucId: { $exists: false } });
  log(`Found ${complaintsWithoutUC.length} complaints without UC assignment`);

  let assigned = 0;
  let unassigned = 0;

  for (const complaint of complaintsWithoutUC) {
    if (!complaint.location?.coordinates) {
      log(`  Complaint ${complaint.complaintId}: No coordinates, skipping`);
      unassigned++;
      continue;
    }

    const [lng, lat] = complaint.location.coordinates;

    // Try to find UC by geo-fence
    let uc = await UC.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
      },
      isActive: true,
    });

    // If no geo-fence match, find nearest UC
    if (!uc) {
      uc = await UC.findOne({
        center: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: 50000, // 50km
          },
        },
        isActive: true,
      });
    }

    if (uc) {
      log(`  Complaint ${complaint.complaintId}: → UC ${uc.name}`);
      
      if (!isDryRun) {
        complaint.ucId = uc._id;
        complaint.townId = uc.town;
        complaint.cityId = uc.city;
        
        // Calculate SLA based on category
        const category = await Category.findOne({ 
          name: complaint.category?.primary,
          isActive: true,
        });
        const slaHours = category?.slaHours || 72;
        complaint.slaDeadline = new Date(complaint.createdAt.getTime() + slaHours * 60 * 60 * 1000);
        complaint.slaHours = slaHours;
        
        // Check if already breached
        if (new Date() > complaint.slaDeadline && 
            !['resolved', 'closed', 'citizen_feedback'].includes(complaint.status?.current)) {
          complaint.slaBreach = true;
        }
        
        await complaint.save();
      }
      assigned++;
    } else {
      log(`  Complaint ${complaint.complaintId}: No UC found`);
      unassigned++;
    }
  }

  log(`Assigned: ${assigned}, Unassigned: ${unassigned}`);
  return { assigned, unassigned };
};

/**
 * Add status 'citizen_feedback' to status enum if not exists
 */
const updateStatusTransitions = async () => {
  log('=== Updating Status Transitions ===');
  
  // This is informational - the model already supports the new status
  const complaintsInResolved = await Complaint.countDocuments({ 'status.current': 'resolved' });
  log(`Found ${complaintsInResolved} complaints in 'resolved' status eligible for citizen feedback`);
  
  return complaintsInResolved;
};

/**
 * Seed SLA hours for categories if not set
 */
const seedCategorySLA = async () => {
  log('=== Seeding Category SLA Hours ===');

  const slaMapping = {
    Water: 24,
    Electricity: 12,
    Roads: 48,
    Garbage: 24,
    Others: 96,
  };

  for (const [name, slaHours] of Object.entries(slaMapping)) {
    const category = await Category.findOne({ name });
    if (category && !category.slaHours) {
      log(`  Setting SLA for ${name}: ${slaHours} hours`);
      if (!isDryRun) {
        category.slaHours = slaHours;
        await category.save();
      }
    }
  }
};

/**
 * Generate migration report
 */
const generateReport = async (stats) => {
  log('\n=== Migration Report ===');
  log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Users migrated: ${stats.usersMigrated}`);
  log(`Complaints assigned to UCs: ${stats.complaintsAssigned}`);
  log(`Complaints without UC: ${stats.complaintsUnassigned}`);
  log(`Cities: ${await City.countDocuments()}`);
  log(`Towns: ${await Town.countDocuments()}`);
  log(`UCs: ${await UC.countDocuments()}`);
  
  if (isDryRun) {
    log('\nRun without --dry-run to apply changes');
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  log('Starting CivicLens Backend Migration');
  log(`Timestamp: ${new Date().toISOString()}`);
  
  await connectDB();

  const stats = {
    usersMigrated: 0,
    complaintsAssigned: 0,
    complaintsUnassigned: 0,
  };

  try {
    // Step 1: Migrate user roles
    stats.usersMigrated = await migrateUserRoles();

    // Step 2: Create sample hierarchy if needed
    await createSampleHierarchy();

    // Step 3: Seed category SLA hours
    await seedCategorySLA();

    // Step 4: Assign complaints to UCs
    const assignmentResult = await assignComplaintsToUCs();
    stats.complaintsAssigned = assignmentResult.assigned;
    stats.complaintsUnassigned = assignmentResult.unassigned;

    // Step 5: Update status transitions info
    await updateStatusTransitions();

    // Generate report
    await generateReport(stats);

    log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('Disconnected from MongoDB');
  }
};

// Run migration
runMigration();
