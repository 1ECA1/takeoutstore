
const express = require("express");
const router = express.Router();

const {
  initializePayment,
  verifyPayment,
} = require("../controllers/paymentController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.use(protect, authorizeRoles("customer"));

router.post("/initialize", initializePayment);
router.get("/verify/:reference", verifyPayment);

module.exports = router;
