CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  level TEXT NOT NULL CHECK (level IN ('BEGINNER', 'EASY', 'MEDIUM', 'HARD')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_leaderboard
  ON scores (attempts ASC, created_at DESC);
