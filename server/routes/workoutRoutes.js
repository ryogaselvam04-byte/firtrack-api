const express = require("express");
const {
  addWorkout,
  getWorkouts,
  searchWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // all workout routes require authentication

// NOTE: /search must be declared before /:id so "search" isn't treated as an ID
router.get("/search", searchWorkouts);

router.route("/").post(addWorkout).get(getWorkouts);

router.route("/:id").get(getWorkoutById).put(updateWorkout).delete(deleteWorkout);

module.exports = router;
