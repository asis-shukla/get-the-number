CREATE TABLE IF NOT EXISTS scores (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  level text NOT NULL CHECK (level IN ('BEGINNER', 'EASY', 'MEDIUM', 'HARD')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_leaderboard
  ON scores (attempts ASC, created_at DESC);
