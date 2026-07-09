# BanditLearn — Features Guide

A quick walkthrough of every feature in the platform and how to use it.

---

## Getting Started

### Register
- Go to `http://localhost:5173`
- Click **Register** tab on the login screen
- Enter your name, email, and password
- On success you are taken to the **Cold Start Assessment**

### Login
- Enter your email and password
- Returning users go straight to the **Dashboard** — cold start is skipped
- Wrong credentials show an inline error message

### Logout
- Go to **Profile** (bottom of the sidebar)
- Click **Sign out** at the top right of the page

---

## Cold Start Assessment

**When:** First time only, right after registration.

**What it does:** Lets you rate your comfort level for each topic and difficulty before the engine has seen any of your attempts. This gives the recommendation engine a personalised starting point instead of treating every user identically.

**How to use:**
- For each of the 10 combinations (5 topics × Easy / Medium) select one of:
  - **Never tried** — you have not seen this topic
  - **Beginner** — you have tried it but struggle
  - **Intermediate** — you can solve some problems with effort
  - **Advanced** — you solve these comfortably
- Click **Start Learning** when done

**What happens next:** The engine initialises your Bayesian priors from your ratings and you land on the Dashboard.

---

## Dashboard

**URL:** `/dashboard`

**What you see:**
- Greeting with your first name
- **4 stat cards** — Total Solved, Current Streak, Active Topics, Success Rate — all pulled live from your submission history
- **Today's Recommendation** — the problem the engine selected for you right now, with its topic, difficulty, platform, and the reason it was chosen
- **Recent Activity** — your last 3 attempts with outcome badges

**Actions:**
- Click **Practice Now →** to go to the full Recommended Problem page
- Click **View full history →** to see all your attempts

---

## Recommended Problem

**URL:** `/recommended`

**What you see:**
- The problem selected by Educational Thompson Sampling
- **Mode badge** — tells you *why* this problem was picked:
  - `LEARNING` — in your challenge zone (~70% success rate expected)
  - `WEAK` — a topic the engine thinks needs reinforcement
  - `REVISION` — a topic you have already mastered, shown to prevent forgetting
- Problem title, topic, difficulty, platform, and a direct link

**How to use:**
1. Click **Open on [Platform] ↗** to open the problem in a new tab
2. Attempt the problem
3. Come back and click either:
   - **✓ Mark as Solved** — rewards the arm, raises mastery estimate
   - **✗ Mark as Failed** — penalises the arm, lowers mastery estimate
4. A confirmation message appears
5. Click **Next Recommendation →** to load the next problem

**What happens in the background:** Every mark triggers a Bayesian posterior update (alpha/beta) for that arm and saves your state to disk. The next recommendation reflects your updated mastery.

---

## Practice History

**URL:** `/history`

**What you see:**
- Every problem you have attempted, newest first (up to 100)
- Each row shows: Date · Problem title · Topic · Difficulty · Mode · Outcome

**Filtering:**
- Use the search box (top right) to filter by problem title or topic name
- Filtering is instant, client-side

---

## Topic Mastery

**URL:** `/mastery`

**What you see:**
- One card per topic (Arrays, BinarySearch, Trees, Graphs, DP)
- Each card shows a **mastery bar** for Easy and Medium separately
- A badge shows the topic's overall strength level:
  - **Strong** (≥ 70% average) — green
  - **Developing** (40–70%) — yellow
  - **Weak** (< 40%) — red

**How mastery is calculated:** Each bar is the Bayesian posterior mean of the Beta distribution for that arm — `alpha / (alpha + beta)`. It updates every time you mark a problem solved or failed.

**Progression indicator:** When an Easy arm reaches ≥ 75% mastery, the engine automatically starts favouring the corresponding Medium arm in the learning zone. You will see Medium problems for that topic appear more often.

---

## Analytics

**URL:** `/analytics`

**What you see:**

**Recommendation Mode Distribution**
- Bar chart showing what percentage of your recommendations were Learning / Weak / Revision
- Target ratios: 70% learning · 20% weak · 10% revision
- Your actual percentages are shown alongside the targets

**Arm Selection Frequency**
- Horizontal bar chart showing how often each `(Topic, Difficulty)` arm has been recommended to you
- Arms recommended more often have longer bars

**Key Insights**
- Your current learning zone percentage
- Your weakest topic right now
- Your strongest topic right now

**Note:** This page shows no data until you have attempted at least one problem.

---

## Profile

**URL:** `/profile`

**What you see:**
- Your avatar (initials), name, email, and join date
- 4 stat cards — Problems Solved, Success Rate, Current Streak, Topics Studied
- Account details including the algorithm powering your recommendations

**Streak calculation:** A streak counts consecutive calendar days on which you attempted at least one problem. Missing a day resets it to 0.

---

## Dark Mode

- Toggle between light and dark mode using the **☀ Light / 🌙 Dark** button
- On the Login and Cold Start pages it appears in the top-right corner
- On all other pages it is in the **sidebar**, below the navigation links
- Your preference is not yet persisted across sessions (resets on refresh)

---

## Navigation Sidebar

Available on all pages after login:

| Link | Page |
|---|---|
| Dashboard | Overview + today's recommendation |
| Recommended | Full problem recommendation flow |
| History | All past attempts |
| Mastery | Per-topic Bayesian mastery bars |
| Analytics | Mode distribution + arm frequency |
| Profile | Stats + account details + sign out |

---

## How the Recommendation Engine Works (in plain terms)

The engine treats each `(Topic, Difficulty)` pair as an **arm** of a multi-armed bandit. It maintains a probability estimate (Beta distribution) for each arm representing how likely you are to solve a problem from it.

Every recommendation uses **Thompson Sampling** — it samples from those distributions and picks a problem based on three goals:

- **70% of the time** — picks a problem where you are *challenged but not overwhelmed* (mastery near 70%)
- **20% of the time** — picks a topic where your mastery is *weakest* to close skill gaps
- **10% of the time** — picks a topic you *already know well* to prevent forgetting (spaced repetition)

Every solved/failed mark shifts those Beta distributions, so the engine continuously adapts to you.

---

## To Be Implemented

### Phase 6 — Analytics
Build richer explainable dashboards: learning trajectory over time, competency heatmap across all arms, recommendation diversity score, revision statistics, and a "why was this recommended?" explanation shown inline on each problem card.

### Phase 7 — Research Enhancements
Extend the core engine with forgetting curves (mastery decays if a topic is untouched for too long), contextual Thompson Sampling (factor in time of day, session length, hint usage), continuous rewards (partial credit instead of binary solved/failed), and confidence-aware difficulty adaptation.

### Phase 8 — Evaluation
Benchmark Educational Thompson Sampling against Random, Standard Thompson Sampling, Epsilon-Greedy, and UCB baselines using the simulation framework — measure learning efficiency, recommendation diversity, competency improvement rate, and topic coverage; document all experiments.

### Phase 9 — Deployment
Deploy the full stack: React frontend to Vercel, Node.js backend to Render or Railway, MySQL to Neon PostgreSQL or Railway MySQL, Python microservice as a separate service — plus architecture diagrams, a demo video, and full GitHub documentation.
