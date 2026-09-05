import { beforeEach, describe, expect, it } from "vitest";
import { decryptGameState, encryptGameState } from "@/lib/game-session";
import type { GameState } from "@/lib/domain/types";

const state: GameState = {
  username: "Ada",
  range: 50,
  level: "EASY",
  target: 7,
  attempts: 2,
  maxAttempts: 50,
  status: "in_progress",
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  process.env.GAME_COOKIE_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encrypted game session", () => {
  it("round trips game state without exposing plaintext", () => {
    const token = encryptGameState(state);
    expect(token).not.toContain("Ada");
    expect(decryptGameState(token)).toEqual(state);
  });

  it("rejects tampered tokens", () => {
    const token = encryptGameState(state);
    const replacement = (token[0] === "A" ? "B" : "A") + token.slice(1);
    expect(decryptGameState(replacement)).toBeNull();
  });

  it("rejects malformed secrets safely while decrypting", () => {
    process.env.GAME_COOKIE_SECRET = "bad";
    expect(decryptGameState("not-a-token")).toBeNull();
  });
});
