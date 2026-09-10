// src/utils/passwordValidator.test.js
import { describe, it, expect } from "vitest";
import { validatePassword } from "./passwordValidator";

describe("Strict Password Validator", () => {
  it("accepts valid passwords meeting all criteria", () => {
    const validSamples = [
      "Namma@2026",
      "Secret#12",
      "A1b2c3d$",
      "Pass_2026",
      "Home!9876",
      "Abcdef1!",
    ];

    validSamples.forEach((pwd) => {
      const res = validatePassword(pwd);
      expect(res.isValid).toBe(true);
      expect(res.rules.length).toBe(true);
      expect(res.rules.hasUpper).toBe(true);
      expect(res.rules.hasNumber).toBe(true);
      expect(res.rules.hasSpecial).toBe(true);
      expect(res.message).toBe("");
    });
  });

  it("rejects passwords shorter than 8 characters", () => {
    const res = validatePassword("Pass1!");
    expect(res.isValid).toBe(false);
    expect(res.rules.length).toBe(false);
    expect(res.message).toMatch(/8-12 characters/i);
  });

  it("rejects passwords longer than 12 characters", () => {
    const res = validatePassword("LongPassword2026!#$");
    expect(res.isValid).toBe(false);
    expect(res.rules.length).toBe(false);
    expect(res.message).toMatch(/8-12 characters/i);
  });

  it("rejects passwords without a capital letter", () => {
    const res = validatePassword("secret@123");
    expect(res.isValid).toBe(false);
    expect(res.rules.hasUpper).toBe(false);
    expect(res.message).toMatch(/capital letter/i);
  });

  it("rejects passwords without a number", () => {
    const res = validatePassword("Secret@abc");
    expect(res.isValid).toBe(false);
    expect(res.rules.hasNumber).toBe(false);
    expect(res.message).toMatch(/number/i);
  });

  it("rejects passwords without a special character", () => {
    const res = validatePassword("Secret2026");
    expect(res.isValid).toBe(false);
    expect(res.rules.hasSpecial).toBe(false);
    expect(res.message).toMatch(/special character/i);
  });

  it("handles empty or null input gracefully", () => {
    const res1 = validatePassword("");
    expect(res1.isValid).toBe(false);
    expect(res1.message).toBe("Password is required.");

    const res2 = validatePassword(null);
    expect(res2.isValid).toBe(false);
    expect(res2.message).toBe("Password is required.");
  });
});
