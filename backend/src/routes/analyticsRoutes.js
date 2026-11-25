const express = require("express");
const router = express.Router();

const {
  getSalesOverview,
  getBestSellingProducts,
  getSalesReports,
  getProductPerformance,
  getLowPerformingProducts,
  getCustomerRetentionAnalytics,
  getRevenueByPaymentMethod,
  getOrderStatusAnalytics,
  getDashboardSummary,
} = require("../controllers/analyticsController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Admin-only analytics routes
router.use(protect, authorizeRoles("admin"));

// Sales overview
router.get("/sales-overview", getSalesOverview);

// Best-selling products
router.get("/best-selling-products", getBestSellingProducts);

// Daily, weekly, and monthly sales reports
router.get("/sales-reports", getSalesReports);

router.get("/product-performance", getProductPerformance);

router.get("/low-performing-products", getLowPerformingProducts);

router.get("/customer-retention", getCustomerRetentionAnalytics);

router.get("/revenue-by-payment-method", getRevenueByPaymentMethod);

router.get("/order-status", getOrderStatusAnalytics);

router.get("/dashboard-summary", getDashboardSummary);

module.exports = router;
