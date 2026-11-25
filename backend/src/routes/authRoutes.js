
const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/authController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Customer registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Protected current-user profile
router.get("/me", protect, getMe);

// Update the currently authenticated user's profile
router.patch("/me", protect, updateMe);

router.patch("/change-password", protect, changePassword);
// Temporary RBAC testing routes

// Admin only
router.get(
  "/test-admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Admin access granted",
    });
  }
);

// Staff and admin
router.get(
  "/test-staff",
  protect,
  authorizeRoles("admin", "staff"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Staff access granted",
    });
  }
);

// Customer only
router.get(
  "/test-customer",
  protect,
  authorizeRoles("customer"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Customer access granted",
    });
  }
);

module.exports = router;
