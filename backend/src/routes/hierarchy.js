/**
 * Hierarchy Routes
 * Routes for City → Town → UC management
 */

const express = require('express');
const router = express.Router();

const {
  createCity,
  getCities,
  getCity,
  updateCity,
  deactivateCity,
  createTown,
  getTowns,
  getTown,
  updateTown,
  deactivateTown,
  createUC,
  getUCs,
  getUC,
  updateUC,
  deactivateUC,
  getHierarchyTree,
  findUCByLocation,
  getNearbyUCs,
  getHierarchyStats,
} = require('../controllers/hierarchyController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply authentication to all routes
router.use(protect);

// =====================
// UTILITY ROUTES
// =====================

// Get full hierarchy tree (for dropdowns, navigation)
router.get('/tree', getHierarchyTree);

// Find UC by geographic location
router.post('/find-uc', findUCByLocation);

// Get nearby UCs for manual selection
router.post('/nearby-ucs', getNearbyUCs);

// Get hierarchy statistics (admin only)
router.get('/stats', authorize('website_admin', 'mayor'), getHierarchyStats);

// =====================
// CITY ROUTES
// =====================

router.route('/cities')
  .get(getCities)
  .post(authorize('website_admin'), createCity);

router.route('/cities/:cityId')
  .get(getCity)
  .put(authorize('website_admin'), updateCity)
  .delete(authorize('website_admin'), deactivateCity);

// =====================
// TOWN ROUTES
// =====================

// Towns within a city
router.route('/cities/:cityId/towns')
  .get(getTowns)
  .post(authorize('website_admin', 'mayor'), createTown);

// Direct town access
router.route('/towns/:townId')
  .get(getTown)
  .put(authorize('website_admin', 'mayor'), updateTown)
  .delete(authorize('website_admin', 'mayor'), deactivateTown);

// =====================
// UC ROUTES
// =====================

// UCs within a town
router.route('/towns/:townId/ucs')
  .get(getUCs)
  .post(authorize('website_admin', 'mayor', 'town_chairman'), createUC);

// Direct UC access
router.route('/ucs/:ucId')
  .get(getUC)
  .put(authorize('website_admin', 'mayor', 'town_chairman'), updateUC)
  .delete(authorize('website_admin', 'mayor', 'town_chairman'), deactivateUC);

module.exports = router;
