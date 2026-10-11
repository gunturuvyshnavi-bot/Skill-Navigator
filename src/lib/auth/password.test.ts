import { describe, it, expect } from "vitest";
import { passwordProblem, normalizeEmail } from "./password";

describe("password rules", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(passwordProblem("abc123", "abc123")).not.toBeNull();
  });
  it("rejects passwords without a number", () => {
    expect(passwordProblem("abcdefgh", "abcdefgh")).not.toBeNull();
  });
  it("rejects mismatched confirmation", () => {
    expect(passwordProblem("abcd1234", "abcd12345")).toBe("Passwords don't match.");
  });
  it("accepts 8+ chars with letters and numbers", () => {
    expect(passwordProblem("abcd1234", "abcd1234")).toBeNull();
  });
  it("trims and lowercases emails", () => {
    expect(normalizeEmail("  User@Gmail.com ")).toBe("user@gmail.com");
  });
});
