import { describe, expect, it } from "vitest";
import { consentSchema } from "@/lib/validations/consent";

describe("consent validation", () => {
  it("accepts a valid consent update", () => {
    expect(
      consentSchema.safeParse({
        consentType: "hipaa",
        granted: true,
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported consent types", () => {
    expect(
      consentSchema.safeParse({
        consentType: "fax",
        granted: false,
      }).success,
    ).toBe(false);
  });
});
