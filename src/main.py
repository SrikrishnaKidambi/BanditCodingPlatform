import sys

from bandit import Bandit
from users import SimulatedUser
from simulation import Simulation
from repository import JSONProblemRepository
from coldstart import ColdStartAssessment
from competency import CompetencyProfile
from session import UserSession
from visualization import (
    plot_arm_selection,
    plot_cumulative_rewards,
    plot_posterior_means,
    plot_mode_distribution
)


def main():

    print("Starting Simulation...\n")

    user = SimulatedUser()

    # --- Cold-start assessment ---
    # In production: cold_start.run_interactive()
    # In simulation: derive ratings from true skill values
    cold_start = ColdStartAssessment()
    raw_priors = cold_start.simulate_responses(user.skills)
    initial_priors = cold_start.propagate_topic_hierarchy(raw_priors)
    cold_start._print_priors(initial_priors)
    print()

    # --- Initial competency profile ---
    bandit = Bandit(initial_priors=initial_priors)
    CompetencyProfile(bandit.banditState).print_summary("INITIAL COMPETENCY PROFILE")
    print()

    repo = JSONProblemRepository()

    simulation = Simulation(
        bandit=bandit,
        user=user,
        repository=repo,
        iterations=500
    )

    results = simulation.run()

    print("=" * 50)
    print("POSTERIOR MEANS (estimated vs true)")
    print("=" * 50)

    for arm, mean in sorted(results["posterior_means"].items(), key=lambda x: x[1]):
        true = user.skills[arm]
        print(f"{arm} -> estimated: {mean:.3f}  true: {true:.2f}")

    print()

    print("=" * 50)
    print("ARM SELECTION COUNTS")
    print("=" * 50)

    for arm, count in sorted(results["arm_counts"].items(), key=lambda x: x[1], reverse=True):
        print(f"{arm} -> {count}")

    print()

    print("=" * 50)
    print("RECOMMENDATION MODE DISTRIBUTION")
    print("=" * 50)

    total = sum(results["mode_counts"].values())
    for mode in ["learning", "weak", "revision"]:
        count = results["mode_counts"].get(mode, 0)
        pct = 100 * count / total
        print(f"{mode:10s}: {count:4d}  ({pct:.1f}%)")

    print()

    print("=" * 50)
    print("TOP 3 MOST RECOMMENDED ARMS")
    print("=" * 50)

    top_3 = sorted(results["arm_counts"].items(), key=lambda x: x[1], reverse=True)[:3]
    for arm, count in top_3:
        print(f"{arm} -> {count}")

    print("=" * 50)
    print("LAST 5 RECOMMENDED PROBLEMS")
    print("=" * 50)

    for entry in results["recommended_problems"][-5:]:
        p = entry["problem"]
        outcome = "solved" if entry["reward"] == 1 else "failed"
        print("[{:8s}] [{:10s}] {:<50s} {}".format(
            entry["mode"], p["problem_id"], p["title"], outcome
        ))

    # --- Final competency profile after learning ---
    print()
    CompetencyProfile(bandit.banditState).print_summary("FINAL COMPETENCY PROFILE")

    print("\nSimulation Complete")

    plot_arm_selection(results["arm_counts"])
    plot_cumulative_rewards(results["cumulative_rewards"])
    plot_posterior_means(results["posterior_means"], true_skills=user.skills)
    plot_mode_distribution(results["mode_counts"])


def run_real_session():
    """
    Interactive session for a real user.
    Loads persisted state for returning users; runs cold-start for new users.
    Saves updated Bandit state at the end so priors accumulate across sessions.

    Run with:  python main.py --session
    """
    print("=" * 52)
    print("  ADAPTIVE CODING PRACTICE SESSION")
    print("=" * 52)

    user_id = input("\n  Enter your user ID: ").strip()
    if not user_id:
        print("  User ID cannot be empty.")
        return

    session = UserSession(user_id)
    saved_state, saved_history = session.load()

    cold_start = ColdStartAssessment()
    repo = JSONProblemRepository()

    if saved_state is not None:
        print(f"\n  Welcome back, {user_id}!")
        bandit = Bandit(initial_priors=saved_state, recommendation_history=saved_history)
    else:
        print(f"\n  Welcome, {user_id}! Let's start with a quick assessment.\n")
        raw_priors = cold_start.run_interactive()
        initial_priors = cold_start.propagate_topic_hierarchy(raw_priors)
        bandit = Bandit(initial_priors=initial_priors)

    print()
    CompetencyProfile(bandit.banditState).print_summary("CURRENT COMPETENCY PROFILE")

    seen_ids = set()
    print("\n  Type 'q' at any prompt to end the session.\n")

    try:
        while True:
            arm, mode = bandit.select_arm()
            problem = repo.get_problem(arm, seen_ids=seen_ids)

            if problem is None:
                print(f"  No unseen problem for {arm[0]}-{arm[1]}, trying again.\n")
                continue

            seen_ids.add(problem["problem_id"])

            print("-" * 52)
            print(f"  [{mode.upper():8s}] {arm[0]} - {arm[1]}")
            print(f"  Problem : {problem['title']}")
            print(f"  Platform: {problem.get('platform', 'N/A')}")
            if problem.get("url"):
                print(f"  URL     : {problem['url']}")
            print()

            while True:
                answer = input("  Did you solve it? (y/n/q): ").strip().lower()
                if answer in ("y", "n", "q"):
                    break
                print("  Enter y, n, or q.")

            if answer == "q":
                break

            bandit.update(arm, reward=1 if answer == "y" else 0)
            print()

    except KeyboardInterrupt:
        print()

    print()
    CompetencyProfile(bandit.banditState).print_summary("SESSION SUMMARY")
    session.save(bandit.banditState, bandit.recommendation_history)


if __name__ == "__main__":
    if "--session" in sys.argv:
        run_real_session()
    else:
        main()