const Category = require("../models/Category");
const Product = require("../models/Product");

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Category name is required",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
    });

    return res.status(201).json({
      status: "success",
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to create category",
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid category status",
        });
      }

      filter.status = status;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    return res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve categories",
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body || {};

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid category ID",
      });
    }

    const allowedFields = ["name", "description", "status"];
    const invalidFields = Object.keys(req.body || {}).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length || !Object.keys(req.body || {}).length) {
      return res.status(400).json({
        status: "error",
        message: "Provide valid category fields to update",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          status: "error",
          message: "Category name must be valid text",
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Description must be text",
        });
      }
      updates.description = description.trim();
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid category status",
        });
      }
      updates.status = status;
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to update category",
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }

    // Prevent deletion if products use this category
    const hasProducts = await Product.exists({ category: id });

    if (hasProducts) {
      return res.status(409).json({
        status: "error",
        message: "Cannot delete this category because products are assigned to it",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete category",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};