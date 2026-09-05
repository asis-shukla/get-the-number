import { AutoRedirect } from "@/app/components/auto-redirect";
import { GuessForm } from "@/app/components/guess-form";
import { exitGame } from "@/app/game/actions";
import { readGameState } from "@/lib/game-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const game = await readGameState();
  if (!game) redirect("/");

  return (
    <main className="page-shell">
      <div className="site-mark">
        <span className="site-mark-dot" /> GETME / GAME
      </div>
      <section className="game-header">
        <div>
          <p className="eyebrow">
            {game.level} LEVEL · 0—{game.range}
          </p>
          <h1>
            Good luck, <em>{game.username}</em>.
          </h1>
        </div>
        <form action={exitGame}>
          <button className="button-quiet" type="submit">
            Exit game <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      <section className="game-layout">
        <div className="game-panel">
          <div className="attempt-meter">
            <div>
              <span className="eyebrow">Attempts used</span>
              <strong>{game.attempts.toString().padStart(2, "0")}</strong>
            </div>
            <div className="attempt-limit">MAX {game.maxAttempts}</div>
          </div>
          {game.status === "won" ? (
            <>
              <div className="terminal-message status-won" role="status">
                <strong>
                  You got it in {game.attempts}{" "}
                  {game.attempts === 1 ? "try" : "tries"}!
                </strong>
                <span>That was a sharp read.</span>
                <span>Redirecting to leaderboard in 2 seconds ...</span>
              </div>
              <AutoRedirect href="/" delayMs={2000} />
            </>
          ) : game.status === "lost" ? (
            <div className="terminal-message status-lost" role="status">
              <strong>No attempts left.</strong>
              <span>The number was {game.target}.</span>
            </div>
          ) : (
            <>
              <p className="eyebrow">Make your move</p>
              <h2 className="game-question">
                What number
                <br />
                <em>are you feeling?</em>
              </h2>
              <GuessForm range={game.range} />
            </>
          )}
        </div>
        <aside className="how-panel">
          <p className="eyebrow">How it works</p>
          <p className="how-copy">
            The closer your guess gets, the warmer the hint. Find the hidden
            number before your attempts run out.
          </p>
          <div className="hint-key">
            <span className="key-line key-far" /> Far from it{" "}
            <span className="key-line key-close" /> Getting close
          </div>
        </aside>
      </section>
      <footer className="site-footer">
        <span>GAME IN PROGRESS</span>
        <span>KEEP YOUR EYES ON THE NUMBER</span>
        <span>GETME / 01</span>
      </footer>
    </main>
  );
}
