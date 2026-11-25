const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/activityLogger");

// Register a new customer
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Name, email and password are required as text values",
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

    if (normalizedEmail.length > 254 || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid email address",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        status: "error",
        message:
          "Password must be at least 8 characters and cannot exceed 72 bytes",
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

    // Public registration always creates a customer.
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: "customer",
    });

    await logActivity({
      user: user._id,
      action: "account_registered",
      description: "Customer account registered",
      req,
    });

    return res.status(201).json({
      status: "success",
      message: "Account registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to register account",
    });
  }
};

// Log in an existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Valid email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Explicitly retrieve the password hash.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Compare the submitted password with the stored hash.
    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Your account is not active. Please contact support.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        status: "error",
        message: "Authentication service is not configured",
      });
    }

    // Generate a signed JWT containing the user's ID.
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      },
    );

    await logActivity({
      user: user._id,
      action: "user_login",
      description: "User logged in successfully",
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          permissions: user.permissions || [],
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to log in",
    });
  }
};

// Get the currently authenticated user's profile
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      status: "success",
      message: "User profile retrieved successfully",
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          status: req.user.status,
          permissions: req.user.permissions || [],
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve user profile",
    });
  }
};

// Update the currently authenticated user's profile
const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body || {};

    // Reject empty or invalid request bodies.
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body) ||
      Object.keys(req.body).length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please provide profile information to update",
      });
    }

    // Only name and email are permitted.
    const allowedFields = ["name", "email"];
    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Only name and email can be updated",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Name must be a text value",
        });
      }

      const normalizedName = name.trim();

      if (!normalizedName || normalizedName.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Name must contain between 1 and 100 characters",
        });
      }

      updates.name = normalizedName;
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Email must be a text value",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (normalizedEmail.length > 254 || !emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          status: "error",
          message: "Please provide a valid email address",
        });
      }

      updates.email = normalizedEmail;
    }

    // Update only the authenticated user's own account.
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        role: req.user.role,
        status: "active",
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select("name email role status createdAt updatedAt");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User account not found or is not active",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "This email address is already in use",
      });
    }

    console.error("Update profile error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    // Validate required password fields
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        status: "error",
        message: "Current password and new password are required",
      });
    }

    // Validate password lengths
    if (
      Buffer.byteLength(currentPassword, "utf8") > 72 ||
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "New password must be at least 8 characters and cannot exceed 72 bytes",
      });
    }

    // Retrieve the authenticated user's password hash
    const user = await User.findOne({
      _id: req.user._id,
      status: "active",
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User account not found or is not active",
      });
    }

    // Verify the current password
    const passwordMatches = await user.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Prevent reusing the current password
    const samePassword = await user.comparePassword(newPassword);

    if (samePassword) {
      return res.status(400).json({
        status: "error",
        message: "New password must be different from the current password",
      });
    }

    // Assign and save. The User model automatically hashes it.
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to change password",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
};
