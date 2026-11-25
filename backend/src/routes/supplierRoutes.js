
const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierAnalytics,
} = require("../controllers/supplierController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

// Require authentication and an authorized role
router.use(protect, authorizeRoles("admin", "staff"));

// Supplier analytics
router.get(
  "/analytics",
  authorizePermissions("suppliers.analytics.view"),
  getSupplierAnalytics
);

// Supplier listing and creation
router.route("/")
  .post(
    authorizePermissions("suppliers.create"),
    createSupplier
  )
  .get(
    authorizePermissions("suppliers.view"),
    getSuppliers
  );

// Individual supplier operations
router.route("/:id")
  .get(
    authorizePermissions("suppliers.view"),
    getSupplierById
  )
  .patch(
    authorizePermissions("suppliers.update"),
    updateSupplier
  )
  .delete(
    authorizePermissions("suppliers.delete"),
    deleteSupplier
  );

module.exports = router;
