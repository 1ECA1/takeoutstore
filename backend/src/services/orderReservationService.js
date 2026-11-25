
const mongoose = require("mongoose");
const axios = require("axios");

const Order = require("../models/Order");
const Product = require("../models/Product");
const InventoryLog = require("../models/InventoryLog");
const logActivity = require("../utils/activityLogger");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const CHECK_INTERVAL = 60 * 1000;
const BATCH_SIZE = 20;

let reservationTimer = null;
let isProcessing = false;

/**
 * Verify an expired Paystack transaction before releasing stock.
 */
const verifyExpiredPayment = async (order) => {
  if (!order.paymentReference) {
    return "unpaid";
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error(
      "Reservation service: PAYSTACK_SECRET_KEY is not configured."
    );
    return "retry";
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(
        order.paymentReference
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        timeout: 15000,
      }
    );

    const result = response.data?.data;

    if (response.data?.status !== true || !result) {
      return "retry";
    }

    if (result.status === "success") {
      const expectedAmount = Math.round(order.totalAmount * 100);

      const validPayment =
        result.reference === order.paymentReference &&
        result.amount === expectedAmount &&
        result.currency === "NGN" &&
        result.metadata?.orderId === order._id.toString() &&
        result.metadata?.customerId === order.customer.toString();

      if (!validPayment) {
        console.error(
          `Reservation service: Payment verification mismatch for order ${order._id}.`
        );
        return "retry";
      }

      return "paid";
    }

    if (["failed", "abandoned", "reversed"].includes(result.status)) {
      return "failed";
    }

    return "retry";
  } catch (error) {
    console.error(
      `Reservation service: Paystack verification failed for order ${order._id}:`,
      error.response?.data?.message || error.message
    );

    return "retry";
  }
};

/**
 * Confirm a payment that succeeded before stock was released.
 */
const confirmExpiredOrderPayment = async (order) => {
  const session = await mongoose.startSession();

  let confirmed = false;

  try {
    await session.withTransaction(async () => {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          customer: order.customer,
          paymentMethod: "paystack",
          paymentReference: order.paymentReference,
          paymentStatus: "pending",
          orderStatus: "pending",
          reservationExpiresAt: { $lte: new Date() },
          $or: [
            { stockReserved: true },
            { stockReserved: { $exists: false } },
          ],
        },
        {
          $set: {
            paymentStatus: "paid",
            orderStatus: "confirmed",
            stockReserved: true,
            reservationExpiresAt: null,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (updatedOrder) {
        confirmed = true;
      }
    });

    if (confirmed) {
      await logActivity({
        user: null,
        action: "order.payment_reconciled",
        description:
          "An expired order reservation was retained after Paystack confirmed payment.",
        metadata: {
          orderId: order._id.toString(),
          paymentReference: order.paymentReference,
          source: "system",
        },
      });

      console.log(
        `Reservation service: Payment confirmed for order ${order._id}.`
      );
    }
  } catch (error) {
    console.error(
      `Reservation service: Could not confirm order ${order._id}:`,
      error.message
    );
  } finally {
    await session.endSession();
  }
};

/**
 * Release reserved stock and cancel an expired unpaid order.
 * Order, product and inventory-log changes are atomic.
 */
const releaseExpiredReservation = async (order) => {
  const session = await mongoose.startSession();

  let released = false;

  try {
    await session.withTransaction(async () => {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: "pending",
          orderStatus: "pending",
          reservationExpiresAt: { $lte: new Date() },
          $or: [
            { stockReserved: true },
            { stockReserved: { $exists: false } },
          ],
        },
        {
          $set: {
            paymentStatus: "failed",
            orderStatus: "cancelled",
            stockReserved: false,
            stockReleasedAt: new Date(),
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedOrder) {
        return;
      }

      const inventoryLogs = [];

      for (const item of updatedOrder.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product },
          {
            $inc: {
              stockQuantity: item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!product) {
          throw new Error(
            `Product ${item.product} was not found while releasing order ${updatedOrder._id}.`
          );
        }

        inventoryLogs.push({
          product: product._id,
          action: "order_cancelled",
          quantity: item.quantity,
          previousStock: product.stockQuantity - item.quantity,
          newStock: product.stockQuantity,
          reason: "Automatic release of expired unpaid order reservation.",
          performedBy: null,
          performedByType: "system",
          reference: updatedOrder.orderNumber,
        });
      }

      if (inventoryLogs.length > 0) {
        await InventoryLog.create(inventoryLogs, { session });
      }

      released = true;
    });

    if (released) {
      await logActivity({
        user: null,
        action: "order.reservation_expired",
        description:
          "An expired unpaid order was cancelled and its reserved stock was restored.",
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          source: "system",
        },
      });

      console.log(
        `Reservation service: Stock released for order ${order._id}.`
      );
    }
  } catch (error) {
    console.error(
      `Reservation service: Could not release order ${order._id}:`,
      error.message
    );
  } finally {
    await session.endSession();
  }
};

/**
 * Find and process expired reservations.
 * Prevent overlapping processing cycles.
 */
const processExpiredReservations = async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();

    const expiredOrders = await Order.find({
      paymentMethod: "paystack",
      paymentStatus: "pending",
      orderStatus: "pending",
      reservationExpiresAt: { $lte: now },
      $or: [
        { stockReserved: true },
        { stockReserved: { $exists: false } },
      ],
    })
      .select(
        "_id customer items orderNumber totalAmount paymentReference reservationExpiresAt"
      )
      .sort({ reservationExpiresAt: 1 })
      .limit(BATCH_SIZE)
      .lean();

    for (const order of expiredOrders) {
      const paymentResult = await verifyExpiredPayment(order);

      if (paymentResult === "retry") {
        continue;
      }

      if (paymentResult === "paid") {
        await confirmExpiredOrderPayment(order);
        continue;
      }

      await releaseExpiredReservation(order);
    }
  } catch (error) {
    console.error(
      "Reservation service: Processing failed:",
      error.message
    );
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the automatic reservation expiry worker.
 */
const startOrderReservationService = () => {
  if (reservationTimer) {
    console.log("Reservation service is already running.");
    return;
  }

  console.log("Order reservation service started.");

  processExpiredReservations();

  reservationTimer = setInterval(() => {
    processExpiredReservations();
  }, CHECK_INTERVAL);

  reservationTimer.unref();
};

module.exports = {
  startOrderReservationService,
  processExpiredReservations,
};
