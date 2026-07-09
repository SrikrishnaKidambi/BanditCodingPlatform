import json
import os
import random
from abc import ABC, abstractmethod
from collections import defaultdict


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

        with open(data_path, "r") as f:
            self.problems = json.load(f)

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
