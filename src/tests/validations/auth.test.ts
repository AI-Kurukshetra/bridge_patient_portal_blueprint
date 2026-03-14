import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validations/auth";

describe("auth validation", () => {
  it("accepts a valid login payload", () => {
    expect(loginSchema.safeParse({ email: "patient@example.com", password: "Password123!" }).success).toBe(true);
  });

  it("accepts a valid forgot-password payload", () => {
    expect(forgotPasswordSchema.safeParse({ email: "patient@example.com" }).success).toBe(true);
  });

  it("rejects weak passwords on register", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Jane Patient",
        email: "patient@example.com",
        password: "password123",
        confirmPassword: "password123",
        agreeTerms: true,
      }).success,
    ).toBe(false);
  });

  it("rejects missing terms acceptance on register", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Jane Patient",
        email: "patient@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        agreeTerms: false,
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched passwords on password reset", () => {
    expect(resetPasswordSchema.safeParse({ password: "Password123!", confirmPassword: "Password456!" }).success).toBe(false);
  });
});
