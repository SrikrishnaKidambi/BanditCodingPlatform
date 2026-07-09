# BanditLearn — Adaptive Coding Practice Platform

Recommendation engine powered by Educational Thompson Sampling.

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0 (running as a service) |

---

## First-Time Setup

### 1. Database
Open `backend/database/schema.sql` in MySQL Workbench and execute it.
This creates the `banditlearn` database with `users` and `submissions` tables.

### 2. Backend environment
Edit `backend/.env` and set your MySQL root password:
```
DB_PASSWORD=your_mysql_password
```

### 3. Install Python dependencies
```powershell
pip install -r requirements.txt
```

### 4. Install Node.js dependencies
```powershell
cd backend
npm install
```

### 5. Install frontend dependencies
```powershell
cd frontend
npm install
```

---

## Running the Stack

Open **3 separate terminals** and run one command in each.

### Terminal 1 — Python Microservice (port 8000)
```powershell
cd src
python api.py
```

### Terminal 2 — Node.js Backend (port 3001)
```powershell
cd backend
npm run dev
```

### Terminal 3 — React Frontend (port 5173)
```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Health Checks

```powershell
# Python microservice
curl http://localhost:8000/health

# Node.js backend
curl http://localhost:3001/api/health
```

Or just open those URLs in a browser — both should return `{"status":"ok"}`.

---

## Simulation (no backend needed)

Run the Thompson Sampling simulation standalone:
```powershell
cd src
python main.py
```

Run interactive real-user session (CLI):
```powershell
cd src
python main.py --session
```

---

## Common Fixes

### Port already in use
```powershell
# Kill port 3001 (backend)
npx kill-port 3001

# Kill port 8000 (Python microservice)
npx kill-port 8000
```

### MySQL schema (PowerShell — pipe instead of redirect)
```powershell
Get-Content "backend\database\schema.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

### Verify database after setup
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE banditlearn; SHOW TABLES;"
```

### Check submissions in MySQL
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT * FROM banditlearn.submissions ORDER BY attempted_at DESC LIMIT 10;"
```

---

## Testing Checklist

### Auth
- [ ] Register a new account → redirects to ColdStart page
- [ ] Submit cold-start ratings → redirects to Dashboard
- [ ] Log out → back to Login
- [ ] Log back in → goes straight to Dashboard (cold-start skipped)
- [ ] Wrong password → error message shown
- [ ] Duplicate email → "already registered" error

### Recommendation engine
- [ ] Dashboard loads real stats and today's recommendation
- [ ] Recommended Problem page shows mode label (learning / weak / revision)
- [ ] Mark as Solved → green confirmation, Bandit state updates
- [ ] Mark as Failed → red confirmation, Bandit state updates
- [ ] Next Recommendation → new problem loads

### Data persistence
- [ ] Solve/fail a few problems, close browser, reopen and log back in
- [ ] Dashboard stats reflect previous session
- [ ] `data/users/{uuid}.json` exists with updated alpha/beta values

### History & Analytics
- [ ] Practice History shows real attempts with date, mode, outcome
- [ ] Search by title or topic filters correctly
- [ ] Analytics mode distribution and arm counts update after attempts

---

## Project Structure

```
BanditCodingPlatform/
├── src/                  # Python recommendation engine
│   ├── api.py            # FastAPI microservice (port 8000)
│   ├── bandit.py         # Thompson Sampling core
│   ├── competency.py     # Mastery estimation
│   ├── coldstart.py      # Cold-start assessment
│   ├── session.py        # State persistence (JSON)
│   ├── repository.py     # Problem retrieval
│   ├── simulation.py     # Simulation harness
│   └── main.py           # CLI entry point
├── backend/              # Node.js/Express backend (port 3001)
│   ├── server.js
│   ├── routes/           # auth, recommend, history
│   ├── middleware/        # JWT auth
│   ├── config/           # MySQL connection pool
│   └── database/         # schema.sql
├── frontend/             # React + Tailwind (port 5173)
│   └── src/
│       ├── pages/        # Login, ColdStart, Dashboard, ...
│       ├── services/     # api.js (axios)
│       └── context/      # AuthContext, ThemeContext
├── data/
│   ├── problems.json     # Problem repository
│   └── users/            # Per-user Bandit state (auto-created)
└── requirements.txt
```
