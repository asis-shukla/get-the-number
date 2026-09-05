# GetMe Next.js + SQLite Rewrite — Implementation Plan

**Companion document to:** `SPEC.md`
**Audience:** An AI coding agent implementing this project from scratch, with no access to the original PHP repository (only `SPEC.md` and this `PLAN.md` will be available).
**Status:** All open questions in `SPEC.md` Section 15 that affect implementation have been resolved below. Treat this document as authoritative for behavior; `SPEC.md` is authoritative for historical context only.

---

## 0. How to use this document

Implement the phases in order (Phase 1 → Phase 9). Each phase lists concrete deliverables and a "Definition of done" checklist. Do not skip validation/security steps to save time. Where a decision was open in `SPEC.md`, the resolved decision is restated here and SPEC should be considered superseded.

---

## 1. Resolved Decisions (supersedes SPEC.md Section 15)

| Topic | Decision |
|---|---|
| Parity vs. fixes | **Fix all known issues.** Do not reproduce SQL injection, missing validation, missing output escaping, or unbounded scoreboard queries. Game *feel* (ranges, hint wording, level names) stays close to the original, but implementation bugs are corrected. |
| Max attempts | **Hard stop.** When attempts reach the max for the selected range, the game ends in a `lost` state; no further guesses are accepted. |
| Invalid guesses | **Rejected without counting as an attempt.** Non-numeric, empty, decimal, negative, or out-of-range (outside `0..range`) guesses return a validation error and do not increment the attempt counter. |
| Level labels | **Corrected spelling.** Use `BEGINNER`, `EASY`, `MEDIUM`, `HARD` (not `BIGGINER` / `MIDIUM`). |
| Scoreboard ordering | Fewest attempts first, then most recent first as a tiebreaker. Limit to top 50 rows. |
| Win state | **Game locks on win.** Status becomes `won`; no further guesses accepted; exactly one score row is written per completed game. |
| Session/game state | **Signed, encrypted HTTP-only cookie** holding the full game state (no server-side session table). Single-instance deployment assumed. |
| Existing data | **None.** Start with an empty SQLite database. No migration script is needed. |
| Styling | **Tailwind CSS.** |
| Data access | **No ORM, no external SQLite driver package.** Use Node.js's built-in `node:sqlite` module with plain, parameterized SQL strings. All mutations run through Next.js Server Actions; reads use Server Components or Server Actions. |
| Package manager | npm. |
| Testing | Vitest for unit tests (domain logic, validation), Playwright for end-to-end tests (full game flow). |
| Runtime | Node.js 22.5+ (required for `node:sqlite`), Next.js 15+, App Router, TypeScript. |

### Explicitly out of scope (do not add)
- User accounts, authentication, login, roles, admin panel.
- Email, payment, analytics, third-party APIs.
- Multi-instance/distributed session storage.
- Data migration tooling (no legacy data exists).

---

## 2. Domain Model

### 2.1 Difficulty levels (constant, exhaustive)

| `range` | `level` |
|---|---|
| 10 | `BEGINNER` |
| 50 | `EASY` |
| 100 | `MEDIUM` |
| 500 | `HARD` |

Any other submitted range value is rejected at the API boundary.

### 2.2 Game state machine

States: `in_progress` → `won` | `lost`.

- A new game starts `in_progress` with `attempts = 0` and a `target` integer chosen uniformly from `0..range` inclusive.
- Max attempts for a game equals `range` (i.e. a `BEGINNER` game allows 10 attempts, `HARD` allows 500). This mirrors the original app's threshold and is now actually enforced.
- A guess is only processed while `status === "in_progress"`.
- On a valid guess:
  - If `guess === target`: `attempts += 1`, `status = "won"`, insert one score row, return result `won`.
  - Else: `attempts += 1`; if `attempts >= maxAttempts`, `status = "lost"` and return result `lost` (with the final hint still shown); otherwise return the hint (see 2.3) and result `hint`.
- Once `status` is `won` or `lost`, subsequent guess submissions are rejected with a `game_over` error and the client is prompted to start a new game. The target is **never** sent to the client while `in_progress`; it may optionally be revealed in the terminal `lost` response only (see 2.4).

### 2.3 Hint algorithm (deterministic, non-overlapping)

Given integer `target` (`T`), integer `range` (`R`), and validated integer `guess` (`G`) where `0 <= G <= R`:

1. If `G === T` → win (handled above, not a hint).
2. If `G < T`:
   - If `G <= floor(2 * T / 3)` → `"You are far behind the number"`.
   - Else → `"You are close behind the number"`.
