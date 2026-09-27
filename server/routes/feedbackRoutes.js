const express = require("express");
const { submitFeedback, getMyFeedback, getAllFeedback } = require("../controllers/feedbackController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(protect); // all feedback routes require authentication

router.post("/", submitFeedback);
router.get("/mine", getMyFeedback);
router.get("/", adminOnly, getAllFeedback); // admin-only: everyone's feedback

module.exports = router;
