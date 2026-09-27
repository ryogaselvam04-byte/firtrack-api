const jwt = require("jsonwebtoken");

/**
 * Creates a signed JWT token for a given user id.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verifies a JWT token and returns its decoded payload.
 * Throws if the token is invalid or expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
