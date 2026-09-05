import { test, expect } from "@playwright/test";

test("starts a game, wins, and writes one leaderboard score", async ({ page }) => {
  const username = `Browser Player ${Date.now()}`;

  await page.goto("/");
  await page.getByLabel("Your name").fill(username);
  await page.getByLabel("Choose your range").selectOption("10");
  await page.getByRole("button", { name: "Start a new game" }).click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByRole("heading", { name: new RegExp(`Good luck, ${username}`) })).toBeVisible();
  await page.getByLabel("Your guess").fill("7");
  await page.getByRole("button", { name: "Check guess" }).click();

  await expect(page.getByText("You got it in 1 try!" )).toBeVisible();
  await expect(page.getByRole("cell", { name: username })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check guess" })).toHaveCount(0);
});

test("rejects invalid setup input", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("<script>");
  await page.getByRole("button", { name: "Start a new game" }).click();
  await expect(page.getByText("Use letters, numbers, spaces, hyphens, underscores, or apostrophes only.")).toBeVisible();
});

test("rejects an invalid guess without consuming an attempt", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("Validation Player");
  await page.getByLabel("Choose your range").selectOption("10");
  await page.getByRole("button", { name: "Start a new game" }).click();
  await page.getByLabel("Your guess").fill("11");
  await page.getByRole("button", { name: "Check guess" }).click();

  await expect(page.getByText("Your guess must be between 0 and 10.")).toBeVisible();
  await expect(page.locator(".attempt-meter strong")).toHaveText("00");
});
