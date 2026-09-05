export type HintResult =
  | { kind: "win" }
  | { kind: "hint"; message: string };

export function getHint(guess: number, target: number, range: number): HintResult {
  if (guess === target) {
    return { kind: "win" };
  }

  if (guess < target) {
    return guess <= Math.floor((2 * target) / 3)
      ? { kind: "hint", message: "You are far behind the number" }
      : { kind: "hint", message: "You are close behind the number" };
  }

  const threshold = target + Math.floor((range - target) / 3);
  return guess <= threshold
    ? { kind: "hint", message: "You are close ahead of the number" }
    : { kind: "hint", message: "You are far ahead of the number" };
}
