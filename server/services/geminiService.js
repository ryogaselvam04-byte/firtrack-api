const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use the "latest" alias so this keeps working as Google retires specific
// dated model versions (gemini-1.5-flash, for example, has been retired).
const MODEL_NAME = "gemini-flash-latest";

/**
 * Sends a prompt to Google Gemini and returns the raw text response.
 */
const generateContent = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Builds a workout recommendation based on age, fitness goal, and experience level,
 * then returns Gemini's generated plan.
 */
const getWorkoutRecommendation = async ({ age, fitnessGoal, experienceLevel }) => {
  const prompt = `
You are a certified fitness coach AI. Based on the following user profile, generate a
personalized workout recommendation.

Age: ${age}
Fitness Goal: ${fitnessGoal}
Experience Level: ${experienceLevel}

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact shape:
{
  "weeklyPlan": ["Day 1: ...", "Day 2: ..."],
  "suggestedExercises": ["...", "..."],
  "trainingTips": ["...", "..."],
  "safetyRecommendations": ["...", "..."],
  "motivationalMessage": "..."
}
`;

  const raw = await generateContent(prompt);
  return safeParseJSON(raw);
};

/**
 * Builds a fitness insight summary based on aggregated workout statistics.
 */
const getFitnessInsights = async ({ totalWorkouts, averageDuration, totalCaloriesBurned }) => {
  const prompt = `
You are a fitness data analyst AI. Analyze the following workout statistics for a user
and generate a personalized fitness insight summary.

Total Workouts: ${totalWorkouts}
Average Workout Duration (minutes): ${averageDuration}
Total Calories Burned: ${totalCaloriesBurned}

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact shape:
{
  "performanceAnalysis": "...",
  "improvementSuggestions": ["...", "..."],
  "motivationalAdvice": "...",
  "fitnessProgressSummary": "..."
}
`;

  const raw = await generateContent(prompt);
  return safeParseJSON(raw);
};

/**
 * Gemini sometimes wraps JSON in markdown code fences; strip them before parsing.
 * Falls back to returning the raw text if parsing fails.
 */
const safeParseJSON = (text) => {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return { raw: cleaned };
  }
};

/**
 * Conversational fitness chatbot. Keeps a short rolling history so replies
 * stay on-topic across turns, and returns plain text (not JSON).
 * `history` is an array of { role: "user" | "assistant", content: string }.
 */
const chatWithCoach = async ({ message, history = [] }) => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are FitTrack AI's in-app fitness assistant. Answer questions about workouts, " +
      "nutrition, recovery, and motivation clearly and concisely. Keep replies short and " +
      "practical (a few sentences or a short list), and add a brief safety note only when " +
      "genuinely relevant (e.g. injury, medical, or extreme diet questions). You are not a " +
      "doctor — for medical concerns, suggest seeing a professional.",
  });

  // Gemini's chat API expects alternating user/model turns
  const chatHistory = history
    .slice(-10) // keep the last few turns so prompts stay small
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    }));

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
};

module.exports = { getWorkoutRecommendation, getFitnessInsights, chatWithCoach };
