
const User = require("../models/User");
const mongoose = require("mongoose");

const ALLOWED_PERMISSIONS = [
  "orders.view",
  "orders.update_status",

  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "products.upload_images",

  "inventory.view",
  "inventory.adjust",
  "inventory.logs.view",
  "inventory.analytics.view",

  "customers.view",
  "customers.purchase_history.view",
  "customers.insights.view",
  "customers.activity.view",
  "customers.segments.view",

  "suppliers.view",
  "suppliers.create",
  "suppliers.update",
  "suppliers.delete",
  "suppliers.analytics.view",
];

// Validate staff permissions
const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    return {
      valid: false,
      message: "Permissions must be an array",
    };
  }

  if (
    permissions.some(
      (permission) =>
        typeof permission !== "string" ||
        !ALLOWED_PERMISSIONS.includes(permission)
    )
  ) {
    return {
      valid: false,
      message: "One or more permissions are invalid",
    };
  }

  return {
    valid: true,
    permissions: [...new Set(permissions)],
  };
};


// Create a staff account
const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Name, email and password are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > 100) {
      return res.status(400).json({
        status: "error",
        message: "Name must contain between 1 and 100 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      normalizedEmail.length > 254 ||
      !emailRegex.test(normalizedEmail)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid email address",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters and cannot exceed 72 bytes",
      });
    }

    const permissions = req.body.permissions ?? [];
    const permissionResult = validatePermissions(permissions);

    if (!permissionResult.valid) {
      return res.status(400).json({
        status: "error",
        message: permissionResult.message,
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists",
      });
    }

    const staff = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: "staff",
      status: "active",
      permissions: permissionResult.permissions,
    });

    return res.status(201).json({
      status: "success",
      message: "Staff account created successfully",
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: staff.status,
        permissions: staff.permissions,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists",
      });
    }

    console.error("Staff creation error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to create staff account",
    });
  }
};


// Get all staff accounts
const getAllStaff = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));

    const skip = (page - 1) * limit;

    const [staff, totalStaff] = await Promise.all([
      User.find({ role: "staff" })
        .select("name email role status permissions createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments({ role: "staff" }),
    ]);

    return res.status(200).json({
      status: "success",
      results: staff.length,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalStaff,
        totalPages: Math.ceil(totalStaff / limit),
      },
      data: staff,
    });
  } catch (error) {
    console.error("Get staff accounts error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve staff accounts",
    });
  }
};


// Get one staff account by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid staff ID",
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: "staff",
    })
      .select("name email role status permissions createdAt updatedAt")
      .lean();

    if (!staff) {
      return res.status(404).json({
        status: "error",
        message: "Staff account not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: staff,
    });
  } catch (error) {
    console.error("Get staff account error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve staff account",
    });
  }
};


// Update staff account details and permissions
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid staff ID",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body",
      });
    }

    const allowedFields = ["name", "email", "permissions"];
    const submittedFields = Object.keys(req.body);

    if (
      submittedFields.length === 0 ||
      submittedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        status: "error",
        message: "Only name, email and permissions can be updated",
      });
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      if (typeof name !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Name must be a string",
        });
      }

      updates.name = name.trim();

      if (!updates.name || updates.name.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Name must contain between 1 and 100 characters",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
      if (typeof email !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Email must be a string",
        });
      }

      updates.email = email.trim().toLowerCase();

      if (
        updates.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
      ) {
        return res.status(400).json({
          status: "error",
          message: "Please provide a valid email address",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "permissions")) {
      const permissionResult = validatePermissions(req.body.permissions);

      if (!permissionResult.valid) {
        return res.status(400).json({
          status: "error",
          message: permissionResult.message,
        });
      }

      updates.permissions = permissionResult.permissions;
    }

    const staff = await User.findOneAndUpdate(
      { _id: id, role: "staff" },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role status permissions createdAt updatedAt");

    if (!staff) {
      return res.status(404).json({
        status: "error",
        message: "Staff account not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Staff account updated successfully",
      data: staff,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists",
      });
    }

    console.error("Update staff error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update staff account",
    });
  }
};


// Update staff account status
const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid staff ID",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body",
      });
    }

    const { status } = req.body;
    const submittedFields = Object.keys(req.body);

    if (
      submittedFields.length !== 1 ||
      submittedFields[0] !== "status"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Only the status field can be updated",
      });
    }

    const allowedStatuses = ["active", "suspended", "disabled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Status must be active, suspended or disabled",
      });
    }

    const staff = await User.findOneAndUpdate(
      { _id: id, role: "staff" },
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role status permissions createdAt updatedAt");

    if (!staff) {
      return res.status(404).json({
        status: "error",
        message: "Staff account not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Staff account status updated to ${status}`,
      data: staff,
    });
  } catch (error) {
    console.error("Update staff status error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update staff account status",
    });
  }
};


module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
};
