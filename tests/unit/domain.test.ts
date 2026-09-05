import { describe, expect, it } from "vitest";
import { getHint } from "@/lib/domain/hints";
import { validateGuess, validateRange, validateUsername } from "@/lib/domain/validation";

describe("getHint", () => {
  it("recognizes the target", () => {
    expect(getHint(10, 10, 50)).toEqual({ kind: "win" });
  });

  it("returns behind messages at their boundaries", () => {
    expect(getHint(0, 9, 50)).toEqual({ kind: "hint", message: "You are far behind the number" });
    expect(getHint(7, 9, 50)).toEqual({ kind: "hint", message: "You are close behind the number" });
  });

  it("returns ahead messages at their boundaries", () => {
    expect(getHint(12, 9, 50)).toEqual({ kind: "hint", message: "You are close ahead of the number" });
    expect(getHint(30, 9, 50)).toEqual({ kind: "hint", message: "You are far ahead of the number" });
  });

  it("handles targets at both range edges", () => {
    expect(getHint(0, 0, 10)).toEqual({ kind: "win" });
    expect(getHint(9, 10, 10)).toEqual({ kind: "hint", message: "You are close behind the number" });
  });
});

describe("validation", () => {
  it("accepts safe usernames and rejects unsafe ones", () => {
    expect(validateUsername(" Ada-7 ")).toEqual({ ok: true, value: "Ada-7" });
    expect(validateUsername("<script>")).toMatchObject({ ok: false });
  });

  it("accepts only supported ranges", () => {
    expect(validateRange("50")).toEqual({ ok: true, value: 50 });
    expect(validateRange("25")).toMatchObject({ ok: false });
  });

  it("accepts integer guesses within range", () => {
    expect(validateGuess(" 0 ", 10)).toEqual({ ok: true, value: 0 });
    expect(validateGuess("10.5", 10)).toMatchObject({ ok: false });
    expect(validateGuess("11", 10)).toMatchObject({ ok: false });
  });
});
