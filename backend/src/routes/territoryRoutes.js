/**
 * Territory Routes
 * Provides territory data for map visualization and admin management
 */

const express = require('express');
const router = express.Router();

const {
  getTerritories,
  getUCList,
  getTownList,
  getTerritory,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  getCities,
} = require('../controllers/territoryController');

const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');

// =====================
// PUBLIC ROUTES (for map visualization)
// =====================

// Get territories with boundaries (public for map)
// GET /api/v1/territories?level=UC&city=Karachi
router.get('/', getTerritories);

// Get UC list (without boundaries)
router.get('/ucs', getUCList);

// Get Town list (without boundaries)
router.get('/towns', getTownList);

// Get cities list
router.get('/cities', getCities);

// =====================
// PROTECTED ROUTES (for admin management)
// =====================

// Get single territory by ID
router.get('/:id', optionalAuth, getTerritory);

// Create territory (admin only)
router.post('/', protect, authorize('website_admin', 'mayor'), createTerritory);

// Update territory (admin only)
router.put('/:id', protect, authorize('website_admin', 'mayor', 'town_chairman'), updateTerritory);

// Delete (deactivate) territory (admin only)
router.delete('/:id', protect, authorize('website_admin'), deleteTerritory);

module.exports = router;
