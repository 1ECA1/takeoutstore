
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
// Get all customer accounts
const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = { role: "customer" };

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [customers, totalCustomers] = await Promise.all([
      User.find(filter)
        .select("name email role status createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: customers.length,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit),
      },
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer accounts",
    });
  }
};

// Get one customer account by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    })
      .select("name email role status createdAt updatedAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer account not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: customer,
    });
  } catch (error) {
    console.error("Get customer account error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer account",
    });
  }
};

// Get a customer's purchase history
const getCustomerPurchaseHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    }).select("_id name email");

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer account not found",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find({ customer: id })
        .select(
          "orderNumber items subtotal shippingFee totalAmount paymentStatus paymentMethod orderStatus shippingAddress createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments({ customer: id }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        customer,
        orders,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    });
  } catch (error) {
    console.error("Customer purchase history error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer purchase history",
    });
  }
};

// Get customer CRM insights
const getCustomerInsights = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    })
      .select("name email status createdAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer account not found",
      });
    }

    const [insights] = await Order.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                "$totalAmount",
                0,
              ],
            },
          },
          lastPurchaseDate: { $max: "$createdAt" },
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        customer,
        insights: insights || {
          totalOrders: 0,
          paidOrders: 0,
          pendingOrders: 0,
          totalSpent: 0,
          lastPurchaseDate: null,
        },
      },
    });
  } catch (error) {
    console.error("Customer insights error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer insights",
    });
  }
};

// Get customer activity timeline
const getCustomerActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    }).select("_id name email");

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "Customer account not found",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const filter = { user: id };

    const [activities, totalActivities] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        customer,
        activities,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalActivities,
          totalPages: Math.ceil(totalActivities / limit),
        },
      },
    });
  } catch (error) {
    console.error("Customer activity error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer activity",
    });
  }
};


// Get customer lifecycle segments
const getCustomerSegments = async (req, res) => {
  try {
    const customers = await User.aggregate([
      { $match: { role: "customer" } },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $addFields: {
          paidOrders: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $eq: ["$$order.paymentStatus", "paid"] },
            },
          },
        },
      },
      {
        $addFields: {
          totalSpent: { $sum: "$paidOrders.totalAmount" },
          paidOrderCount: { $size: "$paidOrders" },
          lastPurchaseDate: { $max: "$paidOrders.createdAt" },
        },
      },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$totalSpent", 500000] },
                  then: "high_value",
                },
                {
                  case: { $gte: ["$paidOrderCount", 2] },
                  then: "returning",
                },
                {
                  case: {
                    $gte: [
                      "$lastPurchaseDate",
                      new Date(Date.now() - 90 * 86400000),
                    ],
                  },
                  then: "active",
                },
                {
                  case: {
                    $gte: [
                      "$createdAt",
                      new Date(Date.now() - 30 * 86400000),
                    ],
                  },
                  then: "new",
                },
              ],
              default: "inactive",
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          totalSpent: 1,
          paidOrderCount: 1,
          lastPurchaseDate: 1,
          segment: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    return res.status(200).json({
      status: "success",
      results: customers.length,
      data: { customers },
    });
  } catch (error) {
    console.error("Customer segmentation error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer segments",
    });
  }
};


module.exports = {
  getCustomerSegments,
  getAllCustomers,
  getCustomerActivity,
  getCustomerById,
  getCustomerPurchaseHistory,
  getCustomerInsights,
};
