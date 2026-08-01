import json
import os
import tempfile
import unittest

from repository import JSONProblemRepository


class RepositoryTests(unittest.TestCase):
    def test_json_repository_loads_problems_from_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "problems.json")
            with open(path, "w", encoding="utf-8") as handle:
                json.dump([
                    {
                        "problem_id": "P1",
                        "title": "Two Sum",
                        "topic": "Arrays",
                        "difficulty": "Easy",
                        "tags": ["hash-map"],
                        "platform": "LeetCode",
                        "url": "https://example.com",
                        "estimated_solving_time": 20,
                    }
                ], handle)

            repo = JSONProblemRepository(data_path=path)
            self.assertEqual(repo.get_arm_counts()[("Arrays", "Easy")], 1)
            self.assertEqual(repo.get_problem(("Arrays", "Easy"))["problem_id"], "P1")


if __name__ == "__main__":
    unittest.main()
