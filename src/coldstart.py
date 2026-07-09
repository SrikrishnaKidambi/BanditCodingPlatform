TOPICS = ["Arrays", "BinarySearch", "Trees", "Graphs", "DP"]
DIFFICULTIES = ["Easy", "Medium"]

# Each level maps to an (alpha, beta) prior.
# Prior mean = alpha / (alpha + beta)
# Total observations kept low (~8-10) so the prior is informative
# but the engine still updates quickly from real attempts.
LEVELS = {
    1: {"label": "Never tried",  "alpha": 1, "beta": 9},   # mean = 0.10
    2: {"label": "Beginner",     "alpha": 2, "beta": 6},   # mean = 0.25
    3: {"label": "Intermediate", "alpha": 4, "beta": 4},   # mean = 0.50
    4: {"label": "Advanced",     "alpha": 8, "beta": 2},   # mean = 0.80
}


class ColdStartAssessment:
    def __init__(self):
        self.topics = TOPICS
        self.difficulties = DIFFICULTIES
        self.levels = LEVELS

    def get_arms(self):
        return [(topic, diff) for topic in self.topics for diff in self.difficulties]

    def initialize_priors(self, responses):
        """
        responses: {arm: level (1–4)}
        Returns: {arm: {"alpha": ..., "beta": ...}}
        Arms missing from responses default to the uniform prior (alpha=1, beta=1).
        """
        priors = {}
        for arm, level in responses.items():
            config = self.levels[level]
            priors[arm] = {"alpha": config["alpha"], "beta": config["beta"]}
        return priors

    def run_interactive(self):
        """
        Interactive CLI cold-start flow.
        Returns initial priors dict ready to pass into Bandit(initial_priors=...).
        """
        print("=" * 52)
        print("  COLD START ASSESSMENT")
        print("=" * 52)
        print("\nRate your comfort level for each topic/difficulty.\n")

        for k, v in self.levels.items():
            mean = v["alpha"] / (v["alpha"] + v["beta"])
            print(f"  {k}  {v['label']:<15}  (prior success rate: {mean:.0%})")

        print()

        responses = {}
        for topic in self.topics:
            for difficulty in self.difficulties:
                arm = (topic, difficulty)
                while True:
                    try:
                        rating = int(input(f"  {topic} - {difficulty}: "))
                        if 1 <= rating <= 4:
                            responses[arm] = rating
                            break
                        print("    Enter a number between 1 and 4.")
                    except ValueError:
                        print("    Enter a number between 1 and 4.")

        priors = self.initialize_priors(responses)
        self._print_priors(priors)
        return priors

    def propagate_topic_hierarchy(self, priors):
        """
        Adjusts Medium priors using Easy mastery for the same topic.

        Rationale: if a user rates Arrays-Easy as Advanced but Arrays-Medium as
        Beginner, the Easy mastery is informative — they are likely more ready for
        Medium than a pure Beginner. We blend 25% Easy signal into the Medium prior.
        Only applies when Easy mean > Medium mean (never penalises a higher Medium rating).
        """
        EASY_WEIGHT = 0.25
        adjusted = dict(priors)

        for topic in self.topics:
            easy_arm = (topic, "Easy")
            medium_arm = (topic, "Medium")

            if easy_arm not in priors or medium_arm not in priors:
                continue

            easy_state  = priors[easy_arm]
            medium_state = priors[medium_arm]

            easy_mean   = easy_state["alpha"]   / (easy_state["alpha"]   + easy_state["beta"])
            medium_mean = medium_state["alpha"]  / (medium_state["alpha"] + medium_state["beta"])

            # Only propagate upward — Easy cannot pull Medium below its rated value
            if easy_mean <= medium_mean:
                continue

            blended_mean = EASY_WEIGHT * easy_mean + (1 - EASY_WEIGHT) * medium_mean
            total_obs    = medium_state["alpha"] + medium_state["beta"]

            new_alpha = max(1, round(blended_mean * total_obs))
            new_beta  = max(1, total_obs - new_alpha)

            adjusted[medium_arm] = {"alpha": new_alpha, "beta": new_beta}

        return adjusted

    def simulate_responses(self, skill_map):
        """
        Converts a {arm: true_skill (0–1)} dict into ratings and returns priors.
        Used in simulation/testing so we can skip interactive input.
        """
        responses = {}
        for arm, skill in skill_map.items():
            if skill >= 0.7:
                responses[arm] = 4
            elif skill >= 0.5:
                responses[arm] = 3
            elif skill >= 0.25:
                responses[arm] = 2
            else:
                responses[arm] = 1
        return self.initialize_priors(responses)

    def _print_priors(self, priors):
        print("\n" + "=" * 52)
        print("  INITIALIZED PRIORS")
        print("=" * 52)
        for arm, state in priors.items():
            mean = state["alpha"] / (state["alpha"] + state["beta"])
            print(
                f"  {arm[0]}-{arm[1]:<12}"
                f"  alpha={state['alpha']}, beta={state['beta']}"
                f"  ->  prior mean = {mean:.2f}"
            )
