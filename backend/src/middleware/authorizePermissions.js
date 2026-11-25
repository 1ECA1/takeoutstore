
const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Administrators retain full access
    if (req.user.role === "admin") {
      return next();
    }

    // Only staff can use staff permissions
    if (req.user.role !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this resource",
      });
    }

    const assignedPermissions = req.user.permissions || [];

    const hasPermission = requiredPermissions.every((permission) =>
      assignedPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
};

module.exports = authorizePermissions;
