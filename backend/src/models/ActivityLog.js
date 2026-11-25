const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "order.status_updated",
        "product.created",
        "product.updated",
        "product.deleted",
        "supplier.created",
        "supplier.updated",
        "supplier.deleted",
        "inventory.stock_adjusted",
        "account_registered",
        "user_login",
        "user_logout",
        "product_viewed",
        "cart_item_added",
        "cart_item_updated",
        "cart_item_removed",
        "cart_cleared",
        "order_placed",
        "order_cancelled",

        // Payment activities
        "payment.verified",
        "payment.late_capture",

        // Order reservation activities
        "order.payment_reconciled",
        "order.reservation_expired",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
