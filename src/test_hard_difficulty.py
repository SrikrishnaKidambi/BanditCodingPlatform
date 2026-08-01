import unittest

from bandit import Bandit
from coldstart import ColdStartAssessment
from topic_registry import load_topics


class HardDifficultyTests(unittest.TestCase):
    def test_bandit_tracks_hard_arms(self):
        bandit = Bandit()
        self.assertIn(("Arrays", "Hard"), bandit.arms)
        expected_topics = len(load_topics())
        self.assertEqual(len([arm for arm in bandit.arms if arm[1] == "Hard"]), expected_topics)

    def test_progression_bonus_uses_predecessor_for_hard_arms(self):
        bandit = Bandit(initial_priors={
            ("Arrays", "Medium"): {"alpha": 8, "beta": 2},
        })
        bonus = bandit._progression_bonus(("Arrays", "Hard"))
        self.assertGreater(bonus, 0)

    def test_coldstart_includes_hard_difficulties(self):
        assessment = ColdStartAssessment()
        self.assertEqual(assessment.difficulties, ["Easy", "Medium", "Hard"])
        expected_topics = len(load_topics())
        self.assertEqual(len(assessment.get_arms()), expected_topics * len(assessment.difficulties))


if __name__ == "__main__":
    unittest.main()
