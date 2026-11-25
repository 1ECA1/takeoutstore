
const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStockProducts,
  adjustStock,
  getInventoryLogs,
  getInventoryAnalytics,
} = require("../controllers/inventoryController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

// All inventory routes require authentication and an authorized role
router.use(protect, authorizeRoles("admin", "staff"));

// View inventory
router.get(
  "/",
  authorizePermissions("inventory.view"),
  getInventory
);

// View low-stock products
router.get(
  "/low-stock",
  authorizePermissions("inventory.view"),
  getLowStockProducts
);

// View inventory logs
router.get(
  "/logs",
  authorizePermissions("inventory.logs.view"),
  getInventoryLogs
);

// Adjust stock
router.patch(
  "/adjust",
  authorizePermissions("inventory.adjust"),
  adjustStock
);

// View inventory analytics
router.get(
  "/analytics",
  authorizePermissions("inventory.analytics.view"),
  getInventoryAnalytics
);

module.exports = router;
