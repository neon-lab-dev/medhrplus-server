const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth.js");
const { createPayment, verifyPayment, getAllPayments, getSinglePayment, updatePaymentStatus } = require("../controllers/paymentController.js");
const router = express.Router();

router.post("/create", createPayment);
router.post("/verify", verifyPayment);
router.get("/", isAuthenticatedAdmin, getAllPayments);
router.get("/:id", isAuthenticatedAdmin, getSinglePayment);
router.put("/update-status", isAuthenticatedAdmin, updatePaymentStatus);

module.exports = router;
