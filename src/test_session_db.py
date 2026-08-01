import unittest
from unittest.mock import patch

from session import UserSession


class FakeCursor:
    def __init__(self):
        self.queries = []

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchone(self):
        return None

    def fetchall(self):
        return []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


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


class SessionDatabaseTests(unittest.TestCase):
    def test_save_uses_database_when_available(self):
        session = UserSession("db-user")
        fake_connection = FakeConnection()

        with patch.object(session, "_connect_db", return_value=fake_connection):
            session.save(
                {("Arrays", "Easy"): {"alpha": 2, "beta": 3}},
                [("Arrays", "Easy")],
            )

        self.assertTrue(fake_connection.committed)
        self.assertTrue(fake_connection.cursor_obj.queries)
        self.assertIn("bandit_sessions", fake_connection.cursor_obj.queries[0][0])


if __name__ == "__main__":
    unittest.main()
