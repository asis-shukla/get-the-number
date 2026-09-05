# Get The Number

Get The Number is an anonymous number-guessing game built with Next.js, React, Tailwind CSS, and Neon Serverless Postgres. Choose a range, make valid guesses, read the directional hints, and try to finish with the fewest attempts.

## Live App

https://get-the-number-five.vercel.app/

## Requirements

- Node.js 20.9 or newer
- npm

## Setup

```bash
npm install
copy .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated 64-character hexadecimal value in `.env.local` as `GAME_COOKIE_SECRET`, and add your Neon connection string as `DATABASE_URL`.

Create or update the database schema:

```bash
npm run db:migrate
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run db:migrate
npm run lint
npm run test:unit
npm run test:e2e
npm run build
npm start
```

Scores are stored in Neon Serverless Postgres. Active games live in an encrypted, HTTP-only cookie and assume a single persistent application instance.

Repository and end-to-end tests use `DATABASE_URL` and truncate the `scores` table during setup.

## Rules and security

The supported ranges are 10, 50, 100, and 500. Invalid guesses do not consume attempts. A game ends after the selected range number of valid attempts, or immediately after a correct guess. Completed games are locked, and a win writes one score to the top-50 leaderboard.

Unlike the legacy PHP behavior, a lost game reveals the target after the final attempt. Usernames are validated and escaped, and all score writes use parameterized Neon queries.

Server Actions enforce same-origin requests through Next.js. Accounts, rate limiting, distributed sessions, and public JSON APIs are outside this project's scope.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
