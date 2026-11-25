const Order = require("../models/Order");
const Product = require("../models/Product");

// Admin: Get sales overview
const getSalesOverview = async (req, res) => {
  try {
    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      salesData,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: "pending" }),
      Order.countDocuments({ orderStatus: "cancelled" }),

      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]),
    ]);

    const totalRevenue = salesData[0]?.totalRevenue || 0;
    const averageOrderValue = salesData[0]?.averageOrderValue || 0;

    return res.status(200).json({
      status: "success",
      data: {
        totalOrders,
        paidOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Sales overview error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve sales overview",
    });
  }
};

// Admin: Get best-selling products
const getBestSellingProducts = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const products = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.name" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },
      { $sort: { totalQuantitySold: -1, totalRevenue: -1 } },
      { $limit: limit },
    ]);

    return res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    console.error("Best-selling products error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve best-selling products",
    });
  }
};

// Admin: Get sales reports grouped by date
const getSalesReports = async (req, res) => {
  try {
    const { period = "daily" } = req.query;

    const periodFormats = {
      daily: "%Y-%m-%d",
      weekly: "%G-W%V",
      monthly: "%Y-%m",
    };

    if (!periodFormats[period]) {
      return res.status(400).json({
        status: "error",
        message: "Period must be daily, weekly, or monthly",
      });
    }

    const reports = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: periodFormats[period],
              date: "$createdAt",
            },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return res.status(200).json({
      status: "success",
      period,
      results: reports.length,
      data: { reports },
    });
  } catch (error) {
    console.error("Sales reports error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve sales reports",
    });
  }
};

// Admin: Get product performance analytics
const getProductPerformance = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
              $match: {
                $expr: {
                  $eq: ["$items.product", "$$productId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalQuantitySold: { $sum: "$items.quantity" },
                totalRevenue: {
                  $sum: {
                    $multiply: ["$items.price", "$items.quantity"],
                  },
                },
              },
            },
          ],
          as: "sales",
        },
      },
      {
        $addFields: {
          totalQuantitySold: {
            $ifNull: [
              { $arrayElemAt: ["$sales.totalQuantitySold", 0] },
              0,
            ],
          },
          totalRevenue: {
            $ifNull: [
              { $arrayElemAt: ["$sales.totalRevenue", 0] },
              0,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          stockQuantity: 1,
          status: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantitySold: -1, totalRevenue: -1 } },
    ]);

    return res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    console.error("Product performance error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve product performance",
    });
  }
};

// Admin: Get low-performing products
const getLowPerformingProducts = async (req, res) => {
  try {
    const threshold = Math.max(Number(req.query.threshold) || 5, 0);

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
              $match: {
                $expr: {
                  $eq: ["$items.product", "$$productId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalQuantitySold: { $sum: "$items.quantity" },
                totalRevenue: {
                  $sum: {
                    $multiply: ["$items.price", "$items.quantity"],
                  },
                },
              },
            },
          ],
          as: "sales",
        },
      },
      {
        $addFields: {
          totalQuantitySold: {
            $ifNull: [
              { $arrayElemAt: ["$sales.totalQuantitySold", 0] },
              0,
            ],
          },
          totalRevenue: {
            $ifNull: [
              { $arrayElemAt: ["$sales.totalRevenue", 0] },
              0,
            ],
          },
        },
      },
      {
        $match: {
          totalQuantitySold: { $lt: threshold },
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          stockQuantity: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantitySold: 1, name: 1 } },
    ]);

    return res.status(200).json({
      status: "success",
      threshold,
      results: products.length,
      data: { products },
    });
  } catch (error) {
    console.error("Low-performing products error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve low-performing products",
    });
  }
};

// Admin: Get customer retention analytics
const getCustomerRetentionAnalytics = async (req, res) => {
  try {
    const retentionData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$customer",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          firstPurchase: { $min: "$createdAt" },
          lastPurchase: { $max: "$createdAt" },
        },
      },
      {
        $group: {
          _id: null,
          totalPayingCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: {
              $cond: [{ $gt: ["$totalOrders", 1] }, 1, 0],
            },
          },
          oneTimeCustomers: {
            $sum: {
              $cond: [{ $eq: ["$totalOrders", 1] }, 1, 0],
            },
          },
          totalCustomerRevenue: { $sum: "$totalSpent" },
        },
      },
    ]);

    const analytics = retentionData[0] || {
      totalPayingCustomers: 0,
      repeatCustomers: 0,
      oneTimeCustomers: 0,
      totalCustomerRevenue: 0,
    };

    const retentionRate =
      analytics.totalPayingCustomers > 0
        ? (analytics.repeatCustomers / analytics.totalPayingCustomers) * 100
        : 0;

    return res.status(200).json({
      status: "success",
      data: {
        ...analytics,
        retentionRate: Number(retentionRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Customer retention analytics error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer retention analytics",
    });
  }
};

// Admin: Get revenue breakdown by payment method
const getRevenueByPaymentMethod = async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    return res.status(200).json({
      status: "success",
      results: revenue.length,
      data: { revenue },
    });
  } catch (error) {
    console.error("Revenue by payment method error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve revenue by payment method",
    });
  }
};

// Admin: Get order status analytics
const getOrderStatusAnalytics = async (req, res) => {
  try {
    const analytics = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
    ]);

    return res.status(200).json({
      status: "success",
      results: analytics.length,
      data: { analytics },
    });
  } catch (error) {
    console.error("Order status analytics error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve order status analytics",
    });
  }
};

// Admin: Get complete dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      totalCustomers,
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      revenueData,
      inventoryData,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      require("../models/User").countDocuments({ role: "customer" }),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: "pending" }),
      Order.countDocuments({ orderStatus: "cancelled" }),

      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]),

      Product.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stockQuantity" },
            inventoryValue: {
              $sum: { $multiply: ["$price", "$stockQuantity"] },
            },
          },
        },
      ]),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber customer totalAmount paymentStatus orderStatus createdAt")
        .populate("customer", "name email"),
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    const inventory = inventoryData[0] || {
      totalStock: 0,
      inventoryValue: 0,
    };

    return res.status(200).json({
      status: "success",
      data: {
        products: { total: totalProducts, active: activeProducts },
        customers: { total: totalCustomers },
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: revenue.totalRevenue,
          averageOrderValue: Number(
            revenue.averageOrderValue.toFixed(2)
          ),
        },
        inventory: {
          totalStock: inventory.totalStock,
          totalValue: inventory.inventoryValue,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve dashboard summary",
    });
  }
};

module.exports = {
  getSalesOverview,
  getBestSellingProducts,
  getSalesReports,
  getProductPerformance,
  getLowPerformingProducts,
  getCustomerRetentionAnalytics,
  getRevenueByPaymentMethod,
  getOrderStatusAnalytics,
  getDashboardSummary,
};