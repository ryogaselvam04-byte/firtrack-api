const express = require("express");
const { workoutRecommendation, fitnessInsights, chat } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // all AI routes require authentication

router.post("/recommendation", workoutRecommendation);
router.get("/insights", fitnessInsights);
router.post("/chat", chat);

module.exports = router;
