"use server";

import { clearGameState, readGameState, writeGameState } from "@/lib/game-session";
import { getHint } from "@/lib/domain/hints";
import type { ActionResult } from "@/lib/domain/types";
import { validateGuess } from "@/lib/domain/validation";
import { insertScore } from "@/lib/scores-repository";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitGuess(_previousResult: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const state = await readGameState();
  if (!state || state.status !== "in_progress") {
    return { status: "game_over", message: "This game is over. Start a new game to play again." };
  }

  const guess = validateGuess(formData.get("guess"), state.range);
  if (!guess.ok) return { status: "invalid", message: guess.error };

  const attempts = state.attempts + 1;
  const hint = getHint(guess.value, state.target, state.range);

  if (hint.kind === "win") {
    await writeGameState({ ...state, attempts, status: "won" });
    await insertScore({ username: state.username, attempts, level: state.level });
    revalidatePath("/");
    return { status: "won", attempts, message: `You got it in ${attempts} ${attempts === 1 ? "try" : "tries"}!` };
  }

  if (attempts >= state.maxAttempts) {
    await writeGameState({ ...state, attempts, status: "lost" });
    return {
      status: "lost",
      attempts,
      target: state.target,
      message: `No attempts left. The number was ${state.target}.`,
    };
  }

  await writeGameState({ ...state, attempts });
  return { status: "hint", attempts, message: hint.message };
}

export async function exitGame(): Promise<never> {
  await clearGameState();
  redirect("/");
}
