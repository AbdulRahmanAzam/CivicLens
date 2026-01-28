/**
 * Hierarchy Controller
 * Handles City → Town → UC management operations
 */

const { City, Town, UC, User, AuditLog } = require('../models');
const ucAssignmentService = require('../services/ucAssignmentService');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// =====================
// CITY OPERATIONS
// =====================

/**
 * @desc    Create a new city
 * @route   POST /api/hierarchy/cities
 * @access  Website Admin only
 */
exports.createCity = asyncHandler(async (req, res, next) => {
  const { name, code, boundary, population, area } = req.body;

  // Check for duplicate code
  const existingCity = await City.findOne({ code: code.toUpperCase() });
  if (existingCity) {
    return next(new ErrorResponse(`City with code ${code} already exists`, 400));
  }

  const city = await City.create({
    name,
    code: code.toUpperCase(),
    boundary,
    population,
    area,
  });

  // Audit log
  await AuditLog.logAction({
    action: 'city_created',
    actor: req.user._id,
    target: { type: 'city', id: city._id },
    details: { name, code },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    data: city,
  });
});

/**
 * @desc    Get all cities
 * @route   GET /api/hierarchy/cities
 * @access  Authenticated users
 */
exports.getCities = asyncHandler(async (req, res, next) => {
  const { includeStats, includeInactive } = req.query;

  const query = includeInactive === 'true' ? {} : { isActive: true };
  
  let cities = await City.find(query)
    .populate('mayor', 'name email')
    .select('-boundary') // Exclude large boundary data by default
    .sort({ name: 1 });

  if (includeStats === 'true') {
    cities = await Promise.all(cities.map(async (city) => {
      const townCount = await Town.countDocuments({ city: city._id, isActive: true });
      const ucCount = await UC.countDocuments({ city: city._id, isActive: true });
      return {
        ...city.toObject(),
        stats: { townCount, ucCount },
      };
    }));
  }

  res.status(200).json({
    success: true,
    count: cities.length,
    data: cities,
  });
});

/**
 * @desc    Get single city with details
 * @route   GET /api/hierarchy/cities/:cityId
 * @access  Authenticated users
 */
exports.getCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const { includeTowns, includeStats } = req.query;

  let city = await City.findById(cityId)
    .populate('mayor', 'name email');

  if (!city) {
    return next(new ErrorResponse('City not found', 404));
  }

  const result = city.toObject();

  if (includeTowns === 'true') {
    result.towns = await Town.find({ city: city._id, isActive: true })
      .populate('townChairman', 'name email')
      .select('name code population townChairman');
  }

  if (includeStats === 'true') {
    result.stats = await city.getStats();
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Update city
 * @route   PUT /api/hierarchy/cities/:cityId
 * @access  Website Admin only
 */
exports.updateCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const updates = req.body;

  // Prevent updating certain fields directly
  delete updates.mayor;
  delete updates.towns;

  const city = await City.findByIdAndUpdate(cityId, updates, {
    new: true,
    runValidators: true,
  });

  if (!city) {
    return next(new ErrorResponse('City not found', 404));
  }

  // Audit log
  await AuditLog.logAction({
    action: 'city_updated',
    actor: req.user._id,
    target: { type: 'city', id: city._id },
    details: { updates: Object.keys(updates) },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    data: city,
  });
});

/**
 * @desc    Deactivate city (soft delete)
 * @route   DELETE /api/hierarchy/cities/:cityId
 * @access  Website Admin only
 */
exports.deactivateCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;

  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse('City not found', 404));
  }

  // Check if city has active complaints
  const { Complaint } = require('../models');
  const activeComplaints = await Complaint.countDocuments({
    cityId,
    status: { $nin: ['closed', 'resolved'] },
  });

  if (activeComplaints > 0) {
    return next(new ErrorResponse(`Cannot deactivate city with ${activeComplaints} active complaints`, 400));
  }

  city.isActive = false;
  await city.save();

  // Also deactivate all towns and UCs
  await Town.updateMany({ city: cityId }, { isActive: false });
  await UC.updateMany({ city: cityId }, { isActive: false });

  // Audit log
  await AuditLog.logAction({
    action: 'city_deactivated',
    actor: req.user._id,
    target: { type: 'city', id: city._id },
    details: { name: city.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'City deactivated successfully',
  });
});

// =====================
// TOWN OPERATIONS
// =====================

/**
 * @desc    Create a new town
 * @route   POST /api/hierarchy/cities/:cityId/towns
 * @access  Website Admin, Mayor (own city)
 */
