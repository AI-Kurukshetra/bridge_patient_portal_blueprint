import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation", () => {
  it("accepts a valid login payload", () => {
    expect(loginSchema.safeParse({ email: "patient@example.com", password: "password123" }).success).toBe(true);
  });

  it("rejects mismatched passwords on register", () => {
    expect(registerSchema.safeParse({ fullName: "Jane Patient", email: "patient@example.com", password: "password123", confirmPassword: "password999" }).success).toBe(false);
  });
});

