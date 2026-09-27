const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    mealType: {
      type: String,
      required: [true, "Meal type is required"],
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
    },
    quantity: {
      type: String,
      trim: true,
      default: "",
    },
    calories: {
      type: Number,
      required: [true, "Calories is required"],
      min: [0, "Calories cannot be negative"],
    },
    foodDate: {
      type: Date,
      required: [true, "Food date is required"],
    },
  },
  { timestamps: true }
);

foodSchema.index({ foodName: "text", mealType: "text" });
foodSchema.index({ user: 1, foodDate: -1 });

module.exports = mongoose.model("Food", foodSchema);
