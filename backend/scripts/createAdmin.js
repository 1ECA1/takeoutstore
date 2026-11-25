
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const createAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    // Validate the supplied admin details
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin name, email and password must be provided");
    }

    const name = ADMIN_NAME.trim();
    const email = ADMIN_EMAIL.trim().toLowerCase();

    if (!name || name.length > 100) {
      throw new Error("Admin name must contain between 1 and 100 characters");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new Error("Please provide a valid admin email address");
    }

    if (
      ADMIN_PASSWORD.length < 8 ||
      Buffer.byteLength(ADMIN_PASSWORD, "utf8") > 72
    ) {
      throw new Error("Admin password must be at least 8 characters and cannot exceed 72 bytes");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    // Only allow initial setup when no administrator exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An administrator already exists. Setup cancelled.");
      return;
    }

    // Create the first administrator
    const admin = await User.create({
      name,
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
      status: "active",
    });

    console.log("Initial administrator created successfully");
    console.log("Admin ID:", admin._id.toString());
    console.log("Admin email:", admin.email);
    console.log("Admin role:", admin.role);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
