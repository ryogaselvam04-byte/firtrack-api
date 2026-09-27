const Payment = require("../models/Payment");
const User = require("../models/User");
const { createCheckoutSession, retrieveSession } = require("../services/stripeService");

/**
 * @route   POST /api/payments/create-checkout-session
 * @desc    Start a Stripe Checkout session for a premium plan
 * @access  Private
 * @body    { plan: "monthly" | "yearly", returnUrl }
 */
const startCheckout = async (req, res, next) => {
  try {
    const { plan, returnUrl } = req.body;

    if (!plan || !returnUrl) {
      return res.status(400).json({ success: false, message: "plan and returnUrl are required" });
    }

    const { session, planDetails } = await createCheckoutSession({
      plan,
      userId: req.user._id.toString(),
      userEmail: req.user.email,
      returnUrl,
    });

    await Payment.create({
      user: req.user._id,
      stripeSessionId: session.id,
      plan,
      amount: planDetails.amount,
      status: "pending",
    });

    res.status(200).json({ success: true, data: { url: session.url } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/verify/:sessionId
 * @desc    Confirm a Checkout Session with Stripe and, if paid, mark the
 *          user premium. Safe to call repeatedly (idempotent).
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const payment = await Payment.findOne({ stripeSessionId: sessionId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({ success: true, data: { payment, alreadyProcessed: true } });
    }

    const session = await retrieveSession(sessionId);

    if (session.payment_status === "paid") {
      payment.status = "paid";
      await payment.save();

      await User.findByIdAndUpdate(req.user._id, {
        isPremium: true,
        premiumSince: new Date(),
        premiumPlan: payment.plan,
      });

      const updatedUser = await User.findById(req.user._id);

      return res.status(200).json({
        success: true,
        message: "Payment confirmed — welcome to Premium!",
        data: { payment, user: updatedUser },
      });
    }

    payment.status = "failed";
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment was not completed",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/mine
 * @desc    Get the authenticated user's payment history
 * @access  Private
 */
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: { payments } });
  } catch (error) {
    next(error);
  }
};

module.exports = { startCheckout, verifyPayment, getMyPayments };
