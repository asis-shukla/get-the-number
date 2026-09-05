import type { DatabaseSync } from "node:sqlite";
import type { Level } from "./domain/constants";
import { getDatabase } from "./db";

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
  created_at: string;
};

type ScoreInput = {
  username: string;
  attempts: number;
  level: Level;
};

export function insertScore(input: ScoreInput, database: DatabaseSync = getDatabase()): void {
  database
    .prepare("INSERT INTO scores (username, attempts, level) VALUES (?, ?, ?)")
    .run(input.username, input.attempts, input.level);
}

export function listTopScores(limit = 50, database: DatabaseSync = getDatabase()): Score[] {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50));
  const rows = database
    .prepare(
      "SELECT id, username, attempts, level, created_at FROM scores ORDER BY attempts ASC, created_at DESC LIMIT ?",
    )
    .all(safeLimit) as unknown as ScoreRow[];

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    attempts: row.attempts,
    level: row.level,
    createdAt: row.created_at,
  }));
}
