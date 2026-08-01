import numpy as np


class SimulatedUser:
    def __init__(self):

        self.skills = {
            ("Arrays", "Easy"): 0.9,
            ("Arrays", "Medium"): 0.7,
            ("Arrays", "Hard"): 0.35,

            ("BinarySearch", "Easy"): 0.85,
            ("BinarySearch", "Medium"): 0.6,
            ("BinarySearch", "Hard"): 0.25,

            ("Trees", "Easy"): 0.6,
            ("Trees", "Medium"): 0.4,
            ("Trees", "Hard"): 0.15,

            ("Graphs", "Easy"): 0.4,
            ("Graphs", "Medium"): 0.2,
            ("Graphs", "Hard"): 0.1,

            ("DP", "Easy"): 0.3,
            ("DP", "Medium"): 0.1,
            ("DP", "Hard"): 0.05
        }

    # for now it is binomial later it will be based on the user actual attempt
    def attempt_problem(self, arm):
        probability = self.skills[arm]

        return np.random.binomial(1, probability)