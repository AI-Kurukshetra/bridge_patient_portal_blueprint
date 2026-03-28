import { describe, expect, it } from "vitest";
import { claimAppealSchema } from "@/lib/validations/insurance";

describe("claimAppealSchema", () => {
  it("accepts a valid denied-claim appeal", () => {
    const result = claimAppealSchema.safeParse({
      claimId: "550e8400-e29b-41d4-a716-446655440000",
      appealReason: "The medication was prescribed after a documented adverse reaction and requires manual reimbursement review.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid claim id", () => {
    const result = claimAppealSchema.safeParse({
      claimId: "claim-1",
      appealReason: "The denial reason was incorrect and needs review by the payer.",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.claimId).toBeDefined();
  });

  it("rejects an appeal that is too short", () => {
    const result = claimAppealSchema.safeParse({
      claimId: "550e8400-e29b-41d4-a716-446655440000",
      appealReason: "Please fix this.",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.appealReason).toBeDefined();
  });
});