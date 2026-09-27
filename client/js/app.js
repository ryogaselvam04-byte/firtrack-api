// ============================================================
// Helpers
// ============================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setError(scope, message) {
  const el = $(`[data-error-for="${scope}"]`);
  if (el) el.textContent = message || "";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// View routing (auth screen <-> app screen, and panels within app)
// ============================================================
function hideBootLoader() {
  $("#boot-loader")?.classList.add("hidden");
}

function showAuthScreen() {
  $("#view-auth").classList.remove("hidden");
  $("#view-app").classList.remove("is-active");
  hideBootLoader();
}

function showAppScreen() {
  $("#view-auth").classList.add("hidden");
  $("#view-app").classList.add("is-active");
  const user = Auth.getUser();
  $("#user-name").textContent = user?.name || "athlete";
  $("#rail-admin-btn").classList.toggle("hidden", user?.role !== "admin");
  hideBootLoader();
}

function switchPanel(name) {
  $$(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  $$(".rail-btn[data-view]").forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));

  if (name === "overview") loadOverview();
  if (name === "workouts") loadWorkouts();
  if (name === "planner") loadPlanner();
  if (name === "food") loadFoods();
  if (name === "feedback") loadMyFeedback();
  if (name === "admin") loadAdmin();
  if (name === "premium") loadPremium();
}

