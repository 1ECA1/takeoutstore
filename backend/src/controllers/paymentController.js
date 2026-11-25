
const axios = require("axios");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const logActivity = require("../utils/activityLogger");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Initialize Paystack payment
const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        status: "error",
        message: "A valid order ID is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "paystack") {
      return res.status(400).json({
        status: "error",
        message: "This order is not configured for Paystack",
      });
    }

    if (
      order.paymentStatus !== "pending" ||
      order.orderStatus !== "pending" ||
      order.stockReserved === false
    ) {
      return res.status(400).json({
        status: "error",
        message: "This order cannot be paid",
      });
    }

    if (
      order.reservationExpiresAt &&
      order.reservationExpiresAt <= new Date()
    ) {
      return res.status(400).json({
        status: "error",
        message: "The payment reservation has expired",
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Payment service is not configured",
      });
    }

    const userEmail = req.user.email;

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "Customer email is required",
      });
    }

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: userEmail,
        amount: Math.round(order.totalAmount * 100),
        currency: "NGN",
        reference: `ORD-${order._id}-${Date.now()}`,
        callback_url: `${frontendUrl}/store/payment/callback`,
        metadata: {
          orderId: order._id.toString(),
          customerId: req.user._id.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const paymentData = response.data?.data;

    if (
      response.data?.status !== true ||
      !paymentData?.reference ||
      !paymentData?.authorization_url
    ) {
      return res.status(502).json({
        status: "error",
        message: "Unable to initialize payment",
      });
    }

    // Save the reference only if the order is still eligible.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        customer: req.user._id,
        paymentStatus: "pending",
        orderStatus: "pending",
        stockReserved: { $ne: false },
      },
      {
        $set: {
          paymentReference: paymentData.reference,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        status: "error",
        message: "The order reservation is no longer available",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Payment initialized successfully",
      data: {
        authorizationUrl: paymentData.authorization_url,
        accessCode: paymentData.access_code,
        reference: paymentData.reference,
      },
    });
  } catch (error) {
    console.error(
      "Initialize payment error:",
      error.response?.data?.message || error.message
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to initialize payment",
    });
  }
};

// Verify Paystack payment
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        status: "error",
        message: "Payment reference is required",
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Payment service is not configured",
      });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        timeout: 15000,
      }
    );

    const payment = response.data?.data;

    if (
      response.data?.status !== true ||
      !payment ||
      payment.status !== "success"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Payment was not successful",
      });
    }

    const orderId = payment.metadata?.orderId;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        status: "error",
        message: "Payment order information is invalid",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    const expectedAmount = Math.round(order.totalAmount * 100);

    const paymentMatches =
      order.paymentMethod === "paystack" &&
      order.paymentReference === reference &&
      payment.reference === reference &&
      payment.amount === expectedAmount &&
      payment.currency === "NGN" &&
      payment.metadata?.orderId === order._id.toString() &&
      payment.metadata?.customerId === req.user._id.toString();

    if (!paymentMatches) {
      return res.status(400).json({
        status: "error",
        message: "Payment details do not match this order",
      });
    }

    // Repeated verification of an already-confirmed payment is safe.
    if (
      order.paymentStatus === "paid" &&
      order.orderStatus === "confirmed"
    ) {
      return res.status(200).json({
        status: "success",
        message: "Payment was already verified",
        data: { order },
      });
    }

    // A payment captured after stock release must not revive the order.
    if (
      order.stockReserved === false ||
      order.orderStatus === "cancelled"
    ) {
      const session = await mongoose.startSession();

      let latePaymentOrder;

      try {
        await session.withTransaction(async () => {
          latePaymentOrder = await Order.findOneAndUpdate(
            {
              _id: order._id,
              customer: req.user._id,
              paymentReference: reference,
              paymentStatus: { $in: ["pending", "failed"] },
              orderStatus: "cancelled",
              stockReserved: false,
            },
            {
              $set: {
                paymentStatus: "refund_pending",
              },
            },
            {
              new: true,
              session,
            }
          );

          // Another request may already have handled this payment.
          if (!latePaymentOrder) {
            latePaymentOrder = await Order.findOne({
              _id: order._id,
              customer: req.user._id,
            }).session(session);
          }
        });

        if (
          latePaymentOrder?.paymentStatus === "refund_pending"
        ) {
          await logActivity({
            user: req.user._id,
            action: "payment.late_capture",
            description:
              `Payment was captured after order ${order.orderNumber} was cancelled. Refund resolution is required.`,
            metadata: {
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              paymentReference: reference,
              amount: order.totalAmount,
            },
            req,
          });

          return res.status(409).json({
            status: "error",
            message:
              "Payment was received after the order reservation expired. Your payment requires refund resolution. Please contact support.",
            data: { order: latePaymentOrder },
          });
        }

        return res.status(409).json({
          status: "error",
          message: "This order cannot be fulfilled",
        });
      } finally {
        await session.endSession();
      }
    }

    const session = await mongoose.startSession();

    let confirmedOrder;

    try {
      await session.withTransaction(async () => {
        confirmedOrder = await Order.findOneAndUpdate(
          {
            _id: order._id,
            customer: req.user._id,
            paymentReference: reference,
            paymentStatus: "pending",
            orderStatus: "pending",
            stockReserved: { $ne: false },
            $or: [
              { reservationExpiresAt: null },
              { reservationExpiresAt: { $gt: new Date() } },
            ],
          },
          {
            $set: {
              paymentStatus: "paid",
              orderStatus: "confirmed",
              reservationExpiresAt: null,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!confirmedOrder) {
          confirmedOrder = await Order.findOne({
            _id: order._id,
            customer: req.user._id,
          }).session(session);
        }
      });

      if (
        confirmedOrder?.paymentStatus === "paid" &&
        confirmedOrder.orderStatus === "confirmed"
      ) {
        await logActivity({
          user: req.user._id,
          action: "payment.verified",
          description: `Payment verified for order ${order.orderNumber}`,
          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            paymentReference: reference,
            amount: order.totalAmount,
          },
          req,
        });

        return res.status(200).json({
          status: "success",
          message: "Payment verified successfully",
          data: { order: confirmedOrder },
        });
      }

      return res.status(409).json({
        status: "error",
        message:
          "The order reservation has expired or the order has changed. Please contact support.",
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error(
      "Verify payment error:",
      error.response?.data?.message || error.message
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to verify payment",
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};
