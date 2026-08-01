import numpy as np
import random
from competency import PROGRESSION_THRESHOLD
from topic_registry import load_topics


class Bandit:
    def __init__(self, initial_priors=None, recency_window=5, recency_penalty=0.5, diversity_pool=3,
                 recommendation_history=None):
        topics = load_topics()
        self.arms = [
            (topic, difficulty)
            for topic in topics
            for difficulty in ["Easy", "Medium", "Hard"]
        ]

        # If cold-start priors are provided, seed each arm with them.
        # Arms not covered by priors fall back to the uniform prior (alpha=1, beta=1).
        self.banditState = {
            arm: (initial_priors[arm] if initial_priors and arm in initial_priors
                  else {"alpha": 1, "beta": 1})
            for arm in self.arms
        }

        # recency_window: how many past recommendations to penalize
        # recency_penalty: max penalty factor applied to the most recent arm (0–1)
        # diversity_pool: number of candidates to randomly select from in weak/revision modes
        self.recency_window = recency_window
        self.recency_penalty = recency_penalty
        self.diversity_pool = diversity_pool
        self.recommendation_history = list(recommendation_history) if recommendation_history else []

    def _progression_bonus(self, arm):
        """
        Returns a score bonus for a higher-difficulty arm whose predecessor is mastered.
        Scales linearly from 0 at the threshold to 0.25 at full mastery, nudging
        the learning zone selection toward advancing difficulty without hard-overriding
        Thompson Sampling.
        """
        topic, difficulty = arm
        if difficulty == "Easy":
            return 0.0

        predecessor_difficulty = "Easy" if difficulty == "Medium" else "Medium"
        predecessor_arm = (topic, predecessor_difficulty)
        if predecessor_arm not in self.banditState:
            return 0.0

        s = self.banditState[predecessor_arm]
        predecessor_mean = s["alpha"] / (s["alpha"] + s["beta"])
        if predecessor_mean < PROGRESSION_THRESHOLD:
            return 0.0
        return 0.25 * (predecessor_mean - PROGRESSION_THRESHOLD) / (1.0 - PROGRESSION_THRESHOLD)

    def _apply_recency_penalty(self, sampled_mastery):
        """
        Linearly decays the sampled mastery of recently recommended arms.
        Most recent arm gets full penalty; oldest arm in window gets minimal penalty.
        """
        penalized = dict(sampled_mastery)
        recent = self.recommendation_history[-self.recency_window:]
        for step_back, arm in enumerate(reversed(recent)):
            # step_back=0 is the most recent; penalty decays as we go further back
            decay_factor = 1 - self.recency_penalty * (1 - step_back / self.recency_window)
            penalized[arm] = penalized[arm] * decay_factor
        return penalized

    def select_arm(self):
        sampled_mastery = {
            arm: np.random.beta(
                self.banditState[arm]["alpha"],
                self.banditState[arm]["beta"]
            )
            for arm in self.arms
        }

        penalized_mastery = self._apply_recency_penalty(sampled_mastery)

        choice = np.random.random()

        # 70% learning zone: closest to 0.7 mastery (sweet spot for challenge).
        # Higher-difficulty arms whose predecessor counterpart is mastered receive a
        # progression bonus to bias selection toward advancing difficulty.
        if choice < 0.7:
            scores = {
                arm: -abs(m - 0.7) + self._progression_bonus(arm)
                for arm, m in penalized_mastery.items()
            }
            arm = max(scores, key=scores.get)
            mode = "learning"

        # 20% weak topic reinforcement: pick from bottom pool to ensure diversity
        elif choice < 0.9:
            k = min(self.diversity_pool, len(self.arms))
            sorted_arms = sorted(penalized_mastery, key=penalized_mastery.get)
            arm = random.choice(sorted_arms[:k])
            mode = "weak"

        # 10% revision / spaced repetition: pick from top pool to ensure diversity
        else:
            k = min(self.diversity_pool, len(self.arms))
            sorted_arms = sorted(penalized_mastery, key=penalized_mastery.get, reverse=True)
            arm = random.choice(sorted_arms[:k])
            mode = "revision"

        self.recommendation_history.append(arm)
        return arm, mode

    def update(self, arm, reward):
        self.banditState[arm]["alpha"] += reward
        self.banditState[arm]["beta"] += (1 - reward)

    def get_posterior_means(self):
        return {
            arm: self.banditState[arm]["alpha"] / (
                self.banditState[arm]["alpha"] + self.banditState[arm]["beta"]
            )
            for arm in self.arms
        }