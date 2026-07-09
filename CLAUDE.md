# Adaptive Coding Practice Platform

## Project Vision

This project aims to build an intelligent coding practice platform that adapts to each learner using **Thompson Sampling** as its core recommendation engine.

Unlike traditional coding platforms that recommend problems based on static sheets or fixed difficulty progression, this platform should continuously estimate a learner's competency across different DSA topics and recommend the next best problem to maximize long-term learning.

The recommendation engine is the primary contribution of this project. The frontend and backend exist to expose and support this engine.

---

# Core Algorithm

The recommendation engine is based on **Bayesian Multi-Armed Bandits using Thompson Sampling**.

Each arm represents a `(Topic, Difficulty)` pair.

Example:

* Arrays - Easy
* Arrays - Medium
* Binary Search - Easy
* Binary Search - Medium
* Trees - Easy
* Trees - Medium
* Graphs - Easy
* Graphs - Medium
* Dynamic Programming - Easy
* Dynamic Programming - Medium

Initially every arm starts with:

* alpha = 1
* beta = 1

The posterior for every arm follows a Beta distribution.

Thompson Sampling must remain the core Bayesian learning mechanism throughout the project.

Do not replace Thompson Sampling with another recommendation algorithm unless explicitly requested.

---

# Educational Thompson Sampling

This project intentionally modifies the objective of traditional Thompson Sampling.

Traditional Thompson Sampling maximizes immediate reward by repeatedly recommending arms with the highest probability of success.

That behaviour is undesirable for education because it repeatedly recommends problems the learner already knows.

Instead, this project optimizes for **learning**.

The recommendation policy should balance three educational objectives.

## 1. Learning Zone (approximately 70%)

Recommend problems that are slightly challenging.

These are problems where the learner has a moderate probability of success.

This encourages maximum learning.

---

## 2. Weak Topic Reinforcement (approximately 20%)

Recommend weaker topics so the learner gradually improves.

Avoid repeatedly recommending the same weak topic.

Maintain diversity among weak topics.

---

## 3. Revision / Spaced Repetition (approximately 10%)

Occasionally recommend already-mastered topics.

This reinforces previously learned concepts and reduces forgetting.

---

# Recommendation Constraints

The recommendation engine should:

* continue using Thompson Sampling internally
* estimate competency for every arm
* balance challenge, remediation and revision
* avoid repeatedly recommending the same arm
* maintain recommendation diversity
* support future forgetting models
* remain modular and extensible

Whenever recommendation logic is modified, preserve these educational objectives.

---

# Tech Stack

Frontend

* React
* Tailwind CSS

Backend

* Node.js
* Express

Recommendation Engine

* Python

Database

* MySQL

Visualization

* matplotlib

Deployment

* Frontend → Vercel
* Backend → Render/Railway
* Database → Neon PostgreSQL or Railway MySQL (final decision later)
* Recommendation Service → Python microservice

---

# Development Philosophy

Build the intelligence before the platform.

The order of importance is:

1. Recommendation Engine
2. Problem Recommendation API
3. User Competency Tracking
4. Backend
5. Frontend
6. Analytics
7. Deployment

Every architectural decision should prioritize the recommendation engine.

---

# Development Phases

## Phase 0 — Project Planning ✅

Objectives

* finalize project vision
* define educational objective
* finalize tech stack
* design overall architecture
* define arm representation
* define initial reward model

Deliverables

* architecture
* roadmap
* folder structure

---

## Phase 1 — Recommendation Engine

Objectives

Implement and validate Educational Thompson Sampling.

Tasks

* implement Thompson Sampling
* Bayesian posterior updates
* simulated users
* recommendation policy
* recommendation diversity
* recency penalty
* recommendation history
* competency estimation
* simulation framework
* experimentation
* visualization

Validation

The engine should correctly estimate competency while producing educationally meaningful recommendations.

---

## Phase 2 — Problem Repository

Objectives

Create a structured coding problem database.

Each problem should contain:

* problem id
* title
* topic
* difficulty
* tags
* platform
* URL
* estimated solving time

Initially use a manually curated dataset.

Design the repository so APIs from external platforms can be integrated later.

---

## Phase 3 — Adaptive Recommendation Engine

Objectives

Move from simulation to real users.

Tasks

* cold-start assessment
* competency initialization
* mastery estimation
* recommendation history
* adaptive difficulty progression
* user-specific Bayesian priors

---

## Phase 4 — Backend

Develop backend services.

Responsibilities

* authentication
* user management
* recommendation APIs
* submission tracking
* competency storage
* problem retrieval
* communication with Python recommendation engine

---

## Phase 5 — Frontend

Develop the web application.

Pages

* Login
* Dashboard
* Recommended Problem
* Practice History
* Topic Mastery
* Analytics
* Profile

The frontend should remain independent of recommendation logic.

---

## Phase 6 — Analytics

Build explainable dashboards.

Examples

* topic mastery
* competency heatmap
* recommendation history
* learning trajectory
* weakest topics
* strongest topics
* recommendation diversity
* revision statistics

The user should understand why a recommendation was made.

---

## Phase 7 — Research Enhancements

Potential research contributions include:

* Contextual Thompson Sampling
* Forgetting curves
* Spaced repetition
* Continuous rewards
* Time-aware learning
* Hint-aware rewards
* Dynamic difficulty adaptation
* Confidence estimation
* Regret analysis
* Offline evaluation

These should extend—not replace—the core Thompson Sampling framework.

---

## Phase 8 — Evaluation

Compare against:

* Random recommendation
* Standard Thompson Sampling
* Epsilon-Greedy
* Upper Confidence Bound (UCB)

Evaluate:

* learning efficiency
* recommendation diversity
* competency improvement
* topic coverage
* user engagement
* convergence behaviour

Document all experiments.

---

## Phase 9 — Deployment

Deploy the complete platform.

Tasks

* frontend deployment
* backend deployment
* database deployment
* recommendation service deployment
* documentation
* architecture diagrams
* demo video
* GitHub documentation

---

# Coding Guidelines

* Write modular code.
* Prefer composition over tightly coupled classes.
* Keep recommendation logic independent of UI.
* Separate simulation code from production code.
* Document important algorithms.
* Explain reasoning when making architectural changes.
* Preserve Thompson Sampling as the Bayesian core.
* Optimize for maintainability and research quality rather than quick hacks.

Always think of this project as an adaptive educational recommendation system first, and a coding platform second.
