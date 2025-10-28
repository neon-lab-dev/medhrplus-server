const axios = require("axios");
const catchAsyncError = require("../middleware/catchAsyncError.js");
const payment = require("../models/payment.js");
const employee = require("../models/employee.js");

exports.createPayment = async (req, res, next) => {
  try {
    const { amount, paidBy, customerPhone, customerEmail } = req.body;
    if (!amount || !paidBy)
      return res.status(400).json({ error: "amount & paidBy required" });

    const payload = {
      order_amount: amount,
      order_currency: "INR",
      order_note: "Payment for Employee registration",
      customer_details: {
        customer_id: paidBy,
        customer_phone: customerPhone,
        customer_email: customerEmail,
      },
      order_meta: {
        return_url: "http://localhost:3000/payment/sucess?orderId={null}", // production return_url
      },
    };

    const resp = await axios.post(
      `${process.env.CF_BASE_URL}/pg/orders`,
      payload,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
        },
      }
    );

    // resp.data contains order_id and payment_session_id
    const { order_id, payment_session_id } = resp.data;

    // Save to your DB: order_id, paymentSessionId, amount, status: Pending, paidBy, etc.
    await payment.create({
      orderId: order_id,
      paymentSessionId: payment_session_id,
      amount,
      paymentStatus: "Pending",
      paidBy,
    });

    return res.status(201).json({
      success: true,
      data: resp.data, // now frontend can do resData.data.payment_session_id
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to create payment" });
  }
};

// safer server-side verify
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).send({ error: "orderId required" });

    console.log("Verifying orderId:", orderId);

    const resp = await axios.get(
      `${process.env.CF_BASE_URL}/pg/orders/${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const order = resp.data;

    if (order.order_status === "PAID" || order.order_status === "Paid") {
      employee.findByIdAndUpdate(order.customer_id, { isPaid: true });
      return res.json({ success: true, message: "Verified", order });
    }

    return res
      .status(400)
      .json({ success: false, message: "Payment not completed", order });
  } catch (err) {
    console.error(
      "Error verifying payment:",
      err.response?.data || err.message
    );
    res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
};

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
