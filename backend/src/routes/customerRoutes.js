
const express = require("express");
const router = express.Router();

const {
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseHistory,
  getCustomerInsights,
  getCustomerActivity,
  getCustomerSegments,
} = require("../controllers/customerController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

// Customer management requires admin or authorized staff
router.use(protect, authorizeRoles("admin", "staff"));

// View all customers
router.get(
  "/",
  authorizePermissions("customers.view"),
  getAllCustomers
);

// View customer segments
router.get(
  "/segments",
  authorizePermissions("customers.segments.view"),
  getCustomerSegments
);

// View customer purchase history
router.get(
  "/:id/purchase-history",
  authorizePermissions("customers.purchase_history.view"),
  getCustomerPurchaseHistory
);

// View customer insights
router.get(
  "/:id/insights",
  authorizePermissions("customers.insights.view"),
  getCustomerInsights
);

// View customer activity
router.get(
  "/:id/activity",
  authorizePermissions("customers.activity.view"),
  getCustomerActivity
);

// View an individual customer
router.get(
  "/:id",
  authorizePermissions("customers.view"),
  getCustomerById
);

module.exports = router;
