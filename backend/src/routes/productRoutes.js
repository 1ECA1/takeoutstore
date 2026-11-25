
const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  createProductValidator,
  updateProductValidator,
  rejectUnknownProductFields,
  rejectEmptyProductUpdate,
  validateProduct,
} = require("../validators/productValidator");

const {
  protect,
  optionalProtect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

// Public product browsing
router.get("/", optionalProtect, getProducts);
router.get("/:id", optionalProtect, getProductById);

// Create product
router.post(
  "/",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("products.create"),
  rejectUnknownProductFields,
  createProductValidator,
  validateProduct,
  createProduct
);

// Update product
router.patch(
  "/:id",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("products.update"),
  rejectEmptyProductUpdate,
  rejectUnknownProductFields,
  updateProductValidator,
  validateProduct,
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("products.delete"),
  deleteProduct
);

module.exports = router;
