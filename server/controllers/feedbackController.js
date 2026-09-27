const Feedback = require("../models/Feedback");

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback
 * @access  Private
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { message, rating } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Feedback message is required" });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      message: message.trim(),
      rating: rating || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Thanks for the feedback!",
      data: { feedback },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/feedback/mine
 * @desc    Get the authenticated user's own feedback history
 * @access  Private
 */
const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: feedback.length, data: { feedback } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback from all users
 * @access  Private/Admin
 */
const getAllFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: feedback.length, data: { feedback } });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitFeedback, getMyFeedback, getAllFeedback };
