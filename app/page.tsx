import { GameSetupForm } from "@/app/components/game-setup-form";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="site-mark"><span className="site-mark-dot" /> GETME / 01</div>
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">A small game of nerve and numbers</p>
          <h1>Find the number.<br /><em>Trust your instinct.</em></h1>
          <p className="hero-description">
            Pick a range, make your guesses, and climb the board with the fewest attempts.
            The answer is waiting somewhere between zero and your chosen limit.
          </p>
          <div className="rule-row">
            <span>01</span><span>Choose a level</span>
            <span>02</span><span>Read the hint</span>
            <span>03</span><span>Beat the board</span>
          </div>
        </div>
        <div className="setup-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ready when you are</p>
              <h2>Start a game</h2>
            </div>
            <span className="panel-number">01</span>
          </div>
          <GameSetupForm />
        </div>
      </section>
      <footer className="site-footer"><span>ANONYMOUS PLAY</span><span>ONE GUESS AT A TIME</span><span>© GETME</span></footer>
    </main>
  );
}
