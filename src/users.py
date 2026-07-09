import numpy as np


class SimulatedUser:
    def __init__(self):

        self.skills = {
            ("Arrays", "Easy"): 0.9,
            ("Arrays", "Medium"): 0.7,

            ("BinarySearch", "Easy"): 0.85,
            ("BinarySearch", "Medium"): 0.6,

            ("Trees", "Easy"): 0.6,
            ("Trees", "Medium"): 0.4,

            ("Graphs", "Easy"): 0.4,
            ("Graphs", "Medium"): 0.2,

            ("DP", "Easy"): 0.3,
            ("DP", "Medium"): 0.1
        }

    # for now it is binomial later it will be based on the user actual attempt
    def attempt_problem(self, arm):
        probability = self.skills[arm]

        return np.random.binomial(1, probability)