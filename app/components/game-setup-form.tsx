"use client";

import { useActionState } from "react";
import { startGame, type StartGameState } from "@/app/actions/start-game";

const initialStartGameState: StartGameState = { errors: {} };

export function GameSetupForm() {
  const [state, formAction, pending] = useActionState(startGame, initialStartGameState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div>
        <label className="field-label" htmlFor="username">
          Your name
        </label>
        <input
          className="field-input"
          id="username"
          name="username"
          placeholder="How should the board remember you?"
          maxLength={30}
          autoComplete="nickname"
          required
        />
        {state?.errors?.username ? <p className="field-error">{state.errors.username}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="range">
          Choose your range
        </label>
        <select className="field-input" id="range" name="range" defaultValue="50" required>
          <option value="10">BEGINNER · 0 to 10</option>
          <option value="50">EASY · 0 to 50</option>
          <option value="100">MEDIUM · 0 to 100</option>
          <option value="500">HARD · 0 to 500</option>
        </select>
        {state?.errors?.range ? <p className="field-error">{state.errors.range}</p> : null}
      </div>

      <button className="button-primary w-full" type="submit" disabled={pending}>
        {pending ? "Starting game..." : "Start a new game"}
      </button>
    </form>
  );
}
