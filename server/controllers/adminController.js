const User = require("../models/User");
const Workout = require("../models/Workout");
const Food = require("../models/Food");
const Feedback = require("../models/Feedback");

/**
 * @route   GET /api/admin/stats
 * @desc    Platform-wide counts for the admin dashboard
 * @access  Private/Admin
 */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalWorkouts, totalFood, totalFeedback] = await Promise.all([
      User.countDocuments(),
      Workout.countDocuments(),
      Food.countDocuments(),
      Feedback.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: { totalUsers, totalWorkouts, totalFood, totalFeedback },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    List all registered users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: { users } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers };
