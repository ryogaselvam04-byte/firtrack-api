# FitTrack AI

Full-stack project: AI-powered workout tracker.

```
AI-FitTrack-API/
├── server/   Node.js + Express + MongoDB + JWT + Google Gemini backend
└── client/   Plain HTML/CSS/JS frontend (no build step)
```

## Run both
1. **Backend** — `cd server`, copy `.env.example` to `.env` and fill in your Mongo URI /
   JWT secret / Gemini API key, then `npm install && npm start` (runs on
   `http://localhost:5000`).
2. **Frontend** — `cd client`, serve it with any static server, e.g. `npx serve .`
   (don't just double-click `index.html` — `fetch` needs `http://`, not `file://`).
3. Open the frontend URL, create an account, and start logging workouts and food. Check
   **Planner** for a day-by-day view, and use **Coach**, **Insights**, and **Chat** to
   talk to Gemini through your backend.

See `server/README.md` and `client/README.md` for details on each half.
