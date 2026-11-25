
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

// Customer routes
router.post("/", protect, authorizeRoles("customer"), createOrder);
router.get("/my-orders", protect, authorizeRoles("customer"), getMyOrders);
router.get("/my-orders/:id", protect, authorizeRoles("customer"), getMyOrderById);

// Admin and authorized staff routes
router.get(
  "/",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("orders.view"),
  getAllOrders
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("orders.update_status"),
  updateOrderStatus
);

module.exports = router;
