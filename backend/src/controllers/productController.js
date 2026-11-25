const Product = require("../models/Product");
const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");
const logActivity = require("../utils/activityLogger");

// Delete product images from Cloudinary safely
const deleteCloudinaryImages = async (publicIds = []) => {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];

  const results = await Promise.allSettled(
    uniqueIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Cloudinary cleanup failed for ${uniqueIds[index]}:`,
        result.reason?.message,
      );
    }
  });
};

// Create a product
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    const category = await Category.findOne({
      _id: productData.category,
      status: "active",
    });

    if (!category) {
      return res.status(400).json({
        status: "error",
        message: "Please select a valid active category",
      });
    }

    const product = await Product.create(productData);
    await product.populate("category", "name description");
    await logActivity({
      user: req.user._id,
      action: "product.created",
      description: `Created product ${product.name}`,
      metadata: {
        productId: product._id,
        productName: product.name,
        price: product.price,
        category: product.category?._id || product.category,
      },
      req,
    });

    return res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to create product",
    });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    // Customers and public visitors only see active products.
    // Administrators can retrieve all product statuses.
    const canViewAllProducts =
      req.user?.role === "admin" ||
      (req.user?.role === "staff" &&
        req.user?.permissions?.includes("products.view"));

    const filter = canViewAllProducts ? {} : { status: "active" };

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (category) {
      if (!/^[0-9a-fA-F]{24}$/.test(category)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (
      (minPrice !== undefined &&
        (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))
    ) {
      return res.status(400).json({
        status: "error",
        message: "Price filters must be valid non-negative numbers",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Minimum price cannot exceed maximum price",
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
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    if (!sortOptions[sort]) {
      return res.status(400).json({
        status: "error",
        message: "Invalid sorting option",
      });
    }

    const skip = (currentPage - 1) * pageSize;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name description")
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(pageSize),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: products.length,
      pagination: {
        currentPage,
        pageSize,
        totalProducts,
        totalPages: Math.ceil(totalProducts / pageSize),
      },
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve products",
    });
  }
};

// Get one product by ID
const getProductById = async (req, res) => {
  try {
    const canViewAllProducts =
      req.user?.role === "admin" ||
      (req.user?.role === "staff" &&
        req.user?.permissions?.includes("products.view"));

    const productFilter = canViewAllProducts
      ? { _id: req.params.id }
      : { _id: req.params.id, status: "active" };

    const product = await Product.findOne(productFilter).populate(
      "category",
      "name description",
    );

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "Invalid product ID",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve product",
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.category !== undefined) {
      const category = await Category.findOne({
        _id: updates.category,
        status: "active",
      });

      if (!category) {
        return res.status(400).json({
          status: "error",
          message: "Please select a valid active category",
        });
      }
    }

    // Get the existing product before updating it.
    const existingProduct = await Product.findById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const oldImageIds = (existingProduct.images || [])
      .map((image) => image.publicId)
      .filter(Boolean);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).populate("category", "name description");

    // Delete only images removed from the successfully updated product.
    if (Array.isArray(updates.images)) {
      const newImageIds = new Set(
        product.images.map((image) => image.publicId).filter(Boolean),
      );

      const removedImageIds = oldImageIds.filter(
        (publicId) => !newImageIds.has(publicId),
      );

      await deleteCloudinaryImages(removedImageIds);
    }

    await logActivity({
      user: req.user._id,
      action: "product.updated",
      description: `Updated product ${product.name}`,
      metadata: {
        productId: product._id,
        productName: product.name,
        updatedFields: Object.keys(updates),
      },
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("Update product error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update product",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Remove the product's images from Cloudinary.
    const imageIds = (product.images || [])
      .map((image) => image.publicId)
      .filter(Boolean);

    await deleteCloudinaryImages(imageIds);

    await logActivity({
      user: req.user._id,
      action: "product.deleted",
      description: `Deleted product ${product.name}`,
      metadata: {
        productId: product._id,
        productName: product.name,
      },
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Product and associated images deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "Invalid product ID",
      });
    }

    console.error("Delete product error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
