const ActivityLog = require("../models/ActivityLog");
const mongoose = require("mongoose");

// Admin: Get customer activity logs
const getCustomerActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid customer ID",
      });
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageSize) ||
      currentPage < 1 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pagination values",
      });
    }

    const filter = { user: id };

    if (action) {
      filter.action = action;
    }

    const [activities, totalActivities] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: activities.length,
      pagination: {
        currentPage,
        pageSize,
        totalActivities,
        totalPages: Math.ceil(totalActivities / pageSize),
      },
      data: { activities },
    });
  } catch (error) {
    console.error("Get customer activity error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve customer activity",
    });
  }
};

// Admin: Get all platform activity logs
const getAllActivityLogs = async (req, res) => {
  try {
    const {
      action,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageSize) ||
      currentPage < 1 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pagination values",
      });
    }

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } },
      ];
    }

    const [activities, totalActivities] = await Promise.all([
      ActivityLog.find(filter)
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: activities.length,
      pagination: {
        currentPage,
        pageSize,
        totalActivities,
        totalPages: Math.ceil(totalActivities / pageSize),
      },
      data: { activities },
    });
  } catch (error) {
    console.error("Get all activity logs error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve activity logs",
    });
  }
};

module.exports = {
  getCustomerActivity,
  getAllActivityLogs,
};