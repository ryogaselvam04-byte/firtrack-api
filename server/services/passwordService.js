const bcrypt = require("bcryptjs");

/**
 * Hashes a plaintext password.
 * (Note: User model already hashes on save via a pre-save hook;
 * this helper is exposed for any place that needs a hash outside that flow.)
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Compares a plaintext password against a bcrypt hash.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
