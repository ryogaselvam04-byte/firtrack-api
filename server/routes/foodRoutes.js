const express = require("express");
const {
  addFood,
  getFoods,
  searchFoods,
  getFoodById,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // all food routes require authentication

// NOTE: /search must be declared before /:id so "search" isn't treated as an ID
router.get("/search", searchFoods);

router.route("/").post(addFood).get(getFoods);

router.route("/:id").get(getFoodById).put(updateFood).delete(deleteFood);

module.exports = router;
