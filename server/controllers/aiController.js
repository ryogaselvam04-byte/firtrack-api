const Workout = require("../models/Workout");
const {
  getWorkoutRecommendation,
  getFitnessInsights,
  chatWithCoach,
} = require("../services/geminiService");

/**
 * @route   POST /api/ai/recommendation
 * @desc    Get an AI-generated personalized workout recommendation
 * @access  Private
 * @body    { age, fitnessGoal, experienceLevel }
 */
const workoutRecommendation = async (req, res, next) => {
  try {
    const { age, fitnessGoal, experienceLevel } = req.body;

    if (!age || !fitnessGoal || !experienceLevel) {
      return res.status(400).json({
        success: false,
        message: "age, fitnessGoal, and experienceLevel are required",
      });
    }

    const recommendation = await getWorkoutRecommendation({ age, fitnessGoal, experienceLevel });

    res.status(200).json({
      success: true,
      message: "Workout recommendation generated successfully",
      data: { recommendation },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/insights
 * @desc    Get AI-generated fitness insights based on the user's workout statistics
 * @access  Private
 * @note    Statistics are computed automatically from the user's stored workouts.
 *          Pass ?totalWorkouts=&averageDuration=&totalCaloriesBurned= to override manually.
 */
const fitnessInsights = async (req, res, next) => {
  try {
    let { totalWorkouts, averageDuration, totalCaloriesBurned } = req.query;

    // If stats aren't provided manually, compute them from the user's workout history
    if (!totalWorkouts || !averageDuration || !totalCaloriesBurned) {
      const stats = await Workout.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalWorkouts: { $sum: 1 },
            averageDuration: { $avg: "$duration" },
            totalCaloriesBurned: { $sum: "$caloriesBurned" },
          },
        },
      ]);

      const computed = stats[0] || { totalWorkouts: 0, averageDuration: 0, totalCaloriesBurned: 0 };
      totalWorkouts = totalWorkouts || computed.totalWorkouts;
      averageDuration = averageDuration || Math.round(computed.averageDuration || 0);
      totalCaloriesBurned = totalCaloriesBurned || computed.totalCaloriesBurned;
    }

    if (Number(totalWorkouts) === 0) {
      return res.status(400).json({
        success: false,
        message: "No workout data available yet. Add some workouts first.",
      });
    }

    const insights = await getFitnessInsights({
      totalWorkouts,
      averageDuration,
      totalCaloriesBurned,
    });

    res.status(200).json({
      success: true,
      message: "Fitness insights generated successfully",
      data: {
        statsUsed: { totalWorkouts, averageDuration, totalCaloriesBurned },
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with the FitTrack AI assistant
 * @access  Private
 * @body    { message, history? }  history: [{ role: "user"|"assistant", content }]
 */
const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const reply = await chatWithCoach({ message, history: Array.isArray(history) ? history : [] });

    res.status(200).json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { workoutRecommendation, fitnessInsights, chat };
