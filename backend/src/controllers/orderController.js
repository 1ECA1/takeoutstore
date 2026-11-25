const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const InventoryLog = require("../models/InventoryLog");
const logActivity = require("../utils/activityLogger");

// Checkout and create order
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      shippingAddress,
      shippingFee = 0,
      paymentMethod = "cash_on_delivery",
    } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state
    ) {
      return res.status(400).json({
        status: "error",
        message: "Complete shipping address is required",
      });
    }

    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid shipping fee",
      });
    }

    const allowedPaymentMethods = [
      "paystack",
      "bank_transfer",
      "cash_on_delivery",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid payment method",
      });
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        customer: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your shopping cart is empty");
        error.statusCode = 400;
        throw error;
      }

      const orderItems = [];
      const stockMovements = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = await Product.findOne({
          _id: item.product,
          status: "active",
        }).session(session);

        if (!product) {
          const error = new Error("One or more products are unavailable");
          error.statusCode = 400;
          throw error;
        }

        if (product.stockQuantity < item.quantity) {
          const error = new Error(`Insufficient stock for ${product.name}`);
          error.statusCode = 400;
          throw error;
        }

        const previousStock = product.stockQuantity;

        product.stockQuantity -= item.quantity;

        const newStock = product.stockQuantity;

        await product.save({ session });

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images?.[0]?.url || "",
        });

        stockMovements.push({
          product: product._id,
          quantity: item.quantity,
          previousStock,
          newStock,
        });

        subtotal += product.price * item.quantity;
      }

      const totalAmount = subtotal + shippingFee;

      const reservationExpiresAt =
        paymentMethod === "paystack"
          ? new Date(Date.now() + 30 * 60 * 1000)
          : null;

      const [order] = await Order.create(
        [
          {
            orderNumber: `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
            customer: req.user._id,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingFee,
            totalAmount,
            paymentMethod,
            paymentStatus: "pending",
            orderStatus: "pending",

            // Inventory reservation tracking
            stockReserved: true,
            stockReleasedAt: null,
            reservationExpiresAt,
          },
        ],
        { session },
      );

      // Record inventory deductions
      const inventoryLogs = stockMovements.map((movement) => ({
        ...movement,
        action: "order_placed",
        reason: `Stock deducted for order ${order.orderNumber}`,
        performedBy: req.user._id,
        reference: order.orderNumber,
      }));

      await InventoryLog.create(inventoryLogs, {
        session,
        ordered: true,
      });

      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });
    await logActivity({
      user: req.user._id,
      action: "order_placed",
      description: `Placed order ${createdOrder.orderNumber}`,
      metadata: {
        orderId: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        totalAmount: createdOrder.totalAmount,
      },
      req,
    });

    return res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      data: { order: createdOrder },
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.statusCode ? error.message : "Failed to place order",
    });
  } finally {
    await session.endSession();
  }
};

// Get customer's orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve orders",
    });
  }
};

// Get one customer's order
const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve order",
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageSize) ||
      currentPage < 1 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pagination values",
      });
    }

    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      results: orders.length,
      pagination: {
        currentPage,
        pageSize,
        totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
      data: { orders },
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve orders",
    });
  }
};

// Admin: Update order status and restore stock when cancelled
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const allowedStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const { orderStatus } = req.body;

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid order status",
      });
    }

    let updatedOrder;
    let previousOrderStatus;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      previousOrderStatus = order.orderStatus;

      if (
        order.orderStatus === "cancelled" ||
        order.orderStatus === "delivered"
      ) {
        const error = new Error("This order can no longer be updated");
        error.statusCode = 400;
        throw error;
      }

      if (orderStatus === "cancelled" && order.orderStatus === "shipped") {
        const error = new Error("A shipped order cannot be cancelled");
        error.statusCode = 400;
        throw error;
      }

      if (orderStatus === "cancelled") {
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(session);

          if (!product) {
            const error = new Error(`Product ${item.name} could not be found`);
            error.statusCode = 400;
            throw error;
          }

          const previousStock = product.stockQuantity;

          product.stockQuantity += item.quantity;

          const newStock = product.stockQuantity;

          await product.save({ session });

          // Record stock restoration
          await InventoryLog.create(
            [
              {
                product: product._id,
                action: "order_cancelled",
                quantity: item.quantity,
                previousStock,
                newStock,
                reason: `Stock restored from cancelled order ${order.orderNumber}`,
                performedBy: req.user._id,
                performedByType: "user",
                reference: order.orderNumber,
              },
            ],
            {
              session,
              ordered: true,
            },
          );
        }
      }

      order.orderStatus = orderStatus;
      await order.save({ session });

      updatedOrder = order;
    });
    if (updatedOrder.orderStatus === "cancelled") {
      await logActivity({
        user: updatedOrder.customer,
        action: "order_cancelled",
        description: `Order ${updatedOrder.orderNumber} was cancelled`,
        metadata: {
          orderId: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
        },
        req,
      });
    }

    await logActivity({
  user: req.user._id,
  action: "order.status_updated",
  description: `Updated order ${updatedOrder.orderNumber} from ${previousOrderStatus} to ${updatedOrder.orderStatus}`,
  metadata: {
    orderId: updatedOrder._id,
    orderNumber: updatedOrder.orderNumber,
    previousStatus: previousOrderStatus,
    newStatus: updatedOrder.orderStatus,
    customerId: updatedOrder.customer,
  },
  req,
});

    return res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: { order: updatedOrder },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "Invalid order ID",
      });
    }

    console.error("Update order status error:", error.message);

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.statusCode
        ? error.message
        : "Failed to update order status",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
};