// ============================================================
// Auth
// ============================================================
function initAuthTabs() {
  $$(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".auth-tab").forEach((t) => t.classList.remove("is-active"));
      $$(".auth-form").forEach((f) => f.classList.remove("is-active"));
      tab.classList.add("is-active");
      $(`#form-${tab.dataset.tab}`).classList.add("is-active");
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();
  setError("login", "");
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const btn = form.querySelector("button");

  btn.disabled = true;
  try {
    const res = await Api.login(email, password);
    Auth.setSession(res.data.token, res.data.user);
    form.reset();
    enterApp();
  } catch (err) {
    setError("login", err.message);
  } finally {
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  setError("register", "");
  $("#register-login-hint").classList.add("hidden");
  const form = e.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const btn = form.querySelector("button");

  btn.disabled = true;
  try {
    const res = await Api.register(name, email, password);
    Auth.setSession(res.data.token, res.data.user);
    form.reset();
    enterApp();
  } catch (err) {
    setError("register", err.message);
    if (/already exists/i.test(err.message)) {
      $("#register-login-hint").classList.remove("hidden");
      pendingLoginEmail = email;
    }
  } finally {
    btn.disabled = false;
  }
}

let pendingLoginEmail = "";

function gotoLoginTab(prefillEmail = "") {
  $$(".auth-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === "login"));
  $$(".auth-form").forEach((f) => f.classList.toggle("is-active", f.id === "form-login"));
  if (prefillEmail) $('#form-login input[name="email"]').value = prefillEmail;
  $('#form-login input[name="password"]').focus();
}

function handleLogout() {
  Auth.clearSession();
  showAuthScreen();
  showToast("Logged out");
}

function enterApp() {
  showAppScreen();
  switchPanel("overview");
}

// ============================================================
// Overview
// ============================================================
async function loadOverview() {
  const list = $("#recent-list");
  list.innerHTML = `<p class="empty-note">Loading…</p>`;

  try {
    const res = await Api.getWorkouts();
    const workouts = res.data.workouts;

    const total = workouts.length;
    const avgDuration = total
      ? Math.round(workouts.reduce((s, w) => s + w.duration, 0) / total)
      : 0;
    const totalCalories = workouts.reduce((s, w) => s + w.caloriesBurned, 0);

    $("#stat-total").textContent = total;
    $("#stat-duration").textContent = avgDuration;
    $("#stat-calories").textContent = totalCalories;

    renderWorkoutRows(list, workouts.slice(0, 5), { compact: true });
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

// ============================================================
// Workouts panel
// ============================================================
let currentWorkouts = [];

async function loadWorkouts() {
  const list = $("#workout-list");
  list.innerHTML = `<p class="empty-note">Loading…</p>`;
  try {
    const res = await Api.getWorkouts();
    currentWorkouts = res.data.workouts;
    renderWorkoutRows(list, currentWorkouts);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function renderWorkoutRows(container, workouts, { compact = false } = {}) {
  if (!workouts.length) {
    container.innerHTML = `<p class="empty-note">Nothing logged yet. Add your first workout.</p>`;
    return;
  }

  container.innerHTML = workouts
    .map(
      (w) => `
    <div class="log-row" data-id="${w._id}">
      <div class="log-main">
        <img class="log-thumb" src="${workoutImage(w.workoutName)}" alt="${escapeHtml(w.workoutName)}" loading="lazy" onerror="imageFallback(this)">
        <div>
          <div class="lname">${escapeHtml(w.workoutName)}</div>
          <span class="lcat">${escapeHtml(w.category)}</span>
        </div>
      </div>
      <div class="lmeta">${w.duration} min</div>
      <div class="lmeta">${w.caloriesBurned} kcal</div>
      <div class="lmeta">${formatDate(w.workoutDate)}</div>
      ${
        compact
          ? ""
          : `<div class="lactions">
              <button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
            </div>`
      }
    </div>`
    )
    .join("");

  if (!compact) {
    $$(".log-row", container).forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-action="edit"]')?.addEventListener("click", () => openWorkoutModal(id));
      row.querySelector('[data-action="delete"]')?.addEventListener("click", () => confirmDelete(id));
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function handleSearch() {
  const list = $("#workout-list");
  list.innerHTML = `<p class="empty-note">Searching…</p>`;
  try {
    const res = await Api.searchWorkouts({
      name: $("#search-name").value.trim(),
      category: $("#search-category").value.trim(),
      date: $("#search-date").value,
    });
    currentWorkouts = res.data.workouts;
    renderWorkoutRows(list, currentWorkouts);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function clearSearch() {
  $("#search-name").value = "";
  $("#search-category").value = "";
  $("#search-date").value = "";
  loadWorkouts();
}

async function confirmDelete(id) {
  if (!confirm("Delete this workout? This can't be undone.")) return;
  try {
    await Api.deleteWorkout(id);
    showToast("Workout deleted");
    loadWorkouts();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---- Modal (add/edit workout) ----
function openWorkoutModal(id = null) {
  const form = $("#form-workout");
  form.reset();
  setError("workout", "");

  if (id) {
    const w = currentWorkouts.find((x) => x._id === id);
    $("#modal-title").textContent = "Edit workout";
    form.id.value = id;
    form.workoutName.value = w.workoutName;
    form.category.value = w.category;
    form.duration.value = w.duration;
    form.caloriesBurned.value = w.caloriesBurned;
    form.workoutDate.value = new Date(w.workoutDate).toISOString().slice(0, 10);
  } else {
    $("#modal-title").textContent = "Add workout";
    form.id.value = "";
    form.workoutDate.value = todayISO();
  }

  $("#modal-backdrop").classList.add("is-active");
}

function closeWorkoutModal() {
  $("#modal-backdrop").classList.remove("is-active");
}

async function handleWorkoutSubmit(e) {
  e.preventDefault();
  setError("workout", "");
  const form = e.target;
  const id = form.id.value;
  const btn = form.querySelector("button[type=submit]");

  const payload = {
    workoutName: form.workoutName.value.trim(),
    category: form.category.value.trim(),
    duration: Number(form.duration.value),
    caloriesBurned: Number(form.caloriesBurned.value),
    workoutDate: form.workoutDate.value,
  };

  btn.disabled = true;
  try {
    if (id) {
      await Api.updateWorkout(id, payload);
      showToast("Workout updated");
    } else {
      await Api.addWorkout(payload);
      showToast("Workout added");
    }
    closeWorkoutModal();
    loadWorkouts();
  } catch (err) {
    setError("workout", err.message);
  } finally {
    btn.disabled = false;
  }
}


const WORKOUT_IMAGE = {
  "Cycling": "https://images.unsplash.com/photo-1637714890222-435eefed5f2d?auto=format&fit=crop&w=1200&q=85",
  "Strength Training": "https://images.unsplash.com/photo-1745329532589-4f33352c4b10?auto=format&fit=crop&w=1200&q=85",
  "Core & Abs": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85",
  "Morning Run": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85",
  "Yoga & Stretching": "https://images.unsplash.com/photo-1564356533237-46945af0eb1e?auto=format&fit=crop&w=1200&q=85"
};

const FOOD_IMAGE = {
  "Oats with Banana & Nuts": "https://images.unsplash.com/photo-1536511657325-a3f3226b3bbe?auto=format&fit=crop&w=1200&q=85",
  "Grilled Chicken, Rice & Veggies": "https://images.unsplash.com/photo-1772693471187-6e7d364f99ee?auto=format&fit=crop&w=1200&q=85",
  "Mixed Nuts & Fruit": "https://images.unsplash.com/photo-1771871394540-1612e4681edc?auto=format&fit=crop&w=1200&q=85",
  "Paneer/Veg Curry with Roti": "https://images.unsplash.com/photo-1772729440931-e8efd3adc748?auto=format&fit=crop&w=1200&q=85"
};

function workoutImage(name) { return WORKOUT_IMAGE[name] || "assets/gym-01.webp"; }
function imageFallback(el) { el.onerror = null; el.src = "assets/gym-01.webp"; }
function foodImage(name) {
  if (FOOD_IMAGE[name]) return FOOD_IMAGE[name];
  const n = String(name || "").toLowerCase();
  if (n.includes("breakfast") || n.includes("oat") || n.includes("banana")) return FOOD_IMAGE["Oats with Banana & Nuts"];
  if (n.includes("lunch") || n.includes("chicken") || n.includes("rice")) return FOOD_IMAGE["Grilled Chicken, Rice & Veggies"];
  if (n.includes("snack") || n.includes("nuts") || n.includes("fruit")) return FOOD_IMAGE["Mixed Nuts & Fruit"];
  return FOOD_IMAGE["Paneer/Veg Curry with Roti"];
}

// Planner (day-wise view of workouts)
// ============================================================
async function loadPlanner() {
  renderWorkoutTemplate();
  const container = $("#planner-list");
  container.innerHTML = `<p class="empty-note">Loading…</p>`;

  try {
    const res = await Api.getWorkouts();
    const workouts = res.data.workouts;

    if (!workouts.length) {
      container.innerHTML = `<p class="empty-note">Nothing logged yet. Add a workout to see it here by day.</p>`;
      return;
    }

    // Group workouts by calendar day (YYYY-MM-DD), most recent day first
    const groups = new Map();
    workouts.forEach((w) => {
      const key = new Date(w.workoutDate).toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(w);
    });

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

    container.innerHTML = sortedKeys
      .map((key) => {
        const dayWorkouts = groups.get(key);
        const totalMinutes = dayWorkouts.reduce((s, w) => s + w.duration, 0);
        return `
        <div class="day-card">
          <div class="day-card-head">
            <span class="dtitle">${formatDate(key)}</span>
            <span class="day-count">${dayWorkouts.length} workout${dayWorkouts.length > 1 ? "s" : ""} · ${totalMinutes} min</span>
          </div>
          <div class="day-card-body">
            ${dayWorkouts
              .map(
                (w) => `
              <div class="day-item">
                <span class="day-item-main"><img class="day-thumb" src="${workoutImage(w.workoutName)}" alt="${escapeHtml(w.workoutName)}" loading="lazy" onerror="imageFallback(this)"><span>${escapeHtml(w.workoutName)}<span class="lcat">${escapeHtml(w.category)}</span></span></span>
                <span class="lmeta">${w.duration} min · ${w.caloriesBurned} kcal</span>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    container.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

// ============================================================
// Food log
// ============================================================
let currentFoods = [];

async function loadFoods() {
  renderMealTemplate();
  const list = $("#food-list");
  list.innerHTML = `<p class="empty-note">Loading…</p>`;
  try {
    const res = await Api.getFoods();
    currentFoods = res.data.foods;
    renderFoodRows(list, currentFoods);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function renderFoodRows(container, foods) {
  if (!foods.length) {
    container.innerHTML = `<p class="empty-note">Nothing logged yet. Add what you ate.</p>`;
    return;
  }

  container.innerHTML = foods
    .map(
      (f) => `
    <div class="log-row" data-id="${f._id}">
      <div class="log-main">
        <img class="log-thumb" src="${foodImage(f.foodName)}" alt="${escapeHtml(f.foodName)}" loading="lazy">
        <div>
          <div class="lname">${escapeHtml(f.foodName)}</div>
          <span class="lcat">${escapeHtml(f.mealType)}</span>
        </div>
      </div>
      <div class="lmeta">${escapeHtml(f.quantity || "—")}</div>
      <div class="lmeta">${f.calories} kcal</div>
      <div class="lmeta">${formatDate(f.foodDate)}</div>
      <div class="lactions">
        <button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>
    </div>`
    )
    .join("");

  $$(".log-row", container).forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('[data-action="edit"]')?.addEventListener("click", () => openFoodModal(id));
    row.querySelector('[data-action="delete"]')?.addEventListener("click", () => confirmDeleteFood(id));
  });
}

async function handleFoodSearch() {
  const list = $("#food-list");
  list.innerHTML = `<p class="empty-note">Searching…</p>`;
  try {
    const res = await Api.searchFoods({
      name: $("#food-search-name").value.trim(),
      mealType: $("#food-search-meal").value,
      date: $("#food-search-date").value,
    });
    currentFoods = res.data.foods;
    renderFoodRows(list, currentFoods);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function clearFoodSearch() {
  $("#food-search-name").value = "";
  $("#food-search-meal").value = "";
  $("#food-search-date").value = "";
  loadFoods();
}

async function confirmDeleteFood(id) {
  if (!confirm("Delete this food entry?")) return;
  try {
    await Api.deleteFood(id);
    showToast("Food entry deleted");
    loadFoods();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openFoodModal(id = null) {
  const form = $("#form-food");
  form.reset();
  setError("food", "");

  if (id) {
    const f = currentFoods.find((x) => x._id === id);
    $("#food-modal-title").textContent = "Edit food entry";
    form.id.value = id;
    form.foodName.value = f.foodName;
    form.mealType.value = f.mealType;
    form.calories.value = f.calories;
    form.quantity.value = f.quantity || "";
    form.foodDate.value = new Date(f.foodDate).toISOString().slice(0, 10);
  } else {
    $("#food-modal-title").textContent = "Log food";
    form.id.value = "";
    form.foodDate.value = todayISO();
  }

  $("#food-modal-backdrop").classList.add("is-active");
}

function closeFoodModal() {
  $("#food-modal-backdrop").classList.remove("is-active");
}

async function handleFoodSubmit(e) {
  e.preventDefault();
  setError("food", "");
  const form = e.target;
  const id = form.id.value;
  const btn = form.querySelector("button[type=submit]");

  const payload = {
    foodName: form.foodName.value.trim(),
    mealType: form.mealType.value,
    quantity: form.quantity.value.trim(),
    calories: Number(form.calories.value),
    foodDate: form.foodDate.value,
  };

  btn.disabled = true;
  try {
    if (id) {
      await Api.updateFood(id, payload);
      showToast("Food entry updated");
    } else {
      await Api.addFood(payload);
      showToast("Food entry added");
    }
    closeFoodModal();
    loadFoods();
  } catch (err) {
    setError("food", err.message);
  } finally {
    btn.disabled = false;
  }
}

async function handleLoadWorkoutPlan() {
  const entries = buildWorkoutPlan();
  if (!confirm(`This adds ${entries.length} workouts across the next 30 days, starting today. Continue?`)) return;

  const btn = $("#btn-load-workout-plan");
  btn.disabled = true;
  btn.textContent = "Loading…";

  let done = 0;
  try {
    for (const e of entries) {
      await Api.addWorkout({
        workoutName: e.workoutName,
        category: e.category,
        duration: e.duration,
        caloriesBurned: e.caloriesBurned,
        workoutDate: e.workoutDate,
      });
      done++;
    }
    showToast(`Loaded ${done} workouts over 30 days`);
    loadWorkouts();
  } catch (err) {
    showToast(`Stopped after ${done} entries: ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Load 30-day plan";
  }
}

async function handleLoadFoodPlan() {
  const entries = buildFoodPlan();
  if (!confirm(`This adds ${entries.length} food entries across the next 30 days, starting today. Continue?`)) return;

  const btn = $("#btn-load-food-plan");
  btn.disabled = true;
  btn.textContent = "Loading…";

  let done = 0;
  try {
    for (const e of entries) {
      await Api.addFood({
        foodName: e.foodName,
        mealType: e.mealType,
        quantity: e.quantity,
        calories: e.calories,
        foodDate: e.foodDate,
      });
      done++;
    }
    showToast(`Loaded ${done} food entries over 30 days`);
    loadFoods();
  } catch (err) {
    showToast(`Stopped after ${done} entries: ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Load 30-day plan";
  }
}

// ============================================================
// AI Coach (recommendation)
// ============================================================
async function handleCoachSubmit(e) {
  e.preventDefault();
  setError("coach", "");
  const form = e.target;
  const resultBox = $("#coach-result");
  const loading = $("#coach-loading");
  resultBox.innerHTML = "";

  const payload = {
    age: Number(form.age.value),
    fitnessGoal: form.fitnessGoal.value,
    experienceLevel: form.experienceLevel.value,
  };

  loading.classList.remove("hidden");
  try {
    const res = await Api.getRecommendation(payload);
    resultBox.innerHTML = renderRecommendation(res.data.recommendation);
  } catch (err) {
    setError("coach", err.message);
  } finally {
    loading.classList.add("hidden");
  }
}

function renderRecommendation(rec) {
  if (!rec || rec.raw) {
    return `<div class="ai-block"><p class="ai-raw">${escapeHtml(rec?.raw || "No recommendation returned.")}</p></div>`;
  }

  const list = (title, items) =>
    items?.length
      ? `<div class="ai-block"><h4>${title}</h4><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>`
      : "";

  return [
    list("Weekly plan", rec.weeklyPlan),
    list("Suggested exercises", rec.suggestedExercises),
    list("Training tips", rec.trainingTips),
    list("Safety recommendations", rec.safetyRecommendations),
    rec.motivationalMessage
      ? `<div class="ai-block"><h4>From your coach</h4><p>${escapeHtml(rec.motivationalMessage)}</p></div>`
      : "",
  ].join("");
}

// ============================================================
// AI Insights
// ============================================================
async function handleRunInsights() {
  setError("insights", "");
  const resultBox = $("#insights-result");
  const loading = $("#insights-loading");
  resultBox.innerHTML = "";
  loading.classList.remove("hidden");

  try {
    const res = await Api.getInsights();
    resultBox.innerHTML = renderInsights(res.data.insights);
  } catch (err) {
    setError("insights", err.message);
  } finally {
    loading.classList.add("hidden");
  }
}

function renderInsights(insights) {
  if (!insights || insights.raw) {
    return `<div class="ai-block"><p class="ai-raw">${escapeHtml(insights?.raw || "No insights returned.")}</p></div>`;
  }

  const blocks = [];
  if (insights.performanceAnalysis) {
    blocks.push(`<div class="ai-block"><h4>Performance analysis</h4><p>${escapeHtml(insights.performanceAnalysis)}</p></div>`);
  }
  if (insights.improvementSuggestions?.length) {
    blocks.push(
      `<div class="ai-block"><h4>Improvement suggestions</h4><ul>${insights.improvementSuggestions
        .map((i) => `<li>${escapeHtml(i)}</li>`)
        .join("")}</ul></div>`
    );
  }
  if (insights.motivationalAdvice) {
    blocks.push(`<div class="ai-block"><h4>Motivational advice</h4><p>${escapeHtml(insights.motivationalAdvice)}</p></div>`);
  }
  if (insights.fitnessProgressSummary) {
    blocks.push(`<div class="ai-block"><h4>Progress summary</h4><p>${escapeHtml(insights.fitnessProgressSummary)}</p></div>`);
  }
  return blocks.join("");
}

// ============================================================
// Feedback
// ============================================================
async function loadMyFeedback() {
  const list = $("#feedback-list");
  list.innerHTML = `<p class="empty-note">Loading…</p>`;
  try {
    const res = await Api.getMyFeedback();
    renderFeedbackRows(list, res.data.feedback);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function renderFeedbackRows(container, items, { showUser = false } = {}) {
  if (!items.length) {
    container.innerHTML = `<p class="empty-note">No feedback yet.</p>`;
    return;
  }
  container.innerHTML = items
    .map(
      (f) => `
    <div class="log-row" style="grid-template-columns: 1fr auto auto;">
      <div>
        ${showUser ? `<div class="lname">${escapeHtml(f.user?.name || "Unknown")} <span class="lcat">${escapeHtml(f.user?.email || "")}</span></div>` : ""}
        <div class="${showUser ? "lmeta" : "lname"}">${escapeHtml(f.message)}</div>
      </div>
      <div class="lmeta">${f.rating ? "★".repeat(f.rating) + "☆".repeat(5 - f.rating) : "—"}</div>
      <div class="lmeta">${formatDate(f.createdAt)}</div>
    </div>`
    )
    .join("");
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  setError("feedback", "");
  const form = e.target;
  const btn = form.querySelector("button[type=submit]");

  btn.disabled = true;
  try {
    await Api.submitFeedback(form.message.value.trim(), form.rating.value);
    form.reset();
    showToast("Thanks for the feedback!");
    loadMyFeedback();
  } catch (err) {
    setError("feedback", err.message);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================
// Admin
// ============================================================
async function loadAdmin() {
  const usersList = $("#admin-users-list");
  const feedbackList = $("#admin-feedback-list");
  usersList.innerHTML = `<p class="empty-note">Loading…</p>`;
  feedbackList.innerHTML = `<p class="empty-note">Loading…</p>`;

  try {
    const [stats, users, feedback] = await Promise.all([
      Api.getAdminStats(),
      Api.getAdminUsers(),
      Api.getAllFeedback(),
    ]);

    $("#admin-stat-users").textContent = stats.data.totalUsers;
    $("#admin-stat-workouts").textContent = stats.data.totalWorkouts;
    $("#admin-stat-food").textContent = stats.data.totalFood;
    $("#admin-stat-feedback").textContent = stats.data.totalFeedback;

    if (!users.data.users.length) {
      usersList.innerHTML = `<p class="empty-note">No users yet.</p>`;
    } else {
      usersList.innerHTML = users.data.users
        .map(
          (u) => `
        <div class="log-row" style="grid-template-columns: 1fr auto auto;">
          <div>
            <div class="lname">${escapeHtml(u.name)}</div>
            <span class="lcat">${u.role}</span>
          </div>
          <div class="lmeta">${escapeHtml(u.email)}</div>
          <div class="lmeta">${formatDate(u.createdAt)}</div>
        </div>`
        )
        .join("");
    }

    renderFeedbackRows(feedbackList, feedback.data.feedback, { showUser: true });
  } catch (err) {
    usersList.innerHTML = `<p class="empty-note">${err.message}</p>`;
    feedbackList.innerHTML = "";
  }
}

// ============================================================
// Premium (payments)
// ============================================================
async function loadPremium() {
  const user = Auth.getUser();
  $("#premium-status").innerHTML = user?.isPremium
    ? `★ Premium <span>— ${escapeHtml(user.premiumPlan || "")} plan</span>`
    : "Free plan";

  const list = $("#payment-list");
  list.innerHTML = `<p class="empty-note">Loading…</p>`;
  try {
    const res = await Api.getMyPayments();
    renderPaymentRows(list, res.data.payments);
  } catch (err) {
    list.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

function renderPaymentRows(container, payments) {
  if (!payments.length) {
    container.innerHTML = `<p class="empty-note">No payments yet.</p>`;
    return;
  }
  container.innerHTML = payments
    .map(
      (p) => `
    <div class="log-row" style="grid-template-columns: 1fr auto auto auto;">
      <div class="lname">${p.plan === "yearly" ? "Yearly plan" : "Monthly plan"}</div>
      <div class="lmeta">₹${(p.amount / 100).toFixed(2)}</div>
      <span class="lcat">${p.status}</span>
      <div class="lmeta">${formatDate(p.createdAt)}</div>
    </div>`
    )
    .join("");
}

async function handleUpgradeClick(e) {
  const btn = e.currentTarget;
  const plan = btn.dataset.plan;
  setError("premium", "");
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Redirecting…";

  try {
    const returnUrl = window.location.origin + window.location.pathname;
    const res = await Api.createCheckoutSession(plan, returnUrl);
    window.location.href = res.data.url; // hand off to Stripe Checkout
  } catch (err) {
    setError("premium", err.message);
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/**
 * Runs once on load. If we're arriving back from Stripe Checkout
 * (?payment=success&session_id=... or ?payment=cancelled), handle it and
 * clean the URL before the app renders normally.
 */
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  if (!payment) return;

  if (payment === "success") {
    const sessionId = params.get("session_id");
    if (sessionId && Auth.isLoggedIn()) {
      try {
        const res = await Api.verifyPayment(sessionId);
        if (res.data.user) Auth.setSession(Auth.getToken(), res.data.user);
        showToast(res.data.payment?.status === "paid" ? "Payment confirmed — welcome to Premium!" : "Payment was not completed");
      } catch (err) {
        showToast(err.message, true);
      }
    }
  } else if (payment === "cancelled") {
    showToast("Payment cancelled", true);
  }

  window.history.replaceState({}, document.title, window.location.pathname);
}

// ============================================================
// AI Chat
// ============================================================
let chatHistory = []; // [{ role: "user"|"assistant", content }]

function appendChatBubble(text, who) {
  const window_ = $("#chat-window");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${who}`;
  bubble.textContent = text;
  window_.appendChild(bubble);
  window_.scrollTop = window_.scrollHeight;
  return bubble;
}

async function handleChatSubmit(e) {
  e.preventDefault();
  setError("chat", "");
  const input = $("#chat-input");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  appendChatBubble(message, "user");
  chatHistory.push({ role: "user", content: message });

  const typingBubble = appendChatBubble("Thinking…", "bot typing");

  try {
    const res = await Api.chat(message, chatHistory);
    typingBubble.remove();
    appendChatBubble(res.data.reply, "bot");
    chatHistory.push({ role: "assistant", content: res.data.reply });
  } catch (err) {
    typingBubble.remove();
    setError("chat", err.message);
  }
}

// ============================================================
// Init
// ============================================================
async function init() {
  initAuthTabs();

  $("#form-login").addEventListener("submit", handleLogin);
  $("#form-register").addEventListener("submit", handleRegister);
  $("#btn-logout").addEventListener("click", handleLogout);

  $$(".rail-btn[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => switchPanel(btn.dataset.view))
  );

  $("#btn-new-workout").addEventListener("click", () => openWorkoutModal());
  $("#modal-close").addEventListener("click", closeWorkoutModal);
  $("#modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeWorkoutModal();
  });
  $("#form-workout").addEventListener("submit", handleWorkoutSubmit);

  $("#btn-search").addEventListener("click", handleSearch);
  $("#btn-clear-search").addEventListener("click", clearSearch);
  $("#btn-load-workout-plan").addEventListener("click", handleLoadWorkoutPlan);

  $("#link-goto-login").addEventListener("click", (e) => {
    e.preventDefault();
    gotoLoginTab(pendingLoginEmail);
  });

  $("#btn-new-food").addEventListener("click", () => openFoodModal());
  $("#food-modal-close").addEventListener("click", closeFoodModal);
  $("#food-modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "food-modal-backdrop") closeFoodModal();
  });
  $("#form-food").addEventListener("submit", handleFoodSubmit);
  $("#btn-food-search").addEventListener("click", handleFoodSearch);
  $("#btn-food-clear-search").addEventListener("click", clearFoodSearch);
  $("#btn-load-food-plan").addEventListener("click", handleLoadFoodPlan);

  $("#form-coach").addEventListener("submit", handleCoachSubmit);
  $("#btn-run-insights").addEventListener("click", handleRunInsights);
  $("#form-chat").addEventListener("submit", handleChatSubmit);
  $("#form-feedback").addEventListener("submit", handleFeedbackSubmit);
  $$("[data-plan]").forEach((btn) => btn.addEventListener("click", handleUpgradeClick));

  await handlePaymentReturn();

  if (Auth.isLoggedIn()) {
    validateSession();
  } else {
    showAuthScreen();
  }
}

/**
 * A token can exist in localStorage but no longer be valid (server restarted
 * with a different secret, token expired, etc). Confirm it works before
 * trusting it and jumping straight to the app.
 */
async function validateSession() {
  try {
    const res = await Api.getProfile();
    Auth.setSession(Auth.getToken(), res.data.user);
    enterApp();
  } catch (err) {
    Auth.clearSession();
    showAuthScreen();
    setError("login", "Your session expired. Please log in again.");
  }
}

// If any request anywhere in the app comes back 401, snap back to login
// instead of leaving broken panels behind.
window.addEventListener("fittrack:unauthorized", () => {
  if (!Auth.isLoggedIn()) {
    showAuthScreen();
    setError("login", "Your session expired. Please log in again.");
  }
});

document.addEventListener("DOMContentLoaded", init);
