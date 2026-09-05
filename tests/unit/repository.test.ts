import { beforeEach, describe, expect, it } from "vitest";
import { getSql, migrateDatabase } from "@/lib/db";
import { insertScore, listTopScores } from "@/lib/scores-repository";

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

beforeEach(async () => {
  await migrateDatabase();
  await getSql().query("TRUNCATE TABLE scores RESTART IDENTITY");
});

describeWithDatabase("scores repository", () => {
  it("parameterizes usernames and orders the leaderboard", async () => {
    await insertScore({ username: "'); DROP TABLE scores; --", attempts: 5, level: "EASY" });
    await insertScore({ username: "Fast", attempts: 2, level: "BEGINNER" });
    await insertScore({ username: "Also fast", attempts: 3, level: "HARD" });

    const scores = await listTopScores(2);
    expect(scores).toHaveLength(2);
    expect(scores[0].username).toBe("Fast");
    expect(scores[1].username).toBe("Also fast");
    await expect(listTopScores(50)).resolves.toHaveLength(3);
  });
});
