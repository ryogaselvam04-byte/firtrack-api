const { verifyToken } = require("../services/jwtService");
const User = require("../models/User");

/**
 * Protects routes by validating the JWT sent in the Authorization header.
 * Expected header format: "Authorization: Bearer <token>"
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

module.exports = protect;
