import { describe, expect, it } from "vitest";
import { getClaimBalance, getCoverageRatio, getDeniedClaimCount, getLatestClaim, getOpenClaimCount, isAppealableClaim } from "@/lib/insurance";
import type { Row } from "@/types/database";

function buildClaim(overrides: Partial<Row<"insurance_claims">> = {}): Row<"insurance_claims"> {
  return {
    id: "claim-1",
    patient_id: "patient-1",
    provider_id: "provider-1",
    claim_number: "CLM-1234-01",
    payer_name: "BlueCross Horizon",
    plan_name: "Employer PPO",
    claim_type: "medical",
    status: "under_review",
    service_description: "Annual preventive visit",
    service_start: "2026-03-01",
    service_end: "2026-03-01",
    billed_amount_cents: 18500,
    allowed_amount_cents: 15500,
    covered_amount_cents: 14000,
    patient_responsibility_cents: 4500,
    submitted_at: "2026-03-02T10:00:00.000Z",
    processed_at: null,
    reference_number: "REF-123",
    denial_reason: null,
    notes: "Claim transmitted to payer",
    created_at: "2026-03-02T10:00:00.000Z",
    updated_at: "2026-03-02T10:00:00.000Z",
    ...overrides,
  };
}

describe("insurance helpers", () => {
  it("counts open and denied claims separately", () => {
    const claims = [
      buildClaim({ id: "open-1", status: "submitted" }),
      buildClaim({ id: "open-2", status: "appealed" }),
      buildClaim({ id: "denied-1", status: "denied" }),
    ];

    expect(getOpenClaimCount(claims)).toBe(2);
    expect(getDeniedClaimCount(claims)).toBe(1);
  });

  it("returns the most recent claim by submitted date", () => {
    const latest = buildClaim({ id: "latest", submitted_at: "2026-03-05T09:00:00.000Z", claim_number: "CLM-LATEST" });
    const older = buildClaim({ id: "older", submitted_at: "2026-02-20T09:00:00.000Z", claim_number: "CLM-OLDER" });

    expect(getLatestClaim([older, latest])?.claim_number).toBe("CLM-LATEST");
  });

  it("computes coverage ratio and patient balance", () => {
    const claim = buildClaim({ billed_amount_cents: 10000, covered_amount_cents: 7600, patient_responsibility_cents: 2400 });

    expect(getCoverageRatio(claim)).toBe(76);
    expect(getClaimBalance(claim)).toBe(2400);
  });

  it("marks denied claims as appealable", () => {
    expect(isAppealableClaim(buildClaim({ status: "denied" }))).toBe(true);
    expect(isAppealableClaim(buildClaim({ status: "approved" }))).toBe(false);
  });
});