export const mockUser = {
  name: "Srikrishna Kidambi",
  email: "k.venkata.srikrishna@accenture.com",
  joinDate: "2026-01-15",
  totalSolved: 47,
  totalAttempted: 62,
  streak: 12,
  topicsActive: 5,
}

export const mockRecommendedProblem = {
  problem_id: "ARR-M-002",
  title: "Product of Array Except Self",
  topic: "Arrays",
  difficulty: "Medium",
  tags: ["prefix-sum", "array"],
  platform: "LeetCode",
  url: "https://leetcode.com/problems/product-of-array-except-self/",
  estimated_solving_time: 30,
  mode: "learning",
  reason: "Your Arrays mastery is at 73% — this problem keeps you in the optimal learning zone.",
}

export const mockNextProblems = [
  {
    problem_id: "GR-M-003",
    title: "Course Schedule",
    topic: "Graphs",
    difficulty: "Medium",
    tags: ["topological-sort", "dfs", "graph"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/course-schedule/",
    estimated_solving_time: 35,
    mode: "weak",
    reason: "Graphs is your weakest topic at 32% mastery — targeted reinforcement recommended.",
  },
  {
    problem_id: "DP-E-001",
    title: "Climbing Stairs",
    topic: "DP",
    difficulty: "Easy",
    tags: ["dynamic-programming", "memoization"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/climbing-stairs/",
    estimated_solving_time: 15,
    mode: "weak",
    reason: "DP is your weakest area at 10–15% mastery. Starting with Easy builds the foundation.",
  },
  {
    problem_id: "ARR-E-001",
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "Easy",
    tags: ["hash-map", "array"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/two-sum/",
    estimated_solving_time: 15,
    mode: "revision",
    reason: "Arrays-Easy is a mastered topic (90%). Revisiting it reinforces long-term retention.",
  },
]

export const mockPracticeHistory = [
  { problem_id: "ARR-E-001", title: "Two Sum", topic: "Arrays", difficulty: "Easy", outcome: "solved", mode: "revision", date: "2026-07-02" },
  { problem_id: "DP-E-001", title: "Climbing Stairs", topic: "DP", difficulty: "Easy", outcome: "solved", mode: "learning", date: "2026-07-02" },
  { problem_id: "GR-M-003", title: "Course Schedule", topic: "Graphs", difficulty: "Medium", outcome: "failed", mode: "weak", date: "2026-07-01" },
  { problem_id: "BS-E-001", title: "Binary Search", topic: "BinarySearch", difficulty: "Easy", outcome: "solved", mode: "learning", date: "2026-07-01" },
  { problem_id: "TR-M-001", title: "Binary Tree Level Order Traversal", topic: "Trees", difficulty: "Medium", outcome: "solved", mode: "learning", date: "2026-06-30" },
  { problem_id: "DP-M-001", title: "Coin Change", topic: "DP", difficulty: "Medium", outcome: "failed", mode: "weak", date: "2026-06-30" },
  { problem_id: "ARR-M-004", title: "Container With Most Water", topic: "Arrays", difficulty: "Medium", outcome: "solved", mode: "learning", date: "2026-06-29" },
  { problem_id: "GR-E-001", title: "Find if Path Exists in Graph", topic: "Graphs", difficulty: "Easy", outcome: "solved", mode: "weak", date: "2026-06-29" },
  { problem_id: "BS-M-001", title: "Search in Rotated Sorted Array", topic: "BinarySearch", difficulty: "Medium", outcome: "failed", mode: "learning", date: "2026-06-28" },
  { problem_id: "TR-E-001", title: "Maximum Depth of Binary Tree", topic: "Trees", difficulty: "Easy", outcome: "solved", mode: "revision", date: "2026-06-28" },
]

export const mockTopicMastery = [
  { topic: "Arrays",        difficulty: "Easy",   mastery: 0.897 },
  { topic: "Arrays",        difficulty: "Medium", mastery: 0.729 },
  { topic: "BinarySearch",  difficulty: "Easy",   mastery: 0.793 },
  { topic: "BinarySearch",  difficulty: "Medium", mastery: 0.429 },
  { topic: "Trees",         difficulty: "Easy",   mastery: 0.474 },
  { topic: "Trees",         difficulty: "Medium", mastery: 0.500 },
  { topic: "Graphs",        difficulty: "Easy",   mastery: 0.512 },
  { topic: "Graphs",        difficulty: "Medium", mastery: 0.323 },
  { topic: "DP",            difficulty: "Easy",   mastery: 0.154 },
  { topic: "DP",            difficulty: "Medium", mastery: 0.100 },
]

export const mockModeDistribution = {
  learning: 351,
  weak: 96,
  revision: 53,
}

export const mockArmCounts = [
  { arm: "Arrays-Easy",         count: 105 },
  { arm: "BinarySearch-Easy",   count: 90  },
  { arm: "Arrays-Medium",       count: 83  },
  { arm: "Graphs-Easy",         count: 41  },
  { arm: "Trees-Medium",        count: 38  },
  { arm: "Trees-Easy",          count: 36  },
  { arm: "Graphs-Medium",       count: 29  },
  { arm: "DP-Medium",           count: 28  },
  { arm: "BinarySearch-Medium", count: 26  },
  { arm: "DP-Easy",             count: 24  },
]
