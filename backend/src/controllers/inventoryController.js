
const mongoose = require("mongoose");

const Product = require("../models/Product");
const InventoryLog = require("../models/InventoryLog");
const logActivity = require("../utils/activityLogger");

// Get inventory overview
const getInventory = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .sort({ stockQuantity: 1 });

    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve inventory",
    });
  }
};

// Get products with low stock
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
      stockQuantity: { $lte: 5 },
    })
      .populate("category", "name")
      .sort({ stockQuantity: 1 });

    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve low-stock products",
    });
  }
};

// Adjust product stock
const adjustStock = async (req, res) => {
  const { productId, action, quantity, reason } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "error",
        message: "A valid product ID is required",
      });
    }

    if (!["stock_added", "stock_removed"].includes(action)) {
      return res.status(400).json({
        status: "error",
        message: "Action must be stock_added or stock_removed",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be a positive whole number",
      });
    }

    if (reason !== undefined && typeof reason !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Reason must be a string",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const previousStock = product.stockQuantity;

    const newStock =
      action === "stock_added"
        ? previousStock + quantity
        : previousStock - quantity;

    if (newStock < 0) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient stock for this adjustment",
      });
    }

    product.stockQuantity = newStock;
    await product.save();

 await logActivity({
  user: req.user._id,
  action: "inventory.stock_adjusted",
  description: `${action === "stock_added" ? "Added" : "Removed"} ${quantity} units of ${product.name}`,
  metadata: {
    productId: product._id,
    productName: product.name,
    adjustment: action,
    quantity,
    previousStock,
    newStock,
    reason: reason || "",
  },
  req,
});
    res.status(200).json({
      status: "success",
      message: "Inventory updated successfully",
      data: {
        productId: product._id,
        productName: product.name,
        previousStock,
        newStock,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to adjust inventory",
    });
  }
};

// Get inventory movement history
const getInventoryLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    if (req.query.productId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.productId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid product ID",
        });
      }

      filter.product = req.query.productId;
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const [logs, total] = await Promise.all([
      InventoryLog.find(filter)
        .populate("product", "name")
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InventoryLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: logs.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: { logs },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve inventory history",
    });
  }
};

// Get inventory performance analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    const [
      totalProducts,
      inventoryData,
      outOfStockProducts,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments(),

      Product.aggregate([
        {
          $group: {
            _id: null,
            totalUnitsInStock: { $sum: "$stockQuantity" },
            totalInventoryValue: {
              $sum: {
                $multiply: ["$price", "$stockQuantity"],
              },
            },
          },
        },
      ]),

      Product.countDocuments({ stockQuantity: 0 }),

      Product.countDocuments({
        status: "active",
        stockQuantity: { $lte: 5, $gt: 0 },
      }),
    ]);

    const analytics = inventoryData[0] || {
      totalUnitsInStock: 0,
      totalInventoryValue: 0,
    };

    return res.status(200).json({
      status: "success",
      data: {
        totalProducts,
        totalUnitsInStock: analytics.totalUnitsInStock,
        totalInventoryValue: analytics.totalInventoryValue,
        outOfStockProducts,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Inventory analytics error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve inventory analytics",
    });
  }
};

module.exports = {
  getInventory,
  getLowStockProducts,
  adjustStock,
  getInventoryLogs,
  getInventoryAnalytics,
};