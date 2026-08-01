import glob
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "users")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3001")
BACKEND_INTERNAL_TOKEN = os.environ.get("BACKEND_INTERNAL_TOKEN", "")


def _internal_headers():
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if BACKEND_INTERNAL_TOKEN:
        headers["x-internal-token"] = BACKEND_INTERNAL_TOKEN
    return headers


def _backend_url(path):
    return f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"


def _backend_request(method, path, body=None):
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        _backend_url(path),
        data=data,
        headers=_internal_headers(),
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status not in (200, 201):
                return None
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError):
        return None


def migrate_user_sessions_to_db():
    migrated = 0
    for path in glob.glob(os.path.join(DATA_DIR, "*.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            user_id = data.get("user_id")
            if not user_id:
                continue
            payload = {"session_data": data}
            res = _backend_request("POST", f"api/internal/sessions/{user_id}", payload)
            if res and res.get("status") == "ok":
                migrated += 1
        except Exception:
            continue
    return migrated


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

    def _save_remote(self, data):
        payload = {"session_data": data}
        return _backend_request("POST", f"api/internal/sessions/{self.user_id}", payload)

    def _load_remote(self):
        return _backend_request("GET", f"api/internal/sessions/{self.user_id}")

    def _delete_remote(self):
        return _backend_request("DELETE", f"api/internal/sessions/{self.user_id}")

    def save(self, bandit_state, recommendation_history):
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

        if self._save_remote(data) is not None:
            print(f"\n  Session saved for '{self.user_id}' in backend.")
            return

        raise RuntimeError(f"Failed to save session for '{self.user_id}' to backend.")

    def load(self):
        """
        Returns (bandit_state, recommendation_history).
        bandit_state is None for new users.
        """
        remote = self._load_remote()
        if remote is not None and isinstance(remote, dict):
            data = remote.get("session_data")
            if data is not None:
                bandit_state = {
                    _key_to_arm(k): v
                    for k, v in data.get("bandit_state", {}).items()
                }
                history = [_key_to_arm(k) for k in data.get("recommendation_history", [])]
                last = data.get("last_updated", "unknown")
                print(f"  Loaded session for '{self.user_id}' (last updated: {last}).")
                return bandit_state, history

        return None, []

    def delete(self):
        return self._delete_remote() is not None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="User session persistence utilities")
    parser.add_argument(
        "--migrate-sessions",
        action="store_true",
        help="Migrate JSON user sessions from data/users to the database.",
    )
    args = parser.parse_args()

    if args.migrate_sessions:
        migrated = migrate_user_sessions_to_db()
        print(f"Migrated {migrated} user session(s) to the database.")
