# FitTrack AI — Backend

Personalized fitness recommendations powered by AI. A secure, scalable REST API built with
Node.js, Express.js, MongoDB (Mongoose), JWT authentication, and Google Gemini AI.

## Tech Stack
- Node.js + Express.js (MVC architecture)
- MongoDB + Mongoose
- JWT (jsonwebtoken) for authentication
- bcrypt.js for password hashing
- Google Gemini AI (`@google/generative-ai`) for recommendations & insights

## Project Structure
```
server/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js                # User schema (bcrypt hashing, unique email)
│   └── Workout.js             # Workout schema
├── middleware/
│   ├── authMiddleware.js      # JWT verification ("protect")
│   └── errorMiddleware.js     # 404 + centralized error handler
├── services/
│   ├── jwtService.js          # token generate/verify
│   ├── passwordService.js     # hash/compare helpers
│   └── geminiService.js       # Gemini prompt calls
├── controllers/
│   ├── authController.js      # register, login, profile
│   ├── workoutController.js   # CRUD + search
│   └── aiController.js        # recommendation, insights
├── routes/
│   ├── authRoutes.js
│   ├── workoutRoutes.js
│   └── aiRoutes.js
├── server.js                  # app entry point
├── .env.example
└── package.json
```

## Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment variables** — copy `.env.example` to `.env` and fill in values:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/aifittrack
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
3. **Run MongoDB** locally, or point `MONGO_URI` at MongoDB Atlas.
4. **Start the server**
   ```bash
   npm start        # production
   npm run dev       # development, with nodemon
   ```
   Server runs at `http://localhost:5000`.

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint    | Access  | Description             |
|--------|-------------|---------|--------------------------|
| POST   | /register   | Public  | Register a new user     |
| POST   | /login      | Public  | Login, returns JWT       |
| GET    | /profile    | Private | Get logged-in user info |

### Workouts — `/api/workouts` (all routes require `Authorization: Bearer <token>`)
| Method | Endpoint      | Description                                   |
|--------|---------------|------------------------------------------------|
| POST   | /             | Add a workout                                  |
| GET    | /             | Get all workouts for the user                  |
| GET    | /search       | Search by `?name=&category=&date=YYYY-MM-DD`   |
| GET    | /:id          | Get a workout by ID                            |
| PUT    | /:id          | Update a workout                               |
| DELETE | /:id          | Delete a workout                               |

### Food — `/api/food` (all routes require `Authorization: Bearer <token>`)
| Method | Endpoint  | Description                                                    |
|--------|-----------|------------------------------------------------------------------|
| POST   | /         | Log food (`foodName`, `mealType`, `calories`, `quantity?`, `foodDate`) |
| GET    | /         | Get all food entries for the user                                |
| GET    | /search   | Search by `?name=&mealType=&date=YYYY-MM-DD`                     |
| GET    | /:id      | Get a food entry by ID                                            |
| PUT    | /:id      | Update a food entry                                               |
| DELETE | /:id      | Delete a food entry                                               |

### AI — `/api/ai` (all routes require `Authorization: Bearer <token>`)
| Method | Endpoint        | Description                                                  |
|--------|-----------------|----------------------------------------------------------------|
| POST   | /recommendation | Body: `{ age, fitnessGoal, experienceLevel }` → AI workout plan |
| GET    | /insights       | Auto-computes stats from the user's workouts and returns AI insights (or pass `?totalWorkouts=&averageDuration=&totalCaloriesBurned=` to override) |
| POST   | /chat           | Body: `{ message, history? }` → conversational reply (`history`: `[{ role: "user"|"assistant", content }]`) |

### Feedback — `/api/feedback` (all routes require `Authorization: Bearer <token>`)
| Method | Endpoint | Access | Description                                  |
|--------|----------|--------|------------------------------------------------|
| POST   | /        | User   | Submit feedback (`message`, `rating?` 1-5)     |
| GET    | /mine    | User   | Get your own feedback history                  |
| GET    | /        | Admin  | Get everyone's feedback                        |

### Admin — `/api/admin` (requires an admin token)
| Method | Endpoint | Description                                                  |
|--------|----------|------------------------------------------------------------------|
| GET    | /stats   | Platform counts: total users, workouts, food entries, feedback  |
| GET    | /users   | List every registered user                                       |

**Becoming an admin:** set `ADMIN_EMAIL` in `.env` to the email you'll register with — that
account gets `role: "admin"` automatically on registration. For an existing account, update
its `role` field to `"admin"` directly in MongoDB (e.g. via MongoDB Compass or `mongosh`).

### Payments — `/api/payments` (all routes require `Authorization: Bearer <token>`)
| Method | Endpoint                    | Description                                                    |
|--------|------------------------------|--------------------------------------------------------------------|
| POST   | /create-checkout-session     | Body: `{ plan: "monthly"\|"yearly", returnUrl }` → `{ url }` to redirect the browser to Stripe Checkout |
| GET    | /verify/:sessionId           | Confirms a session with Stripe; marks the user premium if paid    |
| GET    | /mine                        | Get the user's own payment history                                |

**Setup (Stripe test mode, free):**
1. Create a free Stripe account, then grab your **test** secret key from
   https://dashboard.stripe.com/test/apikeys (starts with `sk_test_...`).
2. Put it in `server/.env` as `STRIPE_SECRET_KEY`.
3. That's it — no business verification needed for test mode. Test card:
   `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
4. Until you add a key, the payment endpoints return a clear "Payments aren't configured
   yet" message instead of crashing the server.

## Sample Requests

**Register**
```json
POST /api/auth/register
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "password123"
}
```

**Add Workout**
```json
POST /api/workouts
Authorization: Bearer <token>
{
  "workoutName": "Morning Running",
  "category": "Cardio",
  "duration": 30,
  "caloriesBurned": 250,
  "workoutDate": "2026-09-24"
}
```

**AI Recommendation**
```json
POST /api/ai/recommendation
Authorization: Bearer <token>
{
  "age": 25,
  "fitnessGoal": "Muscle Gain",
  "experienceLevel": "Beginner"
}
```

## Testing
Import `FitTrackAI.postman_collection.json` into Postman. Set the collection variable
`token` after login/register, and `workoutId` after adding a workout, to test protected routes.

## Notes
- All protected routes validate the JWT via `authMiddleware.js` and reject requests without
  a valid `Authorization: Bearer <token>` header.
- Passwords are hashed with bcrypt before being stored; the hash is stripped from all JSON
  responses via a `toJSON` override on the User model.
- Gemini responses are requested as structured JSON; if Gemini's output can't be parsed,
  the raw text is returned under a `raw` key instead of throwing.
- The Gemini model is set via the `gemini-flash-latest` alias (not a dated version like
  `gemini-1.5-flash`), so it keeps working as Google retires specific model versions.
- Every route under `/api/admin`, and `GET /api/feedback`, requires `role: "admin"` on the
  logged-in user (see "Becoming an admin" above).
