"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { RANGE_TO_LEVEL, maxAttemptsFor } from "@/lib/domain/constants";
import { validateRange, validateUsername } from "@/lib/domain/validation";
import { writeGameState } from "@/lib/game-session";
import type { GameState } from "@/lib/domain/types";

export type StartGameState = {
  errors: { username?: string; range?: string };
};

function targetFor(range: number): number {
  const testTarget =
    process.env.NODE_ENV === "development" &&
    process.env.GETME_TEST_MODE === "1" &&
    process.env.GETME_TEST_SECRET === process.env.GAME_COOKIE_SECRET
      ? process.env.GETME_TEST_TARGET
      : undefined;
  if (testTarget !== undefined && /^\d+$/.test(testTarget)) {
    const target = Number(testTarget);
    if (Number.isInteger(target) && target >= 0 && target <= range) return target;
  }

  return randomInt(0, range + 1);
}

export async function startGame(
  _previousState: StartGameState,
  formData: FormData,
): Promise<StartGameState> {
  const username = validateUsername(formData.get("username"));
  const range = validateRange(formData.get("range"));
  const errors: StartGameState["errors"] = {};

  if (!username.ok) errors.username = username.error;
  if (!range.ok) errors.range = range.error;
  if (!username.ok || !range.ok) return { errors };

  const usernameValue = username.value;
  const rangeValue = range.value;

  const state: GameState = {
    username: usernameValue,
    range: rangeValue,
    level: RANGE_TO_LEVEL[rangeValue],
    target: targetFor(rangeValue),
    attempts: 0,
    maxAttempts: maxAttemptsFor(rangeValue),
    status: "in_progress",
    createdAt: new Date().toISOString(),
  };

  await writeGameState(state);
  redirect("/game");
}
