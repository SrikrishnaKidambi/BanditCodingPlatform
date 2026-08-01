import json
import os
import random
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from collections import defaultdict

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3001")
BACKEND_INTERNAL_TOKEN = os.environ.get("BACKEND_INTERNAL_TOKEN", "")


def _internal_headers():
    headers = {"Accept": "application/json"}
    if BACKEND_INTERNAL_TOKEN:
        headers["x-internal-token"] = BACKEND_INTERNAL_TOKEN
    return headers


def _get_backend_json(path):
    try:
        url = f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"
        req = urllib.request.Request(url, headers=_internal_headers())
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                return None
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError):
        return None


class BaseProblemRepository(ABC):
    """
    Abstract interface for problem repositories.
    To integrate an external platform (LeetCode API, HackerRank, etc.),
    subclass this and implement the three abstract methods.
    """

    @abstractmethod
    def get_problems_for_arm(self, arm):
        """Return all problems for a given (topic, difficulty) arm."""

    @abstractmethod
    def get_problem(self, arm, seen_ids=None):
        """
        Return one problem for the arm.
        Should prefer problems not in seen_ids; fall back to full pool if all seen.
        """

    @abstractmethod
    def get_arm_counts(self):
        """Return {arm: problem_count} for every arm in the repository."""

    def get_all_arms(self):
        return sorted(self.get_arm_counts().keys())


class JSONProblemRepository(BaseProblemRepository):

    def __init__(self, data_path=None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, "data", "problems.json")

        self.problems = self._load_problems_from_backend()
        if self.problems is None:
            raise RuntimeError("Failed to load problems from backend DB.")

    def _normalise_problem_row(self, row):
        if not isinstance(row, dict):
            return None
        tags = row.get("tags")
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except (TypeError, ValueError):
                tags = []
        elif tags is None:
            tags = []

        return {
            "problem_id": row.get("problem_id") or row.get("id"),
            "title": row.get("title", ""),
            "topic": row.get("topic", ""),
            "difficulty": row.get("difficulty", ""),
            "tags": tags,
            "platform": row.get("platform", ""),
            "url": row.get("url", ""),
            "estimated_solving_time": row.get("estimated_solving_time", 20),
        }

    def _load_problems_from_backend(self):
        data = _get_backend_json('/api/internal/problems')
        if not data:
            return None
        return [
            normalized
            for normalized in (
                self._normalise_problem_row(row) for row in data
            )
            if normalized is not None
        ]

    def get_problems_for_arm(self, arm):
        topic, difficulty = arm
        return [
            p for p in self.problems
            if p["topic"] == topic and p["difficulty"] == difficulty
        ]

    def get_problem(self, arm, seen_ids=None):
        candidates = self.get_problems_for_arm(arm)

        if not candidates:
            return None

        if seen_ids:
            unseen = [p for p in candidates if p["problem_id"] not in seen_ids]
            if unseen:
                return random.choice(unseen)

        return random.choice(candidates)

    def get_arm_counts(self):
        counts = defaultdict(int)
        for p in self.problems:
            counts[(p["topic"], p["difficulty"])] += 1
        return dict(counts)
