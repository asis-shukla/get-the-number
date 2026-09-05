import { isGameRange, type GameRange } from "./constants";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const USERNAME_PATTERN = /^[\p{L}\p{N} _'-]+$/u;
const INTEGER_PATTERN = /^\d+$/;

export function validateUsername(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, error: "Enter a username." };
  }

  const value = input.trim();
  if (value.length < 1 || value.length > 30) {
    return { ok: false, error: "Username must be between 1 and 30 characters." };
  }

  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, error: "Use letters, numbers, spaces, hyphens, underscores, or apostrophes only." };
  }

  return { ok: true, value };
}

export function validateRange(input: unknown): ValidationResult<GameRange> {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isInteger(value) || !isGameRange(value)) {
    return { ok: false, error: "Choose a supported difficulty." };
  }

  return { ok: true, value };
}

export function validateGuess(input: unknown, range: GameRange): ValidationResult<number> {
  if (typeof input !== "string") {
    return { ok: false, error: "Enter a whole number." };
  }

  const value = input.trim();
  if (!INTEGER_PATTERN.test(value)) {
    return { ok: false, error: "Enter a whole number from 0 to the selected range." };
  }

  const guess = Number(value);
  if (!Number.isSafeInteger(guess) || guess < 0 || guess > range) {
    return { ok: false, error: `Your guess must be between 0 and ${range}.` };
  }

  return { ok: true, value: guess };
}
