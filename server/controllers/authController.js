const User = require("../models/User");
const { generateToken } = require("../services/jwtService");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role:
        process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
          ? "admin"
          : "user",
    });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return a JWT
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get the logged-in user's profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getProfile };
