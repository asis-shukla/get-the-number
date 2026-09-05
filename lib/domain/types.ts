import type { GameRange, Level } from "./constants";

export type GameStatus = "in_progress" | "won" | "lost";

export type GameState = {
  username: string;
  range: GameRange;
  level: Level;
  target: number;
  attempts: number;
  maxAttempts: number;
  status: GameStatus;
  createdAt: string;
};

export type ActionResult =
  | { status: "invalid"; message: string }
  | { status: "hint"; message: string; attempts: number }
  | { status: "won"; message: string; attempts: number }
  | { status: "lost"; message: string; attempts: number; target: number }
  | { status: "game_over"; message: string };
