export const RANGES = [10, 50, 100, 500] as const;

export type GameRange = (typeof RANGES)[number];
export type Level = "BEGINNER" | "EASY" | "MEDIUM" | "HARD";

export const RANGE_TO_LEVEL: Record<GameRange, Level> = {
  10: "BEGINNER",
  50: "EASY",
  100: "MEDIUM",
  500: "HARD",
};

export function isGameRange(value: number): value is GameRange {
  return RANGES.includes(value as GameRange);
}

export function maxAttemptsFor(range: GameRange): number {
  return range;
}
