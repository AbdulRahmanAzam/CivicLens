/**
 * Authentication Routes
 * Handles user registration, login, logout, password management, and user administration
 */

const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { handleValidation } = require("../middlewares/validateRequest");

const {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
} = require("../controllers/authController");

const {
  protect,
  authorize,
  requireVerified,
  authRateLimiter,
  auditAuth,
} = require("../middlewares/authMiddleware");

// ==================== VALIDATION RULES ====================

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage("Please provide a valid phone number"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage(
    //   "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    // ),
    .matches(/^[A-Za-z0-9]{8,}$/)
    .withMessage(
      "Password must contain atleast 8 characteres or numbers"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password"),
  handleValidation,
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your new password"),
  handleValidation,
];

const resetPasswordValidation = [
  param("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password"),
  handleValidation,
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage("Please provide a valid phone number"),
  handleValidation,
];

const createUserValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["citizen", "uc_chairman", "town_chairman", "mayor", "website_admin"])
    .withMessage("Invalid role"),
  handleValidation,
];

const updateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("role")
    .optional()
    .isIn(["citizen", "uc_chairman", "town_chairman", "mayor", "website_admin"])
    .withMessage("Invalid role"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("isVerified")
    .optional()
    .isBoolean()
    .withMessage("isVerified must be a boolean"),
  handleValidation,
];

const getUsersValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("role")
    .optional()
    .isIn(["citizen", "uc_chairman", "town_chairman", "mayor", "website_admin"])
    .withMessage("Invalid role"),
  handleValidation,
];

// ==================== PUBLIC ROUTES ====================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerValidation, auditAuth("REGISTER"), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & get tokens
 * @access  Public
 */
router.post(
  "/login",
  authRateLimiter,
  loginValidation,
  auditAuth("LOGIN"),
  login,
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh-token", refreshToken);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  body("email").isEmail().withMessage("Please provide a valid email"),
  handleValidation,
  forgotPassword,
);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password/:token", resetPasswordValidation, resetPassword);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get("/verify-email/:token", verifyEmail);

// ==================== PROTECTED ROUTES (Authenticated Users) ====================

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current session
 * @access  Private
 */
router.post("/logout", protect, auditAuth("LOGOUT"), logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post("/logout-all", protect, auditAuth("LOGOUT_ALL"), logoutAll);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", protect, getMe);

/**
 * @route   PATCH /api/v1/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", protect, updateProfileValidation, updateMe);

/**
 * @route   DELETE /api/v1/auth/me
 * @desc    Delete own account
 * @access  Private
 */
router.delete(
  "/me",
  protect,
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
  auditAuth("DELETE_ACCOUNT"),
  deleteMe,
);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.patch(
  "/change-password",
  protect,
  changePasswordValidation,
  auditAuth("PASSWORD_CHANGE"),
  changePassword,
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post("/resend-verification", protect, resendVerification);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/v1/auth/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get(
  "/users",
  protect,
  authorize("website_admin"),
  getUsersValidation,
  getAllUsers,
);

/**
 * @route   POST /api/v1/auth/users
 * @desc    Create a new user (admin)
 * @access  Private/Admin
 */
router.post(
  "/users",
  protect,
  authorize("website_admin"),
  createUserValidation,
  auditAuth("ADMIN_CREATE_USER"),
  createUser,
);

/**
 * @route   GET /api/v1/auth/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get(
  "/users/:id",
  protect,
  authorize("website_admin"),
  param("id").isMongoId().withMessage("Invalid user ID"),
  handleValidation,
  getUser,
);

/**
 * @route   PATCH /api/v1/auth/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.patch(
  "/users/:id",
  protect,
  authorize("website_admin"),
  updateUserValidation,
  auditAuth("ADMIN_UPDATE_USER"),
  updateUser,
);

/**
 * @route   DELETE /api/v1/auth/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete(
  "/users/:id",
  protect,
  authorize("website_admin"),
  param("id").isMongoId().withMessage("Invalid user ID"),
  handleValidation,
  auditAuth("ADMIN_DELETE_USER"),
  deleteUser,
);

module.exports = router;
