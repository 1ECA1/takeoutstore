const Cart = require("../models/Cart");
const Product = require("../models/Product");
const logActivity = require("../utils/activityLogger");

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({
        status: "error",
        message: "Valid product ID is required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be a positive integer",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Active product not found",
      });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient product stock",
      });
    }

    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        customer: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const item = cart.items.find(
        (item) => item.product.toString() === productId,
      );

      if (item) {
        if (item.quantity + quantity > product.stockQuantity) {
          return res.status(400).json({
            status: "error",
            message: "Requested quantity exceeds available stock",
          });
        }

        item.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    await cart.populate(
      "items.product",
      "name price images stockQuantity status",
    );

    await logActivity({
      user: req.user._id,
      action: "cart_item_updated",
      description: `Updated ${product.name} quantity in cart`,
      metadata: {
        productId: product._id,
        quantity,
      },
      req,
    });

    await logActivity({
      user: req.user._id,
      action: "cart_item_added",
      description: `Added ${product.name} to cart`,
      metadata: {
        productId: product._id,
        quantity,
      },
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Product added to cart",
      data: { cart },
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to add product to cart",
    });
  }
};

// Get customer's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate(
      "items.product",
      "name price images stockQuantity status",
    );

    if (!cart) {
      return res.status(200).json({
        status: "success",
        data: {
          items: [],
          subtotal: 0,
          totalItems: 0,
        },
      });
    }

    const items = cart.items
      .filter((item) => item.product)
      .map((item) => ({
        product: item.product,
        quantity: item.quantity,
        lineTotal: item.product.price * item.quantity,
      }));

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    return res.status(200).json({
      status: "success",
      data: {
        cartId: cart._id,
        items,
        subtotal,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve cart",
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({
        status: "error",
        message: "Valid product ID is required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be a positive integer",
      });
    }

    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in cart",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Active product not found",
      });
    }

    if (quantity > product.stockQuantity) {
      return res.status(400).json({
        status: "error",
        message: "Requested quantity exceeds available stock",
      });
    }

    item.quantity = quantity;
    await cart.save();

    await cart.populate(
      "items.product",
      "name price images stockQuantity status",
    );

    return res.status(200).json({
      status: "success",
      message: "Cart quantity updated",
      data: { cart },
    });
  } catch (error) {
    console.error("Update cart error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to update cart",
    });
  }
};

// Remove product from cart
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid product ID",
      });
    }

    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in cart",
      });
    }

    await cart.save();

    await logActivity({
      user: req.user._id,
      action: "cart_item_removed",
      description: "Removed a product from cart",
      metadata: {
        productId,
      },
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Product removed from cart",
      data: { cart },
    });
  } catch (error) {
    console.error("Remove cart item error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to remove product from cart",
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(200).json({
        status: "success",
        message: "Cart is already empty",
      });
    }

    cart.items = [];

    const removedItems = cart.items.length;
    await cart.save();
    await logActivity({
      user: req.user._id,
      action: "cart_cleared",
      description: "Customer cleared their cart",
      metadata: {
        removedItems,
      },
      req,
    });

    return res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to clear cart",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
