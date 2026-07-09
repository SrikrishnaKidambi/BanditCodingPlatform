Phase 4 — What was built

Python Microservice (src/api.py)

FastAPI server on port 8000. Endpoints:
- POST /assess — initializes user's Bandit from cold-start ratings
- GET /recommend/{user_id} — runs Thompson Sampling, returns problem + mode
- POST /submit — updates Bandit posteriors, persists state
- GET /mastery/{user_id} — full competency profile per arm
- GET /stats/{user_id} — arm counts, weakest/strongest topics

Node.js/Express Backend (backend/)

Server on port 3001 with JWT auth. All routes protected:
- POST /api/auth/register + POST /api/auth/login
- POST /api/assess → proxies to Python
- GET /api/recommend + POST /api/submit → proxies to Python + saves to MySQL
- GET /api/mastery + GET /api/stats
- GET /api/history + GET /api/profile → MySQL queries

MySQL (backend/database/schema.sql)

Two tables: users (auth + profile) and submissions (attempt history with mode tracking)

Frontend — all mock data replaced

- Login.jsx — real sign-in/register with toggle, error handling
- ColdStart.jsx — new page, 10-arm comfort rating form, posts to /api/assess
- All 5 data pages — useEffect + real API calls, loading states
- App.jsx — AuthProvider, ProtectedRoute, /coldstart route added
- Profile.jsx — real logout button