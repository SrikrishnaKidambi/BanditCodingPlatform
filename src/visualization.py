import matplotlib.pyplot as plt


def plot_arm_selection(arm_counts):

    arms = [f"{a[0]}-{a[1]}" for a in arm_counts.keys()]
    counts = list(arm_counts.values())

    plt.figure(figsize=(12, 6))

    plt.bar(arms, counts)

    plt.xticks(rotation=45)

    plt.title("Arm Selection Frequency")
    plt.ylabel("Number of Selections")

    plt.tight_layout()
    plt.show()


def plot_cumulative_rewards(cumulative_rewards):

    plt.figure(figsize=(12, 6))

    plt.plot(cumulative_rewards)

    plt.title("Cumulative Reward")
    plt.xlabel("Iterations")
    plt.ylabel("Reward")

    plt.tight_layout()
    plt.show()


def plot_posterior_means(posterior_means, true_skills=None):

    arms = [f"{a[0]}-{a[1]}" for a in posterior_means.keys()]
    means = list(posterior_means.values())

    plt.figure(figsize=(12, 6))

    plt.bar(arms, means, label="Estimated", alpha=0.7)

    if true_skills is not None:
        true_values = [true_skills[arm] for arm in posterior_means.keys()]
        plt.bar(arms, true_values, alpha=0.4, label="True Skill", color="orange")
        plt.legend()

    plt.xticks(rotation=45)

    plt.title("Posterior Means vs True Skill")
    plt.ylabel("Estimated Success Probability")

    plt.tight_layout()
    plt.show()


def plot_mode_distribution(mode_counts):
    """Verifies the 70/20/10 educational split is being maintained."""

    modes = list(mode_counts.keys())
    counts = list(mode_counts.values())
    total = sum(counts)
    labels = [f"{m}\n({100 * c / total:.1f}%)" for m, c in zip(modes, counts)]

    plt.figure(figsize=(6, 6))

    plt.pie(counts, labels=labels, autopct=None, startangle=90)

    plt.title("Recommendation Mode Distribution\n(target: 70% learning / 20% weak / 10% revision)")

    plt.tight_layout()
    plt.show()