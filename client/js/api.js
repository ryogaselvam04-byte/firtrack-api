// Base URL of the FitTrack AI backend. Change this if your server runs elsewhere.
const API_BASE = "http://localhost:5000/api";

const TOKEN_KEY = "fittrack_token";
const USER_KEY = "fittrack_user";

const Auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

/**
 * Core request helper. Attaches the JWT automatically when present,
 * and throws a normalized Error with the backend's message on failure.
 */
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = Auth.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      "Can't reach the FitTrack AI server. Is the backend running on " + API_BASE + "?"
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    // no JSON body
  }

  if (!response.ok) {
    if (response.status === 401) {
      Auth.clearSession();
      window.dispatchEvent(new CustomEvent("fittrack:unauthorized"));
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

const Api = {
  // ---- Auth ----
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password }, auth: false }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),

  getProfile: () => request("/auth/profile"),

  // ---- Workouts ----
  getWorkouts: () => request("/workouts"),

  searchWorkouts: (params) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/workouts/search${query ? "?" + query : ""}`);
  },

  addWorkout: (payload) => request("/workouts", { method: "POST", body: payload }),

  updateWorkout: (id, payload) => request(`/workouts/${id}`, { method: "PUT", body: payload }),

  deleteWorkout: (id) => request(`/workouts/${id}`, { method: "DELETE" }),

  // ---- Food ----
  getFoods: () => request("/food"),

  searchFoods: (params) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/food/search${query ? "?" + query : ""}`);
  },

  addFood: (payload) => request("/food", { method: "POST", body: payload }),

  updateFood: (id, payload) => request(`/food/${id}`, { method: "PUT", body: payload }),

  deleteFood: (id) => request(`/food/${id}`, { method: "DELETE" }),

  // ---- AI ----
  getRecommendation: (payload) => request("/ai/recommendation", { method: "POST", body: payload }),

  getInsights: () => request("/ai/insights"),

  chat: (message, history) => request("/ai/chat", { method: "POST", body: { message, history } }),

  // ---- Feedback ----
  submitFeedback: (message, rating) =>
    request("/feedback", { method: "POST", body: { message, rating: rating || undefined } }),

  getMyFeedback: () => request("/feedback/mine"),

  getAllFeedback: () => request("/feedback"),

  // ---- Admin ----
  getAdminStats: () => request("/admin/stats"),

  getAdminUsers: () => request("/admin/users"),

  // ---- Payments ----
  createCheckoutSession: (plan, returnUrl) =>
    request("/payments/create-checkout-session", { method: "POST", body: { plan, returnUrl } }),

  verifyPayment: (sessionId) => request(`/payments/verify/${sessionId}`),

  getMyPayments: () => request("/payments/mine"),
};
