import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from bandit import Bandit
from coldstart import ColdStartAssessment
from competency import CompetencyProfile
from repository import JSONProblemRepository
from session import UserSession

app = FastAPI(title="Bandit Recommendation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Bandit cache: user_id → Bandit instance
_bandits: dict = {}
_seen_ids: dict = {}

repo = JSONProblemRepository()


def _get_or_load_bandit(user_id: str) -> Bandit:
    if user_id not in _bandits:
        session = UserSession(user_id)
        state, history = session.load()
        _bandits[user_id] = Bandit(initial_priors=state, recommendation_history=history)
        _seen_ids[user_id] = set()
    return _bandits[user_id]


class AssessRequest(BaseModel):
    user_id: str
    ratings: dict  # {"Arrays_Easy": 3, "Arrays_Medium": 2, ...}


class SubmitRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: str
    solved: bool


class ResetArmRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: str
    rating: int  # 1–4


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/assess")
def assess(req: AssessRequest):
    cold_start = ColdStartAssessment()
    responses = {}
    for key, rating in req.ratings.items():
        topic, difficulty = key.rsplit("_", 1)
        responses[(topic, difficulty)] = int(rating)
    raw_priors = cold_start.initialize_priors(responses)
    initial_priors = cold_start.propagate_topic_hierarchy(raw_priors)
    bandit = Bandit(initial_priors=initial_priors)
    _bandits[req.user_id] = bandit
    _seen_ids[req.user_id] = set()
    session = UserSession(req.user_id)
    session.save(bandit.banditState, bandit.recommendation_history)
    return {"status": "ok"}


def _reason(arm, mode, bandit_state):
    topic, difficulty = arm
    s = bandit_state[arm]
    pct = int(round(s["alpha"] / (s["alpha"] + s["beta"]) * 100))
    if mode == "learning":
        return (f"Your {topic} {difficulty} mastery is at {pct}% — "
                f"right in the challenge zone for maximum growth.")
    if mode == "weak":
        return (f"{topic} is one of your weakest areas at {pct}% mastery — "
                f"focused practice here will accelerate improvement.")
    return (f"You have mastered {topic} {difficulty} at {pct}% — "
            f"revisiting it now prevents forgetting.")


@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    bandit = _get_or_load_bandit(user_id)
    seen = _seen_ids.get(user_id, set())
    for _ in range(20):
        arm, mode = bandit.select_arm()
        problem = repo.get_problem(arm, seen_ids=seen)
        if problem is not None:
            seen.add(problem["problem_id"])
            _seen_ids[user_id] = seen
            return {
                "arm":    {"topic": arm[0], "difficulty": arm[1]},
                "mode":   mode,
                "reason": _reason(arm, mode, bandit.banditState),
                "problem": problem,
            }
    raise HTTPException(status_code=404, detail="No unseen problem available")


@app.post("/submit")
def submit(req: SubmitRequest):
    bandit = _get_or_load_bandit(req.user_id)
    arm = (req.topic, req.difficulty)
    if arm not in bandit.banditState:
        raise HTTPException(status_code=400, detail=f"Unknown arm: {arm}")
    bandit.update(arm, reward=1 if req.solved else 0)
    session = UserSession(req.user_id)
    session.save(bandit.banditState, bandit.recommendation_history)
    return {"status": "ok"}


@app.get("/mastery/{user_id}")
def mastery(user_id: str):
    bandit = _get_or_load_bandit(user_id)
    profile = CompetencyProfile(bandit.banditState).get_profile()
    return [
        {
            "topic": arm[0],
            "difficulty": arm[1],
            "mastery": data["mean"],
            "tier": data["tier"],
            "confidence": data["confidence"],
            "ready_for_progression": data["ready_for_progression"],
        }
        for arm, data in profile.items()
    ]


def _diversity_score(arm_counts: dict) -> float:
    """
    Shannon entropy of arm selection counts normalised to 0–100.
    100 = all 10 arms recommended equally (maximum diversity).
    0   = only one arm ever recommended.
    """
    import math
    total = sum(arm_counts.values())
    if total == 0:
        return 0.0
    entropy = -sum(
        (c / total) * math.log2(c / total)
        for c in arm_counts.values() if c > 0
    )
    max_entropy = math.log2(len(arm_counts)) if len(arm_counts) > 1 else 1
    return round(entropy / max_entropy * 100, 1)


@app.get("/stats/{user_id}")
def stats(user_id: str):
    bandit = _get_or_load_bandit(user_id)
    profile = CompetencyProfile(bandit.banditState)
    arm_counts: dict = {}
    for arm in bandit.recommendation_history:
        key = f"{arm[0]}-{arm[1]}"
        arm_counts[key] = arm_counts.get(key, 0) + 1
    return {
        "overall_mastery":  round(profile.overall_mastery(), 3),
        "diversity_score":  _diversity_score(arm_counts),
        "arm_counts": [
            {"arm": k, "count": v}
            for k, v in sorted(arm_counts.items(), key=lambda x: -x[1])
        ],
        "weakest":   [f"{a[0]}-{a[1]}" for a in profile.weakest_arms(3)],
        "strongest": [f"{a[0]}-{a[1]}" for a in profile.strongest_arms(3)],
    }


@app.post("/reset/{user_id}")
def reset_user(user_id: str):
    _bandits.pop(user_id, None)
    _seen_ids.pop(user_id, None)
    session = UserSession(user_id)
    session.delete()
    return {"status": "ok"}


@app.post("/reset-arm")
def reset_arm(req: ResetArmRequest):
    bandit = _get_or_load_bandit(req.user_id)
    arm = (req.topic, req.difficulty)
    if arm not in bandit.banditState:
        raise HTTPException(status_code=400, detail=f"Unknown arm: {arm}")
    cold_start = ColdStartAssessment()
    level = cold_start.levels[req.rating]
    bandit.banditState[arm] = {"alpha": level["alpha"], "beta": level["beta"]}
    session = UserSession(req.user_id)
    session.save(bandit.banditState, bandit.recommendation_history)
    return {"status": "ok"}


@app.post("/admin/reload-topics")
def reload_topics():
    """Reload topics from data/topics.json and update in-memory modules.

    This endpoint lets the backend trigger a hot-reload so the running
    recommendation service picks up new topics without a full restart.
    """
    try:
        from topic_registry import load_topics
        new_topics = load_topics()

        # Update modules that cache topics at import-time
        try:
            import coldstart
            coldstart.TOPICS = new_topics
        except Exception:
            pass
        try:
            import competency
            competency.TOPICS = new_topics
        except Exception:
            pass

        # Update existing Bandit instances so they include new arms
        for user_id, bandit in list(_bandits.items()):
            new_arms = [(t, d) for t in new_topics for d in ["Easy", "Medium", "Hard"]]
            bandit.arms = new_arms
            # Ensure banditState contains entries for new arms with a neutral prior
            for arm in new_arms:
                if arm not in bandit.banditState:
                    bandit.banditState[arm] = {"alpha": 1, "beta": 1}

        return {"status": "ok", "topics": new_topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
