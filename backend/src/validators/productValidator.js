const { body, validationResult } = require("express-validator");

// Allowed fields in a product request
const allowedProductFields = [
  "name",
  "description",
  "price",
  "compareAtPrice",
  "category",
  "images",
  "stockQuantity",
  "status",
];

// Validation rules for creating a product
const createProductValidator = [
  body("name")
    .isString()
    .withMessage("Product name must be text")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 150 })
    .withMessage("Product name cannot exceed 150 characters"),

  body("description")
    .isString()
    .withMessage("Description must be text")
    .trim()
    .notEmpty()
    .withMessage("Product description is required"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid non-negative number")
    .toFloat(),

  body("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare-at price must be non-negative")
    .toFloat(),

  body("category")
    .isString()
    .withMessage("Category must be text")
    .trim()
    .notEmpty()
    .withMessage("Product category is required"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Images must be an array with a maximum of 10 items"),

  body("images.*.url")
    .if(body("images").exists())
    .isURL()
    .withMessage("Each image must have a valid URL"),

  body("images.*.publicId")
    .optional()
    .isString()
    .withMessage("Image public ID must be text"),

  body("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer")
    .toInt(),

  body("status")
    .optional()
    .isIn(["draft", "active", "archived"])
    .withMessage("Status must be draft, active, or archived"),
];

// Validation rules for updating a product
const updateProductValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Product name must be text")
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ max: 150 })
    .withMessage("Product name cannot exceed 150 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be text")
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid non-negative number")
    .toFloat(),

  body("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Compare-at price must be non-negative")
    .toFloat(),

  body("category")
    .optional()
    .isString()
    .withMessage("Category must be text")
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Images must be an array with a maximum of 10 items"),

  body("images.*.url")
    .if(body("images").exists())
    .isURL()
    .withMessage("Each image must have a valid URL"),

  body("images.*.publicId")
    .optional()
    .isString()
    .withMessage("Image public ID must be text"),

  body("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer")
    .toInt(),

  body("status")
    .optional()
    .isIn(["draft", "active", "archived"])
    .withMessage("Status must be draft, active, or archived"),
];

// Reject fields that are not part of the Product model
const rejectUnknownProductFields = (req, res, next) => {
  const unknownFields = Object.keys(req.body).filter(
    (field) => !allowedProductFields.includes(field)
  );

  if (unknownFields.length > 0) {
    return res.status(400).json({
      status: "error",
      message: "Request contains unsupported product fields",
      fields: unknownFields,
    });
  }

  next();
};

// Reject empty product update requests
const rejectEmptyProductUpdate = (req, res, next) => {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    Object.keys(req.body).length === 0
  ) {
    return res.status(400).json({
      status: "error",
      message: "Update request must contain at least one product field",
    });
  }

  next();
};

// Return validation errors before reaching the controller
const validateProduct = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Product validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

module.exports = {
  createProductValidator,
  updateProductValidator,
  rejectUnknownProductFields,
  rejectEmptyProductUpdate,
  validateProduct,
};