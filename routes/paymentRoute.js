const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedUser } = require("../middleware/auth.js");
const { createPayment, verifyPayment, getAllPayments, getSinglePayment, updatePaymentStatus } = require("../controllers/paymentController.js");
const router = express.Router();

router.route("/create").post(isAuthenticatedUser, createPayment);
router.route("/verify").post(isAuthenticatedUser, verifyPayment);
router.route("/").get(isAuthenticatedAdmin, getAllPayments);
router.route("/:id").get(isAuthenticatedAdmin, getSinglePayment);
router.route("/update-status").put(isAuthenticatedAdmin, updatePaymentStatus);
module.exports = router;
