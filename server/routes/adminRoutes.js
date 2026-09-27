const express = require("express");
const { getStats, getUsers } = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(protect, adminOnly); // every route here requires an authenticated admin

router.get("/stats", getStats);
router.get("/users", getUsers);

module.exports = router;