3. If `G > T`:
   - Let `threshold = T + floor((R - T) / 3)`.
   - If `G <= threshold` → `"You are close ahead of the number"`.
   - Else → `"You are far ahead of the number"`.

This covers every integer in `0..R` exactly once (no "we do not know" fallback is reachable, and it is not implemented).

### 2.4 Terminal responses
- `won`: `{ status: "won", attempts, message: "You got it in N tries!" }`. Target is not needed since the guess equals it.
- `lost`: `{ status: "lost", attempts, target, message: "No attempts left. The number was N." }`. Revealing the target here is a deliberate, documented deviation from the legacy app (which never revealed it) because the game is over and there is nothing left to guess — this must be called out in the README as a behavior change.

### 2.5 Username validation
- Required, trimmed.
- Length 1–30 characters after trimming.
- Allowed characters: letters (any Unicode letter), digits, spaces, hyphen, underscore, apostrophe. Reject everything else (defends against script injection in the name and keeps scoreboard rendering simple; output is still escaped by React regardless).

### 2.6 Guess input validation
- Must be present, a string of digits only (optionally with surrounding whitespace, trimmed before parsing), parsed as a base-10 integer.
- Must satisfy `0 <= guess <= range`.
- Any failure returns `{ status: "invalid", message }` and does **not** consume an attempt or mutate game state.

---

## 3. Database Schema

SQLite file: `data/getme.db` (created on first run if absent; add `data/` to `.gitignore` but keep the directory via `.gitkeep`).

```sql
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  level TEXT NOT NULL CHECK (level IN ('BEGINNER', 'EASY', 'MEDIUM', 'HARD')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (attempts ASC, created_at DESC);
```

- All access goes through parameterized statements (`?` placeholders) via `node:sqlite`'s `DatabaseSync` — never string-interpolate values into SQL.
- Apply schema via a plain `.sql` file (`db/schema.sql`) executed once at startup (idempotent `CREATE TABLE IF NOT EXISTS`).
- No other tables exist. Active game state lives only in the client's signed cookie, never in SQLite.

---

## 4. Session / Game State (Signed Cookie)

- Cookie name: `getme_game`.
- Payload (JSON before encryption): `{ username, range, level, target, attempts, maxAttempts, status, createdAt }`.
- Encode as an encrypted, tamper-proof token:
  - Use Node's built-in `crypto` module: AES-256-GCM with a server-only secret (`GAME_COOKIE_SECRET` env var, 32-byte key, generated via `crypto.randomBytes(32).toString("hex")` and documented in `.env.example`).
  - Store `iv + authTag + ciphertext` (base64url) as the cookie value so the client cannot read or forge `target`.
- Cookie flags: `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`, `path: "/"`, `maxAge` matched to a reasonable game session length (e.g. 1 hour).
- Starting a new game overwrites the cookie (acts as session regeneration).
- "Exit game" clears the cookie (`maxAge: 0`) and redirects to `/`.
- If a route requiring an active game is hit with a missing/invalid/undecryptable cookie, redirect to `/` rather than throwing.

---

## 5. Project Structure

```
getme-next/
  app/
    layout.tsx                 # root layout, Tailwind globals, favicon
    page.tsx                   # "/" instructions + setup form (Server Component)
    globals.css
    game/
      page.tsx                 # "/game" current game state + guess form + leaderboard
      actions.ts                # "submitGuess", "exitGame" server actions
    actions/
      start-game.ts             # "startGame" server action (replaces middle.php)
    scores/
      page.tsx                 # optional standalone "/scores" leaderboard page
  lib/
    domain/
      constants.ts              # RANGE_TO_LEVEL map, allowed ranges
      hints.ts                  # pure hint algorithm (unit-testable)
      validation.ts             # username/guess validators
    game-session.ts             # cookie encode/decode (AES-256-GCM)
    db.ts                       # node:sqlite DatabaseSync singleton + schema bootstrap
    scores-repository.ts        # insertScore(), listTopScores()
  db/
    schema.sql
  public/
    favicon.ico                 # copied from images/favicon.ico
  tests/
    unit/
      hints.test.ts
      validation.test.ts
    e2e/
      game-flow.spec.ts
  .env.example
  package.json
  tsconfig.json
  tailwind.config.ts
  next.config.ts
```

---

## 6. Route / Action Mapping (replaces SPEC.md Section 7)

