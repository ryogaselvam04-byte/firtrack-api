const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workoutName: {
      type: String,
      required: [true, "Workout name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be greater than zero"],
    },
    caloriesBurned: {
      type: Number,
      required: [true, "Calories burned is required"],
      min: [0, "Calories burned cannot be negative"],
    },
    workoutDate: {
      type: Date,
      required: [true, "Workout date is required"],
    },
  },
  { timestamps: true }
);

// Helpful indexes for search
workoutSchema.index({ workoutName: "text", category: "text" });
workoutSchema.index({ user: 1, workoutDate: -1 });

module.exports = mongoose.model("Workout", workoutSchema);
