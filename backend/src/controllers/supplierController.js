
const mongoose = require("mongoose");

const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const logActivity = require("../utils/activityLogger");

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      products,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Supplier name is required",
      });
    }

    const supplierData = {
      name: name.trim(),
      contactPerson,
      email,
      phone,
      address,
      notes,
    };

    if (products !== undefined) {
      if (!Array.isArray(products)) {
        return res.status(400).json({
          status: "error",
          message: "Products must be an array",
        });
      }

      const validIds = products.every((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (!validIds) {
        return res.status(400).json({
          status: "error",
          message: "One or more product IDs are invalid",
        });
      }

      const existingProducts = await Product.countDocuments({
        _id: { $in: products },
      });

      if (existingProducts !== new Set(products).size) {
        return res.status(400).json({
          status: "error",
          message: "One or more products do not exist",
        });
      }

      supplierData.products = [...new Set(products)];
    }

    const supplier = await Supplier.create(supplierData);

    await logActivity({
  user: req.user._id,
  action: "supplier.created",
  description: `Created supplier ${supplier.name}`,
  metadata: {
    supplierId: supplier._id,
    supplierName: supplier.name,
  },
  req,
});

    return res.status(201).json({
      status: "success",
      message: "Supplier created successfully",
      data: { supplier },
    });
  } catch (error) {
    console.error("Create supplier error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to create supplier",
    });
  }
};

// Get all suppliers
const getSuppliers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

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

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid supplier status",
        });
      }

      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .populate("products", "name price stockQuantity")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      Supplier.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: suppliers.length,
      pagination: {
        currentPage,
        pageSize,
        totalSuppliers: total,
        totalPages: Math.ceil(total / pageSize),
      },
      data: { suppliers },
    });
  } catch (error) {
    console.error("Get suppliers error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve suppliers",
    });
  }
};

// Get one supplier
const getSupplierById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findById(req.params.id).populate(
      "products",
      "name price stockQuantity status"
    );

    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { supplier },
    });
  } catch (error) {
    console.error("Get supplier error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve supplier",
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid supplier ID",
      });
    }

    const allowedFields = [
      "name",
      "contactPerson",
      "email",
      "phone",
      "address",
      "products",
      "notes",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid update fields provided",
      });
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        status: "error",
        message: "Supplier name cannot be empty",
      });
    }

    if (updates.name) updates.name = updates.name.trim();

    if (
      updates.status !== undefined &&
      !["active", "inactive"].includes(updates.status)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid supplier status",
      });
    }

    if (updates.products !== undefined) {
      if (!Array.isArray(updates.products)) {
        return res.status(400).json({
          status: "error",
          message: "Products must be an array",
        });
      }

      const validIds = updates.products.every((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (!validIds) {
        return res.status(400).json({
          status: "error",
          message: "One or more product IDs are invalid",
        });
      }

      const uniqueProducts = [...new Set(updates.products)];

      const existingProducts = await Product.countDocuments({
        _id: { $in: uniqueProducts },
      });

      if (existingProducts !== uniqueProducts.length) {
        return res.status(400).json({
          status: "error",
          message: "One or more products do not exist",
        });
      }

      updates.products = uniqueProducts;
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("products", "name price stockQuantity");

    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    await logActivity({
  user: req.user._id,
  action: "supplier.updated",
  description: `Updated supplier ${supplier.name}`,
  metadata: {
    supplierId: supplier._id,
    supplierName: supplier.name,
    updatedFields: Object.keys(updates),
  },
  req,
});

    return res.status(200).json({
      status: "success",
      message: "Supplier updated successfully",
      data: { supplier },
    });
  } catch (error) {
    console.error("Update supplier error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update supplier",
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    await logActivity({
  user: req.user._id,
  action: "supplier.deleted",
  description: `Deleted supplier ${supplier.name}`,
  metadata: {
    supplierId: supplier._id,
    supplierName: supplier.name,
  },
  req,
});

    return res.status(200).json({
      status: "success",
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete supplier",
    });
  }
};

// Admin: Get supplier performance analytics
const getSupplierAnalytics = async (req, res) => {
  try {
    const [
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      supplierData,
    ] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: "active" }),
      Supplier.countDocuments({ status: "inactive" }),
      Supplier.aggregate([
        {
          $project: {
            name: 1,
            status: 1,
            totalProductsSupplied: {
              $size: { $ifNull: ["$products", []] },
            },
          },
        },
        {
          $sort: {
            totalProductsSupplied: -1,
            name: 1,
          },
        },
      ]),
    ]);

    const totalProductsSupplied = supplierData.reduce(
      (total, supplier) => total + supplier.totalProductsSupplied,
      0
    );

    return res.status(200).json({
      status: "success",
      data: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        totalProductsSupplied,
        suppliers: supplierData,
      },
    });
  } catch (error) {
    console.error("Supplier analytics error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve supplier analytics",
    });
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierAnalytics,
};
