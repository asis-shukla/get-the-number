import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "@/lib/db";
import { insertScore, listTopScores } from "@/lib/scores-repository";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("scores repository", () => {
  it("parameterizes usernames and orders the leaderboard", () => {
    const directory = mkdtempSync(join(tmpdir(), "getme-"));
    directories.push(directory);
    const database = createDatabase(join(directory, "scores.db"));

    insertScore({ username: "'); DROP TABLE scores; --", attempts: 5, level: "EASY" }, database);
    insertScore({ username: "Fast", attempts: 2, level: "BEGINNER" }, database);
    insertScore({ username: "Also fast", attempts: 3, level: "HARD" }, database);

    const scores = listTopScores(2, database);
    expect(scores).toHaveLength(2);
    expect(scores[0].username).toBe("Fast");
    expect(scores[1].username).toBe("Also fast");
    expect(listTopScores(50, database)).toHaveLength(3);
    database.close();
  });
});
