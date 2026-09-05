"use client";

import { useActionState } from "react";
import { submitGuess } from "@/app/game/actions";
import type { ActionResult } from "@/lib/domain/types";

const initialResult: ActionResult | null = null;

export function GuessForm({ range }: { range: number }) {
  const [result, formAction, pending] = useActionState(submitGuess, initialResult);

  return (
    <div className="space-y-5">
      {result ? (
        <div className={`status-banner status-${result.status}`} role="status" aria-live="polite">
          <span>{result.message}</span>
          {"attempts" in result ? <strong>{result.attempts} / {range} attempts</strong> : null}
        </div>
      ) : null}
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <label className="sr-only" htmlFor="guess">Your guess</label>
        <input
          className="field-input flex-1"
          id="guess"
          name="guess"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={`Enter a number from 0 to ${range}`}
          aria-describedby="guess-help"
          required
        />
        <button className="button-primary sm:min-w-36" type="submit" disabled={pending}>
          {pending ? "Checking..." : "Check guess"}
        </button>
      </form>
      <p className="muted-text text-xs" id="guess-help">
        Every valid guess counts as one attempt. You have {range} attempts at most.
      </p>
    </div>
  );
}
