const Food = require("../models/Food");

/**
 * @route   POST /api/food
 * @desc    Log a new food entry for the authenticated user
 * @access  Private
 */
const addFood = async (req, res, next) => {
  try {
    const { foodName, mealType, quantity, calories, foodDate } = req.body;

    const food = await Food.create({
      user: req.user._id,
      foodName,
      mealType,
      quantity,
      calories,
      foodDate,
    });

    res.status(201).json({
      success: true,
      message: "Food entry added successfully",
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/food
 * @desc    Get all food entries belonging to the authenticated user
 * @access  Private
 */
const getFoods = async (req, res, next) => {
  try {
    const foods = await Food.find({ user: req.user._id }).sort({ foodDate: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: { foods },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/food/search
 * @desc    Search the user's food log by name, meal type, or date
 * @access  Private
 * @query   name, mealType, date (YYYY-MM-DD)
 */
const searchFoods = async (req, res, next) => {
  try {
    const { name, mealType, date } = req.query;
    const query = { user: req.user._id };

    if (name) {
      query.foodName = { $regex: name, $options: "i" };
    }

    if (mealType) {
      query.mealType = mealType;
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.foodDate = { $gte: start, $lt: end };
    }

    const foods = await Food.find(query).sort({ foodDate: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: { foods },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/food/:id
 * @desc    Get a single food entry by its ID
 * @access  Private
 */
const getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, user: req.user._id });

    if (!food) {
      return res.status(404).json({ success: false, message: "Food entry not found" });
    }

    res.status(200).json({ success: true, data: { food } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/food/:id
 * @desc    Update an existing food entry
 * @access  Private
 */
const updateFood = async (req, res, next) => {
  try {
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ success: false, message: "Food entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Food entry updated successfully",
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/food/:id
 * @desc    Delete a food entry
 * @access  Private
 */
const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!food) {
      return res.status(404).json({ success: false, message: "Food entry not found" });
    }

    res.status(200).json({ success: true, message: "Food entry deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { addFood, getFoods, searchFoods, getFoodById, updateFood, deleteFood };