exports.createTown = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const { name, code, boundary, population, area } = req.body;

  // Verify city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse('City not found', 404));
  }

  // Check permission for mayor
  if (req.user.role === 'mayor' && req.user.city?.toString() !== cityId) {
    return next(new ErrorResponse('Not authorized to create towns in this city', 403));
  }

  // Check for duplicate code within city
  const existingTown = await Town.findOne({ 
    city: cityId, 
    code: code.toUpperCase() 
  });
  if (existingTown) {
    return next(new ErrorResponse(`Town with code ${code} already exists in this city`, 400));
  }

  const town = await Town.create({
    name,
    code: code.toUpperCase(),
    city: cityId,
    boundary,
    population,
    area,
  });

  // Add town to city's towns array
  await City.findByIdAndUpdate(cityId, { $push: { towns: town._id } });

  // Audit log
  await AuditLog.logAction({
    action: 'town_created',
    actor: req.user._id,
    target: { type: 'town', id: town._id },
    details: { name, code, cityId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    data: town,
  });
});

/**
 * @desc    Get towns in a city
 * @route   GET /api/hierarchy/cities/:cityId/towns
 * @access  Authenticated users
 */
exports.getTowns = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const { includeStats, includeInactive } = req.query;

  const query = { city: cityId };
  if (includeInactive !== 'true') {
    query.isActive = true;
  }

  let towns = await Town.find(query)
    .populate('townChairman', 'name email')
    .select('-boundary')
    .sort({ name: 1 });

  if (includeStats === 'true') {
    towns = await Promise.all(towns.map(async (town) => {
      const ucCount = await UC.countDocuments({ town: town._id, isActive: true });
      return {
        ...town.toObject(),
        stats: { ucCount },
      };
    }));
  }

  res.status(200).json({
    success: true,
    count: towns.length,
    data: towns,
  });
});

/**
 * @desc    Get single town with details
 * @route   GET /api/hierarchy/towns/:townId
 * @access  Authenticated users
 */
exports.getTown = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;
  const { includeUCs, includeStats } = req.query;

  let town = await Town.findById(townId)
    .populate('townChairman', 'name email')
    .populate('city', 'name code');

  if (!town) {
    return next(new ErrorResponse('Town not found', 404));
  }

  const result = town.toObject();

  if (includeUCs === 'true') {
    result.ucs = await UC.find({ town: town._id, isActive: true })
      .populate('chairman', 'name email')
      .select('name code ucNumber population chairman');
  }

  if (includeStats === 'true') {
    result.stats = await town.getStats();
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Update town
 * @route   PUT /api/hierarchy/towns/:townId
 * @access  Website Admin, Mayor (own city)
 */
exports.updateTown = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;
  const updates = req.body;

  const town = await Town.findById(townId);
  if (!town) {
    return next(new ErrorResponse('Town not found', 404));
  }

  // Check permission for mayor
  if (req.user.role === 'mayor' && req.user.city?.toString() !== town.city.toString()) {
    return next(new ErrorResponse('Not authorized to update this town', 403));
  }

  // Prevent updating certain fields directly
  delete updates.townChairman;
  delete updates.ucs;
  delete updates.city;

  const updatedTown = await Town.findByIdAndUpdate(townId, updates, {
    new: true,
    runValidators: true,
  });

  // Audit log
  await AuditLog.logAction({
    action: 'town_updated',
    actor: req.user._id,
    target: { type: 'town', id: town._id },
    details: { updates: Object.keys(updates) },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    data: updatedTown,
  });
});

/**
 * @desc    Deactivate town (soft delete)
 * @route   DELETE /api/hierarchy/towns/:townId
 * @access  Website Admin, Mayor (own city)
 */
exports.deactivateTown = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;

  const town = await Town.findById(townId);
  if (!town) {
    return next(new ErrorResponse('Town not found', 404));
  }

  // Check permission for mayor
  if (req.user.role === 'mayor' && req.user.city?.toString() !== town.city.toString()) {
    return next(new ErrorResponse('Not authorized to deactivate this town', 403));
  }

  // Check for active complaints
  const { Complaint } = require('../models');
  const activeComplaints = await Complaint.countDocuments({
    townId,
    status: { $nin: ['closed', 'resolved'] },
  });

  if (activeComplaints > 0) {
    return next(new ErrorResponse(`Cannot deactivate town with ${activeComplaints} active complaints`, 400));
  }

  town.isActive = false;
  await town.save();

  // Also deactivate all UCs
  await UC.updateMany({ town: townId }, { isActive: false });

  // Audit log
  await AuditLog.logAction({
    action: 'town_deactivated',
    actor: req.user._id,
    target: { type: 'town', id: town._id },
    details: { name: town.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'Town deactivated successfully',
  });
});

