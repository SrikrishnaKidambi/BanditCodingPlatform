import glob
import json
import os
import tempfile
import unittest
from unittest.mock import patch

import session
from session import migrate_user_sessions_to_db


class FakeCursor:
    def __init__(self):
        self.queries = []

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def close(self):
        pass


class FakeConnection:
    def __init__(self):
        self.cursor_obj = FakeCursor()
        self.committed = False
        self.closed = False

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


class SessionMigrationTests(unittest.TestCase):
    def test_migrate_user_sessions_to_db_reads_json_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            old_data_dir = session.DATA_DIR
            session.DATA_DIR = tmpdir
            path = os.path.join(tmpdir, "user1.json")
            with open(path, "w", encoding="utf-8") as handle:
                json.dump({
                    "user_id": "user1",
                    "last_updated": "2026-08-01T00:00:00Z",
                    "bandit_state": {"Arrays_Easy": {"alpha": 2, "beta": 3}},
                    "recommendation_history": ["Arrays_Easy"],
                }, handle)

            fake_conn = FakeConnection()
            with patch("session._connect_db", return_value=fake_conn):
                migrated = migrate_user_sessions_to_db()

            session.DATA_DIR = old_data_dir

        self.assertEqual(migrated, 1)
        self.assertTrue(fake_conn.committed)
        self.assertEqual(len(fake_conn.cursor_obj.queries), 1)
        self.assertIn("INSERT INTO bandit_sessions", fake_conn.cursor_obj.queries[0][0])


if __name__ == "__main__":
    unittest.main()
