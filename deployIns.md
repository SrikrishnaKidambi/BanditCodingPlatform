# Deployment Instructions — BanditLearn

Deploy order: Database → Python Microservice → Backend → Frontend

---

## Prerequisites

- GitHub repo pushed with latest code
- Accounts on: [Railway](https://railway.app), [Render](https://render.com), [Vercel](https://vercel.com)

---

## Step 1 — Fix File-Based Session Storage (Do This Before Deploying)

The Python microservice saves Bandit state to `data/users/*.json`.
Cloud platforms have ephemeral filesystems — these files get wiped on restart.

**Fix option A — Railway Persistent Volume (Quick, 10 min)**

When deploying the Python microservice on Railway:
- Go to your service → **Volumes** tab
- Add a volume mounted at `/app/data/users`
- Railway will persist this directory across restarts and redeploys

**Fix option B — DB-backed state (Proper, ~45 min)**

Add a `bandit_states` table to MySQL and move `session.py` to read/write from it instead of JSON files. Recommended before going to production with real users.

---

## Step 2 — Database → Railway MySQL

1. Go to [railway.app](https://railway.app) → **New Project → Database → MySQL**
2. Once provisioned, click the MySQL service → **Variables** tab
3. Copy these values — you'll need them for the backend:
   ```
   MYSQL_HOST
   MYSQL_PORT
   MYSQL_USER
   MYSQL_PASSWORD
   MYSQL_DATABASE
   ```
4. Click **Connect** tab → open the MySQL shell or use a local client to run the schema:
   ```sql
   -- paste contents of backend/database/schema.sql here
   ```
5. Verify:
   ```sql
   SHOW TABLES;
   -- should show: submissions, users
   ```

---

## Step 3 — Python Microservice → Render (or Railway)

### Option A — Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:
   ```
   Name:        banditlearn-engine
   Branch:      main
   Root Dir:    (leave blank)
   Runtime:     Python 3
   Build Cmd:   pip install -r requirements.txt
   Start Cmd:   uvicorn src.api:app --host 0.0.0.0 --port 8000
   ```
4. Add environment variable:
   ```
   PORT = 8000
   ```
5. If using persistent volume (Fix option A): add a disk mounted at `/app/data/users`
6. Click **Deploy** — wait for build to finish
7. Copy the service URL e.g. `https://banditlearn-engine.onrender.com`
8. Verify: open `https://banditlearn-engine.onrender.com/health` → `{"status":"ok"}`

### Option B — Railway

1. **New Project → Deploy from GitHub repo**
2. Set root directory to the repo root
3. Set start command:
   ```
   uvicorn src.api:app --host 0.0.0.0 --port $PORT
   ```
4. Add volume at `/app/data/users` (see Step 1)
5. Railway auto-assigns a public URL — copy it

---

## Step 4 — Backend → Render (or Railway)

### Option A — Render

1. **New → Web Service** → connect GitHub repo
2. Configure:
   ```
   Name:        banditlearn-backend
   Branch:      main
   Root Dir:    backend
   Runtime:     Node
   Build Cmd:   npm install
   Start Cmd:   node server.js
   ```
3. Add all environment variables:
   ```
   PORT                = 3001
   DB_HOST             = <Railway MySQL MYSQL_HOST>
   DB_PORT             = <Railway MySQL MYSQL_PORT>
   DB_USER             = <Railway MySQL MYSQL_USER>
   DB_PASSWORD         = <Railway MySQL MYSQL_PASSWORD>
   DB_NAME             = <Railway MySQL MYSQL_DATABASE>
   JWT_SECRET          = <generate a strong random string>
   PYTHON_SERVICE_URL  = <URL from Step 3>
   ```
4. Click **Deploy**
5. Copy the service URL e.g. `https://banditlearn-backend.onrender.com`
6. Verify: open `https://banditlearn-backend.onrender.com/api/health` → `{"status":"ok"}`

### Option B — Railway

1. **New service → GitHub repo → select repo**
2. Set root directory to `backend`
3. Start command: `node server.js`
4. Add the same environment variables as above under the **Variables** tab

---

## Step 5 — Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo
2. Configure:
   ```
   Framework Preset:  Vite
   Root Directory:    frontend
   Build Command:     npm run build
   Output Directory:  dist
   ```
3. Add environment variable:
   ```
   VITE_API_URL = <backend URL from Step 4>/api
   ```
   Example: `https://banditlearn-backend.onrender.com/api`
4. Click **Deploy**
5. Vercel gives you a live URL e.g. `https://banditlearn.vercel.app`

---

## Step 6 — Enable CORS for the Deployed Frontend

The backend currently allows all origins (`*`). Before going live, restrict it to your Vercel URL.

Open `backend/server.js` and update the CORS config:

```js
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}))
```

Add to backend environment variables:
```
FRONTEND_URL = https://banditlearn.vercel.app
```

Redeploy the backend after this change.

---

## Step 7 — End-to-End Smoke Test

After all four services are live, test the full flow:

- [ ] Open the Vercel URL → Login page loads
- [ ] Register a new account → Cold Start page appears
- [ ] Submit ratings → Dashboard loads with a real recommendation
- [ ] Go to Recommended Problem → mode badge and reason text visible
- [ ] Mark as Solved → confirmation appears
- [ ] Next Recommendation → new problem loads
- [ ] Check Practice History → attempt recorded
- [ ] Check Topic Mastery → mastery values updated
- [ ] Check Analytics → mode distribution and heatmap populated

---

## Environment Variables — Full Reference

### Backend (`backend/.env` or Render/Railway Variables)

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `DB_HOST` | Railway MySQL host |
| `DB_PORT` | Railway MySQL port |
| `DB_USER` | Railway MySQL user |
| `DB_PASSWORD` | Railway MySQL password |
| `DB_NAME` | Railway MySQL database name |
| `JWT_SECRET` | Long random string (min 32 chars) |
| `PYTHON_SERVICE_URL` | Render/Railway Python service URL |
| `FRONTEND_URL` | Vercel frontend URL (for CORS) |

### Frontend (`frontend/.env.production` or Vercel Variables)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-backend-url>/api` |

### Python Microservice (no .env needed — stateless except file storage)

No environment variables required. If using Railway volume, ensure it is mounted at `/app/data/users`.

---

## Common Issues

**Frontend shows blank / API calls fail**
→ Check `VITE_API_URL` is set correctly in Vercel and does not have a trailing slash.

**Backend cannot connect to MySQL**
→ Double-check all four DB variables. Railway MySQL uses a non-standard port — use the exact values from the Railway dashboard.

**Python microservice returns 500 on `/recommend`**
→ Check the service logs. Most likely the `data/users/` directory doesn't exist — add a volume or create the directory in the build step.

**CORS error in browser**
→ Set `FRONTEND_URL` in backend env vars and redeploy the backend.

**Render free tier spins down after inactivity**
→ Both the backend and Python service will cold-start after 15 minutes of inactivity on the free tier. First request after inactivity takes ~30 seconds. Upgrade to a paid tier or use Railway to avoid this.

---

## Local vs Deployed URLs — Summary

| Service | Local | Deployed |
|---|---|---|
| Frontend | `http://localhost:5173` | `https://<app>.vercel.app` |
| Backend | `http://localhost:3001` | `https://<app>.onrender.com` |
| Python service | `http://localhost:8000` | `https://<app>.onrender.com` |
| MySQL | `localhost:3306` | Railway internal host |
