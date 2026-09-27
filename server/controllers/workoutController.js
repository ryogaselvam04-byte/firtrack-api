const Workout = require("../models/Workout");

/**
 * @route   POST /api/workouts
 * @desc    Create a new workout record for the authenticated user
 * @access  Private
 */
const addWorkout = async (req, res, next) => {
  try {
    const { workoutName, category, duration, caloriesBurned, workoutDate } = req.body;

    const workout = await Workout.create({
      user: req.user._id,
      workoutName,
      category,
      duration,
      caloriesBurned,
      workoutDate,
    });

    res.status(201).json({
      success: true,
      message: "Workout added successfully",
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts
 * @desc    Get all workouts belonging to the authenticated user
 * @access  Private
 */
const getWorkouts = async (req, res, next) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ workoutDate: -1 });

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: { workouts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts/search
 * @desc    Search the user's workouts by name, category, or date
 * @access  Private
 * @query   name, category, date (YYYY-MM-DD)
 */
const searchWorkouts = async (req, res, next) => {
  try {
    const { name, category, date } = req.query;
    const query = { user: req.user._id };

    if (name) {
      query.workoutName = { $regex: name, $options: "i" };
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.workoutDate = { $gte: start, $lt: end };
    }

    const workouts = await Workout.find(query).sort({ workoutDate: -1 });

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: { workouts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts/:id
 * @desc    Get a single workout by its ID
 * @access  Private
 */
const getWorkoutById = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workouts/:id
 * @desc    Update an existing workout
 * @access  Private
 */
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout updated successfully",
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/workouts/:id
 * @desc    Delete a workout
 * @access  Private
 */
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addWorkout,
  getWorkouts,
  searchWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
