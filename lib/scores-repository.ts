import type { Level } from "./domain/constants";
import { getSql } from "./db";

export type Score = {
  id: number;
  username: string;
  attempts: number;
  level: Level;
  createdAt: string;
};

type ScoreRow = {
  id: number;
  username: string;
  attempts: number;
  level: Level;
  created_at: string | Date;
};

type ScoreInput = {
  username: string;
  attempts: number;
  level: Level;
};

export async function insertScore(input: ScoreInput): Promise<void> {
  await getSql()`
    INSERT INTO scores (username, attempts, level)
    VALUES (${input.username}, ${input.attempts}, ${input.level})
  `;
}

export async function listTopScores(limit = 50): Promise<Score[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50));
  const rows = await getSql()`
    SELECT id, username, attempts, level, created_at
    FROM scores
    ORDER BY attempts ASC, created_at DESC
    LIMIT ${safeLimit}
  ` as ScoreRow[];

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    attempts: row.attempts,
    level: row.level,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }));
}
