TOPICS = ["Arrays", "BinarySearch", "Trees", "Graphs", "DP"]

# Posterior mean thresholds for tier classification
TIERS = [
    (0.70, "strong"),
    (0.40, "developing"),
    (0.00, "weak"),
]

# Easy arm posterior mean above this marks the arm as ready to push toward Medium
PROGRESSION_THRESHOLD = 0.75


class CompetencyProfile:
    """
    Computes a structured competency snapshot from a bandit's current state.
    Can be called after cold-start initialization or at any point during a session
    to understand where a user stands across all arms.
    """

    def __init__(self, bandit_state):
        # bandit_state: {arm: {"alpha": ..., "beta": ...}}
        self.state = bandit_state

    @property
    def arms(self):
        return list(self.state.keys())

    # ------------------------------------------------------------------
    # Per-arm metrics
    # ------------------------------------------------------------------

    def posterior_mean(self, arm):
        s = self.state[arm]
        return s["alpha"] / (s["alpha"] + s["beta"])

    def confidence(self, arm):
        """alpha + beta = effective number of observations behind the estimate."""
        s = self.state[arm]
        return s["alpha"] + s["beta"]

    def tier(self, arm):
        mean = self.posterior_mean(arm)
        for threshold, label in TIERS:
            if mean >= threshold:
                return label
        return "weak"

    def ready_for_progression(self, arm):
        """
        True when an Easy arm's mastery exceeds the progression threshold,
        signalling the recommendation engine should favour the corresponding Medium arm.
        """
        topic, difficulty = arm
        if difficulty != "Easy":
            return False
        return self.posterior_mean(arm) >= PROGRESSION_THRESHOLD

    # ------------------------------------------------------------------
    # Profile & aggregates
    # ------------------------------------------------------------------

    def get_profile(self):
        """Returns a full dict snapshot of all arms."""
        return {
            arm: {
                "mean":                   round(self.posterior_mean(arm), 3),
                "confidence":             self.confidence(arm),
                "tier":                   self.tier(arm),
                "ready_for_progression":  self.ready_for_progression(arm),
            }
            for arm in self.arms
        }

    def weakest_arms(self, n=3):
        return sorted(self.arms, key=self.posterior_mean)[:n]

    def strongest_arms(self, n=3):
        return sorted(self.arms, key=self.posterior_mean, reverse=True)[:n]

    def arms_ready_for_progression(self):
        return [arm for arm in self.arms if self.ready_for_progression(arm)]

    def overall_mastery(self):
        """Simple average posterior mean across all arms."""
        means = [self.posterior_mean(arm) for arm in self.arms]
        return sum(means) / len(means)

    # ------------------------------------------------------------------
    # Display
    # ------------------------------------------------------------------

    def print_summary(self, label="COMPETENCY PROFILE"):
        print("=" * 60)
        print(f"  {label}")
        print("=" * 60)

        profile = self.get_profile()
        for arm, data in sorted(profile.items(), key=lambda x: x[1]["mean"], reverse=True):
            progression = "  [-> ready for Medium]" if data["ready_for_progression"] else ""
            print(
                f"  {arm[0]}-{arm[1]:<12}"
                f"  {data['mean']:.2f}"
                f"  [{data['tier']:^11}]"
                f"  conf={data['confidence']:>3}"
                f"{progression}"
            )

        print()
        weak   = [f"{a[0]}-{a[1]}" for a in self.weakest_arms(3)]
        strong = [f"{a[0]}-{a[1]}" for a in self.strongest_arms(3)]
        ready  = [f"{a[0]}-{a[1]}" for a in self.arms_ready_for_progression()]

        print(f"  Overall mastery : {self.overall_mastery():.2f}")
        print(f"  Weakest arms    : {weak}")
        print(f"  Strongest arms  : {strong}")
        if ready:
            print(f"  Ready to advance: {ready}")
