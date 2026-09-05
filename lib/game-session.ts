import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import { isGameRange, RANGE_TO_LEVEL, type GameRange, type Level } from "./domain/constants";
import type { GameState } from "./domain/types";

const COOKIE_NAME = "getme_game";
const COOKIE_MAX_AGE = 60 * 60;
const IV_LENGTH = 12;

function getSecretKey(): Buffer {
  const secret = process.env.GAME_COOKIE_SECRET;
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error("GAME_COOKIE_SECRET must be a 64-character hexadecimal value.");
  }

  return Buffer.from(secret, "hex");
}

export function encryptGameState(state: GameState): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getSecretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(state), "utf8"), cipher.final()]);
  const payload = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
  return payload.toString("base64url");
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<GameState>;
  return (
    typeof state.username === "string" &&
    typeof state.range === "number" &&
    isGameRange(state.range) &&
    state.level === RANGE_TO_LEVEL[state.range] &&
    typeof state.target === "number" &&
    Number.isInteger(state.target) &&
    state.target >= 0 &&
    state.target <= state.range &&
    typeof state.attempts === "number" &&
    Number.isInteger(state.attempts) &&
    state.attempts >= 0 &&
    typeof state.maxAttempts === "number" &&
    state.maxAttempts === state.range &&
    (state.status === "in_progress" || state.status === "won" || state.status === "lost") &&
    typeof state.createdAt === "string"
  );
}

export function decryptGameState(token: string): GameState | null {
  try {
    const payload = Buffer.from(token, "base64url");
    if (payload.length <= IV_LENGTH + 16) return null;

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = payload.subarray(IV_LENGTH + 16);
    const decipher = createDecipheriv("aes-256-gcm", getSecretKey(), iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const value: unknown = JSON.parse(plaintext);
    return isGameState(value) ? value : null;
  } catch {
    return null;
  }
}

export async function readGameState(): Promise<GameState | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? decryptGameState(token) : null;
}

export async function writeGameState(state: GameState): Promise<void> {
  (await cookies()).set(COOKIE_NAME, encryptGameState(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearGameState(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };
export type { GameRange, Level };
