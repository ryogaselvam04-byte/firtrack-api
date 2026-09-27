const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    amount: {
      type: Number, // in the smallest currency unit (paise for INR)
      required: true,
    },
    currency: {
      type: String,
      default: "inr",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
