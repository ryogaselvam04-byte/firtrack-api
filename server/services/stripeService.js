// Stripe is only initialized if a secret key is configured, so the rest of
// the app keeps working even before payments are set up.
let stripeClient = null;

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

// Prices in the smallest currency unit (paise for INR: ₹1 = 100 paise)
const PLANS = {
  monthly: { label: "FitTrack AI Premium — Monthly", amount: 19900, interval: "month" },
  yearly: { label: "FitTrack AI Premium — Yearly", amount: 199900, interval: "year" },
};

/**
 * Creates a Stripe Checkout Session (one-time payment) for the given plan.
 * `returnUrl` is the frontend origin (e.g. http://localhost:3000); Stripe
 * redirects back there with a session_id on success.
 */
const createCheckoutSession = async ({ plan, userId, userEmail, returnUrl }) => {
  const stripe = getStripe();
  if (!stripe) {
    const err = new Error(
      "Payments aren't configured yet. Add STRIPE_SECRET_KEY to server/.env (get a free test key at https://dashboard.stripe.com/test/apikeys)."
    );
    err.statusCode = 503;
    throw err;
  }

  const planDetails = PLANS[plan];
  if (!planDetails) {
    const err = new Error("Invalid plan. Use 'monthly' or 'yearly'.");
    err.statusCode = 400;
    throw err;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: planDetails.label },
          unit_amount: planDetails.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?payment=cancelled`,
    metadata: { userId, plan },
  });

  return { session, planDetails };
};

/**
 * Retrieves a Checkout Session from Stripe to confirm its payment status.
 */
const retrieveSession = async (sessionId) => {
  const stripe = getStripe();
  if (!stripe) {
    const err = new Error("Payments aren't configured yet. Add STRIPE_SECRET_KEY to server/.env.");
    err.statusCode = 503;
    throw err;
  }
  return stripe.checkout.sessions.retrieve(sessionId);
};

module.exports = { PLANS, createCheckoutSession, retrieveSession };
