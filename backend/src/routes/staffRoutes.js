
const express = require("express");

const router = express.Router();

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} = require("../controllers/staffController");

const {
  getStaffDashboard,
} = require("../controllers/staffDashboardController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Staff dashboard - authenticated staff members only
// IMPORTANT: This route must appear before /:id
router.get(
  "/dashboard",
  protect,
  authorizeRoles("staff"),
  getStaffDashboard
);

// Only authenticated administrators can create staff accounts
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createStaff
);

// Only administrators can view all staff accounts
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllStaff
);

// Only administrators can view an individual staff account
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getStaffById
);

// Only administrators can update staff account status
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateStaffStatus
);

// Only administrators can update staff account details
router.patch(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateStaff
);

module.exports = router;
