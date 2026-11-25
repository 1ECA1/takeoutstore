require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");

const migrateProductCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;

    const products = await db.collection("products").find({
      category: { $type: "string" },
    }).toArray();

    let migrated = 0;
    let unmatched = 0;

    for (const product of products) {
      const category = await Category.findOne({
        name: product.category,
      });

      if (!category) {
        console.log("Category not found for:", product.name);
        unmatched++;
        continue;
      }

      await db.collection("products").updateOne(
        { _id: product._id },
        { $set: { category: category._id } }
      );

      migrated++;
    }

    console.log("Migration completed.");
    console.log("Products migrated:", migrated);
    console.log("Products unmatched:", unmatched);
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

migrateProductCategories();