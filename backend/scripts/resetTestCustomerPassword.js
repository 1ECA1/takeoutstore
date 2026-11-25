
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const resetPassword = async () => {
  try {
    const password = process.env.TEST_CUSTOMER_PASSWORD;

    if (
      !password ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error("Password must be at least 8 characters and no more than 72 bytes");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({
      email: "alexander.test001@example.com",
      role: "customer",
    });

    if (!user) {
      throw new Error("Test customer account was not found");
    }

    user.password = password;
    await user.save();

    console.log("Test customer password reset successfully");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetPassword();

