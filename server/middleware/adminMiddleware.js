/**
 * Restricts a route to users with role "admin". Must run after `protect`,
 * since it relies on req.user being set.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

module.exports = adminOnly;
