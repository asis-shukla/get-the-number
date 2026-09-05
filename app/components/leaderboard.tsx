import type { Score } from "@/lib/scores-repository";

export function Leaderboard({ scores }: { scores: Score[] }) {
  return (
    <section aria-labelledby="leaderboard-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The scoreboard</p>
          <h2 className="section-title" id="leaderboard-title">Best attempts</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-(--ink-muted)">Top 50</span>
      </div>
      {scores.length === 0 ? (
        <p className="empty-state">No finished games yet. Be the first name on the board.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--line) bg-white/70">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-(--line) bg-(--paper-deep) text-xs uppercase tracking-[0.14em] text-(--ink-muted)">
              <tr>
                <th className="px-5 py-4 font-semibold">Player</th>
                <th className="px-5 py-4 text-right font-semibold">Attempts</th>
                <th className="hidden px-5 py-4 text-right font-semibold sm:table-cell">Level</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr className="border-b border-(--line) last:border-0" key={score.id}>
                  <td className="px-5 py-4 font-medium text-foreground">
                    <span className="mr-3 inline-block w-5 text-xs text-(--ink-muted)">{index + 1}</span>
                    {score.username}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-(--accent)">{score.attempts}</td>
                  <td className="hidden px-5 py-4 text-right text-xs font-semibold tracking-widest text-(--ink-muted) sm:table-cell">{score.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