| Legacy | New |
|---|---|
| `GET index.php` | `GET /` — instructions, range select (`BEGINNER/EASY/MEDIUM/HARD`), username input, submit button |
| `POST middle.php` | `startGame(formData)` server action called from the `/` form — validates input, generates target, sets the signed cookie, redirects to `/game` |
| `GET play_first_time.php` | `GET /game` — reads cookie; if `status === "in_progress"` and `attempts === 0`, shows the welcome + first guess form; if no valid cookie, redirects to `/` |
| `POST play.php` (guess) | `submitGuess(formData)` server action — validates guess, updates game state in the cookie, inserts score on win, returns result rendered by `/game` |
| `POST play.php` (scoreboard render) | Leaderboard rendered inside `/game` (and optionally `/scores`) via `listTopScores()`, a direct `node:sqlite` query, no HTTP round trip needed since it's a Server Component |
| Exit links | `exitGame()` server action — clears cookie, redirects to `/` |

No JSON REST API is required since Server Actions handle all mutations; a `GET /api/scores` route can be added later only if an external client is needed (not required for parity).

---

## 7. Step-by-Step Implementation Plan

### Phase 1 — Project scaffolding
1. `npx create-next-app@latest getme-next --typescript --tailwind --app --eslint --src-dir=false`
2. Confirm Node.js version ≥ 22.5 (`node -v`); document the requirement in `README.md`.
3. Add `.env.example` with `GAME_COOKIE_SECRET=`.
4. Copy `images/favicon.ico` into `public/favicon.ico`.
5. Set up Vitest (`npm i -D vitest`) and Playwright (`npm i -D @playwright/test`; `npx playwright install`).

**Definition of done:** app builds and runs (`npm run dev`), lints clean, empty test runners execute successfully.

### Phase 2 — Domain logic (pure functions, no I/O)
1. `lib/domain/constants.ts`: `RANGES = [10, 50, 100, 500]`, `RANGE_TO_LEVEL` map, `MAX_ATTEMPTS = (range) => range`.
2. `lib/domain/hints.ts`: implement the algorithm in Section 2.3, returning a discriminated union `{ kind: "win" } | { kind: "hint", message } | { kind: "invalid" }` — pure, no session/DB access.
3. `lib/domain/validation.ts`: `validateUsername(input): { ok: true, value } | { ok: false, error }`, `validateGuess(input, range): { ok, value|error }`, `validateRange(input): { ok, value|error }`.
4. Unit tests: cover every boundary in the hint algorithm (target `0`, target `range`, guess `0`, guess `range`, guess `== target`, both sides of each threshold), and every validation rejection path.

**Definition of done:** `npm run test:unit` passes with boundary cases from SPEC.md Section 11 ("Exact current hint logic") re-verified against the corrected algorithm.

### Phase 3 — SQLite data layer
1. `db/schema.sql` as in Section 3.
2. `lib/db.ts`: open `node:sqlite` `DatabaseSync` at `data/getme.db`, run schema on first import, export a singleton.
3. `lib/scores-repository.ts`:
   - `insertScore({ username, attempts, level }): void` — parameterized `INSERT`.
   - `listTopScores(limit = 50): Score[]` — parameterized `SELECT ... ORDER BY attempts ASC, created_at DESC LIMIT ?`.
4. Add `data/.gitkeep` and gitignore `data/*.db`.

**Definition of done:** manual smoke test inserts a row and lists it back in correct order; SQL injection attempt in `username` (e.g. `'); DROP TABLE scores; --`) is stored as a literal harmless string, not executed.

### Phase 4 — Game session cookie
1. `lib/game-session.ts`: `encryptGameState(state): string`, `decryptGameState(token): GameState | null` using AES-256-GCM and `GAME_COOKIE_SECRET`.
2. Helper `readGameState()` / `writeGameState()` wrapping Next.js `cookies()` API with the flags from Section 4.
3. Unit test round-trip encode/decode, and confirm tampering (flipping a byte) fails decryption safely (returns `null`, never throws uncaught).

**Definition of done:** invalid/tampered cookies are handled gracefully everywhere they're read.

### Phase 5 — Server actions
1. `startGame(formData)`:
   - Validate `range` (must be one of `RANGES`) and `username`.
   - On failure, return field errors to the form (no redirect).
   - On success: compute `target = randomInt(0, range)` inclusive, build initial `GameState`, write cookie, redirect to `/game`.
2. `submitGuess(formData)`:
   - Read game state; if missing or not `in_progress`, return `game_over`/redirect-to-`/` error.
   - Validate guess against current `range`; on invalid input, return `{ status: "invalid" }` without mutating state.
   - Run hint algorithm; update `attempts`; determine `won` / `lost` / continue per Section 2.2.
   - On `won`, call `insertScore`.
   - Persist updated state to the cookie; return the result to the page.
