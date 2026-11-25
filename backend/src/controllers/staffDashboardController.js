
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const ActivityLog = require("../models/ActivityLog");

const getStaffDashboard = async (req, res) => {
  try {
    const permissions = req.user.permissions || [];

    const canViewOrders = permissions.includes("orders.view");
    const canViewProducts = permissions.includes("products.view");
    const canViewInventory = permissions.includes("inventory.view");
    const canViewCustomers = permissions.includes("customers.view");

    const canViewSuppliers =
      permissions.includes("suppliers.view") ||
      permissions.includes("suppliers.analytics.view");

    const stats = {
      orders: null,
      products: null,
      inventory: null,
      customers: null,
      suppliers: null,
    };

    const tasks = [];

    if (canViewOrders) {
      tasks.push(
        Order.countDocuments().then((total) =>
          Order.countDocuments({ orderStatus: "pending" }).then((pending) => {
            stats.orders = { total, pending };
          })
        )
      );
    }

    if (canViewProducts) {
      tasks.push(
        Promise.all([
          Product.countDocuments(),
          Product.countDocuments({ status: "active" }),
        ]).then(([total, active]) => {
          stats.products = { total, active };
        })
      );
    }

    if (canViewInventory) {
      tasks.push(
        Promise.all([
          Product.countDocuments({ stockQuantity: 0 }),
          Product.countDocuments({
            status: "active",
            stockQuantity: { $gt: 0, $lte: 5 },
          }),
        ]).then(([outOfStock, lowStock]) => {
          stats.inventory = { outOfStock, lowStock };
        })
      );
    }

    if (canViewCustomers) {
      tasks.push(
        User.countDocuments({ role: "customer" }).then((total) => {
          stats.customers = { total };
        })
      );
    }

    if (canViewSuppliers) {
      tasks.push(
        Promise.all([
          Supplier.countDocuments(),
          Supplier.countDocuments({ status: "active" }),
        ]).then(([total, active]) => {
          stats.suppliers = { total, active };
        })
      );
    }

    const recentActivitiesPromise = ActivityLog.find({
      user: req.user._id,
    })
      .select("action description createdAt")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const [recentActivities] = await Promise.all([
      recentActivitiesPromise,
      ...tasks,
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        staff: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          status: req.user.status,
          permissionCount: permissions.length,
        },
        stats,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Staff dashboard error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve staff dashboard",
    });
  }
};

module.exports = { getStaffDashboard };
