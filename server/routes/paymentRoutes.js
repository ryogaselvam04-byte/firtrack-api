const express = require("express");
const { startCheckout, verifyPayment, getMyPayments } = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // all payment routes require authentication

router.post("/create-checkout-session", startCheckout);
router.get("/verify/:sessionId", verifyPayment);
router.get("/mine", getMyPayments);

module.exports = router;
