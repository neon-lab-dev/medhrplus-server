const axios = require("axios");
const catchAsyncError = require("../middleware/catchAsyncError");
const payment = require("../models/payment");

// Create Payment & get Cashfree order token
exports.createPayment = catchAsyncError(async (req, res, next) => {
  const { amount, paidBy } = req.body;

  if (!amount || !paidBy) {
    return next(new ErrorHandler("Amount and paidBy are required", 400));
  }

  // 1️⃣ Create Cashfree order token
  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders", // change to production for live
      {
        order_amount: amount,
        order_currency: "INR",
        order_note: "Payment for Employee registration",
        customer_details: {
          customer_id: paidBy,
        },
        order_meta: {
          return_url: "http://localhost:3000/payment-success",
        },
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const { order_id, payment_link, status } = response.data;

    // 2️⃣ Save initial payment record in DB
    const paymentData = await payment.create({
      orderId: order_id,
      amount,
      paymentStatus: "Pending",
      paidBy,
    });

    res.status(201).json({
      success: true,
      paymentId: paymentData._id,
      orderId: order_id,
      paymentLink: payment_link,
      message: "Payment initiated, complete the payment using Cashfree",
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return next(new ErrorHandler("Failed to create payment", 500));
  }
});

exports.verifyPayment = catchAsyncError(async (req, res, next) => {
  const { orderId, transactionId } = req.body;

  if (!orderId || !transactionId) {
    return next(new ErrorHandler("orderId and transactionId are required", 400));
  }

  // Find payment in DB
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    return next(new ErrorHandler("Payment not found", 404));
  }

  // Update status to Paid
  payment.paymentStatus = "Paid";
  payment.transactionId = transactionId;
  payment.paymentDate = new Date();
  await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    payment,
  });
});

// Get all payments
exports.getAllPayments = catchAsyncError(async (req, res, next) => {
  const payments = await Payment.find().populate("paidBy", "full_name email");
  res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
});

// Get single payment by ID
exports.getSinglePayment = catchAsyncError(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate(
    "paidBy",
    "full_name email"
  );

  if (!payment) {
    return next(new ErrorHandler("Payment not found", 404));
  }

  res.status(200).json({
    success: true,
    payment,
  });
});

// Update payment status (Webhook / Frontend callback)
exports.updatePaymentStatus = catchAsyncError(async (req, res, next) => {
  const { orderId, transactionId, paymentStatus } = req.body;

  const payment = await Payment.findOne({ orderId });
  if (!payment) return next(new ErrorHandler("Payment not found", 404));

  payment.transactionId = transactionId;
  payment.paymentStatus = paymentStatus; // Success / Failed
  await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment status updated",
    payment,
  });
});