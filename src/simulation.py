from collections import defaultdict


class Simulation:
    def __init__(self, bandit, user, repository=None, iterations=500):
        self.bandit = bandit
        self.user = user
        self.repository = repository
        self.iterations = iterations

        self.selected_arms = []
        self.rewards = []

        self.arm_counts = defaultdict(int)
        self.mode_counts = defaultdict(int)
        self.seen_problem_ids = set()
        self.recommended_problems = []

    def run(self):

        cumulative_reward = 0
        cumulative_rewards = []

        for _ in range(self.iterations):

            arm, mode = self.bandit.select_arm()

            reward = self.user.attempt_problem(arm)

            self.bandit.update(arm, reward)

            self.selected_arms.append(arm)
            self.rewards.append(reward)

            self.arm_counts[arm] += 1
            self.mode_counts[mode] += 1

            if self.repository is not None:
                problem = self.repository.get_problem(arm, seen_ids=self.seen_problem_ids)
                if problem:
                    self.seen_problem_ids.add(problem["problem_id"])
                    self.recommended_problems.append({
                        "problem": problem,
                        "mode": mode,
                        "reward": reward
                    })

            cumulative_reward += reward
            cumulative_rewards.append(cumulative_reward)

        return {
            "selected_arms": self.selected_arms,
            "rewards": self.rewards,
            "arm_counts": dict(self.arm_counts),
            "mode_counts": dict(self.mode_counts),
            "cumulative_rewards": cumulative_rewards,
            "posterior_means": self.bandit.get_posterior_means(),
            "recommended_problems": self.recommended_problems
        }