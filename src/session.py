import json
import os
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "users")


def _arm_to_key(arm):
    return f"{arm[0]}_{arm[1]}"


def _key_to_arm(key):
    # Topics have no underscores; difficulty is always the last segment
    topic, difficulty = key.rsplit("_", 1)
    return (topic, difficulty)


class UserSession:
    """Persists and restores a user's Bandit state across sessions."""

    def __init__(self, user_id):
        self.user_id = user_id
        self.path = os.path.join(DATA_DIR, f"{user_id}.json")

    def exists(self):
        return os.path.isfile(self.path)

    def save(self, bandit_state, recommendation_history):
        os.makedirs(DATA_DIR, exist_ok=True)
        data = {
            "user_id": self.user_id,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "bandit_state": {
                _arm_to_key(arm): state
                for arm, state in bandit_state.items()
            },
            "recommendation_history": [
                _arm_to_key(arm) for arm in recommendation_history
            ],
        }
        with open(self.path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"\n  Session saved for '{self.user_id}'.")

    def load(self):
        """
        Returns (bandit_state, recommendation_history).
        bandit_state is None for new users.
        """
        if not self.exists():
            return None, []
        with open(self.path) as f:
            data = json.load(f)
        bandit_state = {
            _key_to_arm(k): v
            for k, v in data["bandit_state"].items()
        }
        history = [_key_to_arm(k) for k in data.get("recommendation_history", [])]
        last = data.get("last_updated", "unknown")
        print(f"  Loaded session for '{self.user_id}' (last updated: {last}).")
        return bandit_state, history