// =====================
// UC OPERATIONS
// =====================

/**
 * @desc    Create a new UC
 * @route   POST /api/hierarchy/towns/:townId/ucs
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.createUC = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;
  const { name, code, ucNumber, boundary, center, population, area, slaMultiplier } = req.body;

  // Verify town exists
  const town = await Town.findById(townId).populate('city');
  if (!town) {
    return next(new ErrorResponse('Town not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && req.user.city?.toString() !== town.city._id.toString()) {
    return next(new ErrorResponse('Not authorized to create UCs in this city', 403));
  }
  if (req.user.role === 'town_chairman' && req.user.town?.toString() !== townId) {
    return next(new ErrorResponse('Not authorized to create UCs in this town', 403));
  }

  // Check for duplicate code/number within town
  const existingUC = await UC.findOne({ 
    town: townId, 
    $or: [
      { code: code.toUpperCase() },
      { ucNumber }
    ]
  });
  if (existingUC) {
    return next(new ErrorResponse(`UC with code ${code} or number ${ucNumber} already exists in this town`, 400));
  }

  const uc = await UC.create({
    name,
    code: code.toUpperCase(),
    ucNumber,
    town: townId,
    city: town.city._id,
    boundary,
    center,
    population,
    area,
    slaMultiplier: slaMultiplier || 1.0,
  });

  // Add UC to town's ucs array
  await Town.findByIdAndUpdate(townId, { $push: { ucs: uc._id } });

  // Audit log
  await AuditLog.logAction({
    action: 'uc_created',
    actor: req.user._id,
    target: { type: 'uc', id: uc._id },
    details: { name, code, ucNumber, townId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    data: uc,
  });
});

/**
 * @desc    Get UCs in a town
 * @route   GET /api/hierarchy/towns/:townId/ucs
 * @access  Authenticated users
 */
exports.getUCs = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;
  const { includeStats, includeInactive } = req.query;

  const query = { town: townId };
  if (includeInactive !== 'true') {
    query.isActive = true;
  }

  let ucs = await UC.find(query)
    .populate('chairman', 'name email')
    .select('-boundary')
    .sort({ ucNumber: 1 });

  if (includeStats === 'true') {
    const { Complaint } = require('../models');
    ucs = await Promise.all(ucs.map(async (uc) => {
      const complaintCount = await Complaint.countDocuments({ ucId: uc._id });
      const pendingCount = await Complaint.countDocuments({ 
        ucId: uc._id, 
        status: { $in: ['submitted', 'acknowledged', 'in_progress'] }
      });
      return {
        ...uc.toObject(),
        stats: { complaintCount, pendingCount },
      };
    }));
  }

  res.status(200).json({
    success: true,
    count: ucs.length,
    data: ucs,
  });
});

/**
 * @desc    Get single UC with details
 * @route   GET /api/hierarchy/ucs/:ucId
 * @access  Authenticated users
 */
