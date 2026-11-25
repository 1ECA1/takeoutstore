
const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({
  user,
  action,
  description = "",
  metadata = {},
  req,
}) => {
  try {
    await ActivityLog.create({
      user: user || null,
      action,
      description,
      metadata,
      ipAddress: req?.ip || "",
      userAgent: req?.get("user-agent") || "",
    });
  } catch (error) {
    // Activity logging must not interrupt the main operation.
    console.error("Activity logging failed:", error.message);
  }
};

module.exports = logActivity;
