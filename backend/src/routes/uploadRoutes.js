
const express = require("express");
const router = express.Router();

const { uploadProductImages } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const authorizePermissions = require("../middleware/authorizePermissions");

router.post(
  "/products",
  protect,
  authorizeRoles("admin", "staff"),
  authorizePermissions("products.upload_images"),
  upload.array("images", 10),
  uploadProductImages
);

module.exports = router;
