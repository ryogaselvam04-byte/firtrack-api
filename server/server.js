require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const foodRoutes = require("./routes/foodRoutes");
const aiRoutes = require("./routes/aiRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FitTrack AI backend is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling (must be registered last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
