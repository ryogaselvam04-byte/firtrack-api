// A default starter plan shown when the user hasn't logged anything yet.
// 5 core workout slots (with times) repeating across a 30-day cycle, and a
// matching set of meals per day. "Load" buttons in the UI post these into
// the real backend as actual workout/food entries.

const CORE_WORKOUTS = [
  { time: "6:00 AM", workoutName: "Morning Run", category: "Cardio", duration: 30, caloriesBurned: 250 },
  { time: "7:30 AM", workoutName: "Strength Training", category: "Strength", duration: 45, caloriesBurned: 300 },
  { time: "5:00 PM", workoutName: "Yoga & Stretching", category: "Flexibility", duration: 30, caloriesBurned: 120 },
  { time: "6:30 PM", workoutName: "Core & Abs", category: "Strength", duration: 20, caloriesBurned: 150 },
  { time: "7:00 AM", workoutName: "Cycling", category: "Cardio", duration: 40, caloriesBurned: 350 },
];

const CORE_MEALS = [
  { mealType: "Breakfast", foodName: "Oats with Banana & Nuts", quantity: "1 bowl", calories: 320, icon: "🥣" },
  { mealType: "Lunch", foodName: "Grilled Chicken, Rice & Veggies", quantity: "1 plate", calories: 550, icon: "🍛" },
  { mealType: "Snack", foodName: "Mixed Nuts & Fruit", quantity: "1 handful", calories: 180, icon: "🍎" },
  { mealType: "Dinner", foodName: "Paneer/Veg Curry with Roti", quantity: "2 roti + curry", calories: 480, icon: "🍲" },
];

const PLAN_DAYS = 30;

/** Returns the 5 core workout slots, used as a "typical week" reference in Planner. */
function getCoreWorkoutTemplate() {
  return CORE_WORKOUTS;
}

/** Returns the 4 core meal slots, used as a "typical day" reference in Food. */
function getCoreMealTemplate() {
  return CORE_MEALS;
}

/**
 * Builds 30 days of workout entries starting today, cycling through the
 * core workout slots (2 per day) so it isn't identical every day.
 */
function buildWorkoutPlan(startDate = new Date()) {
  const plan = [];
  for (let day = 0; day < PLAN_DAYS; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().slice(0, 10);

    const slotA = CORE_WORKOUTS[day % CORE_WORKOUTS.length];
    const slotB = CORE_WORKOUTS[(day + 2) % CORE_WORKOUTS.length];

    [slotA, slotB].forEach((slot) => {
      plan.push({
        day: day + 1,
        workoutDate: dateStr,
        time: slot.time,
        workoutName: slot.workoutName,
        category: slot.category,
        duration: slot.duration,
        caloriesBurned: slot.caloriesBurned,
      });
    });
  }
  return plan;
}

/**
 * Builds 30 days of food entries starting today, using the 4 core meals
 * each day (with light variation) to roughly match workout-day energy needs.
 */
function buildFoodPlan(startDate = new Date()) {
  const plan = [];
  for (let day = 0; day < PLAN_DAYS; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().slice(0, 10);

    CORE_MEALS.forEach((meal) => {
      plan.push({
        day: day + 1,
        foodDate: dateStr,
        mealType: meal.mealType,
        foodName: meal.foodName,
        quantity: meal.quantity,
        calories: meal.calories,
        icon: meal.icon,
      });
    });
  }
  return plan;
}
