const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Public: view categories
router.get("/", getCategories);

// Admin only: manage categories
router.post("/", protect, authorizeRoles("admin"), createCategory);
router.patch("/:id", protect, authorizeRoles("admin"), updateCategory);
router.delete("/:id", protect, authorizeRoles("admin"), deleteCategory);

module.exports = router;