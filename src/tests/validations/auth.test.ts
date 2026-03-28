import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validations/auth";

describe("registerSchema", () => {
  it("accepts a patient registration without staff fields", () => {
    const result = registerSchema.safeParse({
      role: "patient",
      fullName: "Jane Patient",
      email: "jane@example.com",
      password: "SecurePass1!",
      confirmPassword: "SecurePass1!",
      specialty: "",
      organization: "",
      accessCode: "",
      agreeTerms: true,
    });

    expect(result.success).toBe(true);
  });

  it("requires specialty and access code for providers", () => {
    const result = registerSchema.safeParse({
      role: "provider",
      fullName: "Dr. Nina Shah",
      email: "nina@example.com",
      password: "SecurePass1!",
      confirmPassword: "SecurePass1!",
      specialty: "",
      organization: "Bridge Health",
      accessCode: "",
      agreeTerms: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.specialty).toBeDefined();
    expect(result.error?.flatten().fieldErrors.accessCode).toBeDefined();
  });

  it("requires access code for admins", () => {
    const result = registerSchema.safeParse({
      role: "admin",
      fullName: "Alex Admin",
      email: "alex@example.com",
      password: "SecurePass1!",
      confirmPassword: "SecurePass1!",
      specialty: "",
      organization: "Bridge Ops",
      accessCode: "",
      agreeTerms: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.accessCode).toBeDefined();
  });
});