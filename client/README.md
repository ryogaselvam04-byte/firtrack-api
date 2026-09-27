# FitTrack AI — Frontend

A plain HTML/CSS/JavaScript client for the FitTrack AI backend. No build step, no
framework — just static files that talk to the API with `fetch`.

## Run it
The backend must be running first (see `../server/README.md`), by default at
`http://localhost:5000`.

Because the app uses `fetch`, open it through a local web server rather than
double-clicking the file (some browsers block `fetch` from a `file://` page):

```bash
cd client
npx serve .
# or: python3 -m http.server 8080
```

Then open the printed URL (e.g. `http://localhost:8080`).

If your backend runs somewhere other than `http://localhost:5000`, update
`API_BASE` at the top of `js/api.js`.

## What's inside
- `index.html` — single-page app: auth screen (login/register) + main app (overview,
  workouts, AI coach, AI insights)
- `css/style.css` — styling (scoreboard/track theme: ink background, amber accent,
  Bebas Neue headlines + Inter body)
- `js/api.js` — fetch wrapper; stores the JWT in `localStorage` and attaches it to
  every authenticated request
- `js/app.js` — view routing and all UI logic (login/register, workout CRUD, search,
  AI recommendation, AI insights)

## Pages / panels
- **Overview** — quick stats (total workouts, avg duration, total calories) and the
  5 most recent workouts
- **Workouts** — full list, search by name/category/date, add/edit/delete (modal form)
- **Planner** — the same workout data grouped day-by-day, with a per-day count and
  total minutes
- **Food** — a separate log for what you ate (name, meal, calories, optional quantity),
  with the same search/add/edit/delete pattern as Workouts
- **Coach** — submit age, fitness goal, experience level → AI-generated workout plan
- **Insights** — one click, analyzes your logged workouts via the backend's AI insights
  endpoint
- **Chat** — a free-form chatbot for fitness/nutrition questions, backed by
  `POST /api/ai/chat`; keeps the last few turns of context client-side
- **Contact** — static email/phone card (edit the placeholders in `index.html`, search for
  "Contact", to use your own)
- **Feedback** — submit feedback (with an optional 1–5 rating) and see your own history
- **Admin** — only visible to users with `role: "admin"` on the backend; shows platform-wide
  stats, the user list, and everyone's feedback
- **Premium** — two pricing cards (Monthly ₹199, Yearly ₹1,999), pays via real Stripe
  Checkout in **test mode** (card `4242 4242 4242 4242`, no real money), shows premium
  status and payment history

## Sample 30-day plan
Workouts and Food each show a reference "template" (5 core workout slots with times, 4 core
meal slots with icons) plus a **Load 30-day plan** button that posts 30 days of matching
entries into your real log via the normal API — handy for seeing the app populated instead
of empty, and you can edit/delete any of it afterward like anything else you log.

## Session handling
If your saved login token goes stale (server restarted, token expired), the app now catches
that automatically on any request and returns you to the login screen with a message,
instead of leaving broken panels behind.

Session (JWT + user info) persists in `localStorage`, so refreshing the page keeps
you logged in until you log out.
