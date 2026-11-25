
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and authenticate the user
const protect = async (req, res, next) => {
  try {
    // Read the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required. Please provide a valid access token.",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        status: "error",
        message: "Authentication service is not configured",
      });
    }

    // Verify the token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User associated with this token no longer exists",
      });
    }

    // Prevent suspended or disabled accounts from accessing protected routes
    if (user.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Your account is not active",
      });
    }

    // Attach authenticated user to the request
    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "CastError"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired access token",
      });
    }

    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};


// Authenticate only when an Authorization header is supplied
const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  return protect(req, res, next);
};


// Restrict access based on user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorizeRoles,
};