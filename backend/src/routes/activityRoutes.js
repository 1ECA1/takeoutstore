const express = require("express");
const router = express.Router();

const {
  getCustomerActivity,
  getAllActivityLogs,
} = require("../controllers/activityController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Admin-only activity routes
router.use(protect, authorizeRoles("admin"));

// Get all platform activity
router.get("/", getAllActivityLogs);

// Get activity for a specific customer
router.get("/customer/:id", getCustomerActivity);

module.exports = router;