exports.getUC = asyncHandler(async (req, res, next) => {
  const { ucId } = req.params;
  const { includeStats, includeBoundary } = req.query;

  const select = includeBoundary === 'true' ? '' : '-boundary';
  
  let uc = await UC.findById(ucId)
    .populate('chairman', 'name email')
    .populate('town', 'name code')
    .populate('city', 'name code')
    .select(select);

  if (!uc) {
    return next(new ErrorResponse('UC not found', 404));
  }

  const result = uc.toObject();

  if (includeStats === 'true') {
    result.stats = await uc.getStats();
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Update UC
 * @route   PUT /api/hierarchy/ucs/:ucId
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.updateUC = asyncHandler(async (req, res, next) => {
  const { ucId } = req.params;
  const updates = req.body;

  const uc = await UC.findById(ucId);
  if (!uc) {
    return next(new ErrorResponse('UC not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && req.user.city?.toString() !== uc.city.toString()) {
    return next(new ErrorResponse('Not authorized to update this UC', 403));
  }
  if (req.user.role === 'town_chairman' && req.user.town?.toString() !== uc.town.toString()) {
    return next(new ErrorResponse('Not authorized to update this UC', 403));
  }

  // Prevent updating certain fields directly
  delete updates.chairman;
  delete updates.town;
  delete updates.city;

  const updatedUC = await UC.findByIdAndUpdate(ucId, updates, {
    new: true,
    runValidators: true,
  });

  // Audit log
  await AuditLog.logAction({
    action: 'uc_updated',
    actor: req.user._id,
    target: { type: 'uc', id: uc._id },
    details: { updates: Object.keys(updates) },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    data: updatedUC,
  });
});

/**
 * @desc    Deactivate UC (soft delete)
 * @route   DELETE /api/hierarchy/ucs/:ucId
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.deactivateUC = asyncHandler(async (req, res, next) => {
  const { ucId } = req.params;

  const uc = await UC.findById(ucId);
  if (!uc) {
    return next(new ErrorResponse('UC not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && req.user.city?.toString() !== uc.city.toString()) {
    return next(new ErrorResponse('Not authorized to deactivate this UC', 403));
  }
  if (req.user.role === 'town_chairman' && req.user.town?.toString() !== uc.town.toString()) {
    return next(new ErrorResponse('Not authorized to deactivate this UC', 403));
  }

  // Check for active complaints
  const { Complaint } = require('../models');
  const activeComplaints = await Complaint.countDocuments({
    ucId,
    status: { $nin: ['closed', 'resolved'] },
  });

  if (activeComplaints > 0) {
    return next(new ErrorResponse(`Cannot deactivate UC with ${activeComplaints} active complaints`, 400));
  }

  uc.isActive = false;
  await uc.save();

  // Audit log
  await AuditLog.logAction({
    action: 'uc_deactivated',
    actor: req.user._id,
    target: { type: 'uc', id: uc._id },
    details: { name: uc.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'UC deactivated successfully',
  });
});

// =====================
// HIERARCHY UTILITIES
// =====================

/**
 * @desc    Get full hierarchy tree
 * @route   GET /api/hierarchy/tree
 * @access  Authenticated users
 */
exports.getHierarchyTree = asyncHandler(async (req, res, next) => {
  const { cityId } = req.query;
  
  const tree = await ucAssignmentService.getHierarchyTree(cityId || null);

  res.status(200).json({
    success: true,
    data: tree,
  });
});

/**
 * @desc    Find UC by location
 * @route   POST /api/hierarchy/find-uc
 * @access  Authenticated users
 */
exports.findUCByLocation = asyncHandler(async (req, res, next) => {
  const { longitude, latitude } = req.body;

  if (!longitude || !latitude) {
    return next(new ErrorResponse('Longitude and latitude are required', 400));
  }

  const assignment = await ucAssignmentService.assignByLocation(longitude, latitude);

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

/**
 * @desc    Get nearby UCs for manual selection
 * @route   POST /api/hierarchy/nearby-ucs
 * @access  Authenticated users
 */
exports.getNearbyUCs = asyncHandler(async (req, res, next) => {
  const { longitude, latitude, limit } = req.body;

  if (!longitude || !latitude) {
    return next(new ErrorResponse('Longitude and latitude are required', 400));
  }

  const nearbyUCs = await ucAssignmentService.getNearbyUCs(
    longitude, 
    latitude, 
    limit || 10
  );

  res.status(200).json({
    success: true,
    count: nearbyUCs.length,
    data: nearbyUCs,
  });
});

/**
 * @desc    Assign mayor to city
 * @route   PATCH /api/v1/hierarchy/cities/:cityId/assign-mayor
 * @access  Website Admin only
 */
exports.assignMayorToCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('User ID is required', 400));
  }

  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse('City not found', 404));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'mayor') {
    return next(new ErrorResponse('User must have mayor role', 400));
  }

  // Check if user is already assigned to another city
  if (user.city && user.city.toString() !== cityId) {
    return next(new ErrorResponse('User is already assigned to another city', 400));
  }

  // Update city
  city.mayor = userId;
  await city.save();

  // Update user
  user.city = cityId;
  await user.save();

  // Audit log
  await AuditLog.logAction({
    action: 'mayor_assigned',
    actor: req.user._id,
    target: { type: 'city', id: city._id },
    details: { mayorId: userId, mayorName: user.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'Mayor assigned to city successfully',
    data: {
      city: {
        id: city._id,
        name: city.name,
      },
      mayor: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

/**
 * @desc    Assign town chairman to town
 * @route   PATCH /api/v1/hierarchy/towns/:townId/assign-chairman
 * @access  Website Admin, Mayor (own city only)
 */
exports.assignTownChairman = asyncHandler(async (req, res, next) => {
  const { townId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('User ID is required', 400));
  }

  const town = await Town.findById(townId).populate('city');
  if (!town) {
    return next(new ErrorResponse('Town not found', 404));
  }

  // Check permissions: mayor can only assign in their city
  if (req.user.role === 'mayor' && req.user.city?.toString() !== town.city._id.toString()) {
    return next(new ErrorResponse('Not authorized to assign chairman in this town', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'town_chairman') {
    return next(new ErrorResponse('User must have town_chairman role', 400));
  }

  // Check if user is already assigned to another town
  if (user.town && user.town.toString() !== townId) {
    return next(new ErrorResponse('User is already assigned to another town', 400));
  }

  // Update town
  town.townChairman = userId;
  await town.save();

  // Update user
  user.town = townId;
  user.city = town.city._id;
  await user.save();

  // Audit log
  await AuditLog.logAction({
    action: 'town_chairman_assigned',
    actor: req.user._id,
    target: { type: 'town', id: town._id },
    details: { chairmanId: userId, chairmanName: user.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'Town chairman assigned successfully',
    data: {
      town: {
        id: town._id,
        name: town.name,
      },
      chairman: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

/**
 * @desc    Assign UC chairman to UC
 * @route   PATCH /api/v1/hierarchy/ucs/:ucId/assign-chairman
 * @access  Website Admin, Mayor (own city), Town Chairman (own town)
 */
exports.assignUCChairman = asyncHandler(async (req, res, next) => {
  const { ucId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorResponse('User ID is required', 400));
  }

  const uc = await UC.findById(ucId).populate('town city');
  if (!uc) {
    return next(new ErrorResponse('UC not found', 404));
  }

  // Check permissions
  if (req.user.role === 'mayor' && req.user.city?.toString() !== uc.city._id.toString()) {
    return next(new ErrorResponse('Not authorized to assign chairman in this UC', 403));
  }
  if (req.user.role === 'town_chairman' && req.user.town?.toString() !== uc.town._id.toString()) {
    return next(new ErrorResponse('Not authorized to assign chairman in this UC', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'uc_chairman') {
    return next(new ErrorResponse('User must have uc_chairman role', 400));
  }

  // Check if user is already assigned to another UC
  if (user.uc && user.uc.toString() !== ucId) {
    return next(new ErrorResponse('User is already assigned to another UC', 400));
  }

  // Update UC
  uc.chairman = userId;
  await uc.save();

  // Update user
  user.uc = ucId;
  user.town = uc.town._id;
  user.city = uc.city._id;
  await user.save();

  // Audit log
  await AuditLog.logAction({
    action: 'uc_chairman_assigned',
    actor: req.user._id,
    target: { type: 'uc', id: uc._id },
    details: { chairmanId: userId, chairmanName: user.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'UC chairman assigned successfully',
    data: {
      uc: {
        id: uc._id,
        name: uc.name,
      },
      chairman: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

/**
 * @desc    Get hierarchy statistics
 * @route   GET /api/hierarchy/stats
 * @access  Website Admin, Mayor
 */
exports.getHierarchyStats = asyncHandler(async (req, res, next) => {
  const cityCount = await City.countDocuments({ isActive: true });
  const townCount = await Town.countDocuments({ isActive: true });
  const ucCount = await UC.countDocuments({ isActive: true });

  const ucsWithChairman = await UC.countDocuments({ 
    isActive: true, 
    chairman: { $exists: true, $ne: null } 
  });
  const townsWithChairman = await Town.countDocuments({ 
    isActive: true, 
    townChairman: { $exists: true, $ne: null } 
  });
  const citiesWithMayor = await City.countDocuments({ 
    isActive: true, 
    mayor: { $exists: true, $ne: null } 
  });

  const assignmentStats = await ucAssignmentService.getAssignmentStats(30);

  res.status(200).json({
    success: true,
    data: {
      counts: {
        cities: cityCount,
        towns: townCount,
        ucs: ucCount,
      },
      coverage: {
        ucsWithChairman,
        ucsWithoutChairman: ucCount - ucsWithChairman,
        townsWithChairman,
        townsWithoutChairman: townCount - townsWithChairman,
        citiesWithMayor,
        citiesWithoutMayor: cityCount - citiesWithMayor,
      },
      assignments: assignmentStats,
    },
  });
});