3. `exitGame()`: clear cookie, redirect to `/`.

**Definition of done:** all mutations are server-side only; the client never receives `target` while `in_progress`.

### Phase 6 — Pages and components
1. `app/page.tsx`: instructions + `GameSetupForm` (range `<select>` with corrected labels, username `<input>`, submit) using `startGame` as a form action; show validation errors inline.
2. `app/game/page.tsx`: Server Component that reads the cookie via `readGameState()`; if absent, redirect to `/`; renders:
   - Welcome message with username and range.
   - Attempt counter (`attempts` / `maxAttempts`).
   - Guess form (disabled/hidden once `status !== "in_progress"`) bound to `submitGuess`.
   - Result banner: hint / win / lost, styled distinctly (info/success/danger) with Tailwind.
   - Leaderboard table via `listTopScores()`.
   - Exit button bound to `exitGame`.
3. Shared layout: header, favicon, Tailwind base styles in `app/layout.tsx` / `globals.css`.

**Definition of done:** full click-through game is playable in the browser end to end.

### Phase 7 — Security hardening pass
1. Confirm every SQL statement is parameterized (grep for string concatenation into SQL — must be none).
2. Confirm cookie is `httpOnly`, `secure` (prod), `sameSite=lax`, and encrypted (not just base64/plain JSON).
3. Confirm React's default escaping is relied upon for all rendered user input (no `dangerouslySetInnerHTML`).
4. Add basic rate limiting consideration note in README (not required for this scope, but document as a future improvement) — do not over-build this.
5. Confirm `GAME_COOKIE_SECRET` is read from env only, never hardcoded, and `.env` is gitignored.

**Definition of done:** checklist above verified and noted in README's "Security" section.

### Phase 8 — Testing
1. Unit tests (Phase 2/4) all passing.
2. Playwright E2E (`tests/e2e/game-flow.spec.ts`) covering, at minimum:
   - Setup → play → win flow for `BEGINNER` (small range makes deterministic testing feasible by seeding/mocking the RNG in test mode, or by repeatedly guessing until win within max attempts).
   - Invalid username rejected on `/`.
   - Invalid guess (letters, negative, out-of-range) rejected without incrementing attempts.
   - Losing flow: exhaust `maxAttempts` without winning, confirm `lost` state and no further guesses accepted.
   - Leaderboard shows a newly inserted score after a win, ordered correctly.
   - Exit clears the game and returns to `/`.
3. To make win/lose deterministic in tests, add a test-only seam: allow `target` to be injected via an env-gated test hook (e.g. `NEXT_PUBLIC_TEST_MODE` + a hidden form field only accepted when that flag is set) rather than trying to guess randomly. Document this clearly as test-only and never enabled in production builds.

**Definition of done:** `npm run test:unit` and `npm run test:e2e` both green.

### Phase 9 — Polish and documentation
1. Update `README.md`: setup instructions (`npm install`, set `GAME_COOKIE_SECRET`, `npm run dev`), how the game works, and the one documented behavior change (target reveal on loss).
2. Verify favicon renders at `/favicon.ico`.
3. Remove any leftover PHP-era assumptions from copy/labels (levels, exit links, etc.).
4. Final pass: `npm run build` succeeds with no type errors or lint warnings.

**Definition of done:** production build succeeds; app is fully playable; all tests pass; README is self-contained for a new developer.

---

## 8. Acceptance Criteria Checklist (final sign-off)

- [ ] `/` shows instructions, 4 correctly-labeled difficulty options, username input, and validates both fields server-side before starting a game.
- [ ] Starting a game sets an encrypted, `httpOnly` cookie; no target value is ever visible in browser dev tools/network tab while playing.
- [ ] Guessing correctly ends the game, shows attempt count, writes exactly one row to `scores`, and disables further guesses.
- [ ] Guessing incorrectly shows the correct, non-overlapping hint per Section 2.3 and increments attempts.
- [ ] Reaching `maxAttempts` without winning ends the game as `lost`, reveals the target, and disables further guesses.
- [ ] Invalid guesses never mutate attempts or game status.
- [ ] Leaderboard shows top 50 by fewest attempts (tie-break newest first) and updates immediately after a win.
- [ ] SQL injection and script-injection payloads in the username are stored/rendered harmlessly (verified by a test).
- [ ] Exit clears the cookie and returns to `/`.
- [ ] All unit and E2E tests pass; production build succeeds.
