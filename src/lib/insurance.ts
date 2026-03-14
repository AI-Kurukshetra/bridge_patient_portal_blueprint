import type { Row } from "@/types/database";

export type InsuranceClaim = Row<"insurance_claims">;

const openStatuses = new Set(["submitted", "under_review", "appealed"]);

export function getOpenClaimCount(claims: InsuranceClaim[]) {
  return claims.filter((claim) => openStatuses.has(claim.status)).length;
}

export function getDeniedClaimCount(claims: InsuranceClaim[]) {
  return claims.filter((claim) => claim.status === "denied").length;
}

export function getLatestClaim(claims: InsuranceClaim[]) {
  return [...claims]
    .sort((left, right) => new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime())[0] ?? null;
}

export function getClaimBalance(claim: InsuranceClaim) {
  if (typeof claim.patient_responsibility_cents === "number") {
    return claim.patient_responsibility_cents;
  }

  return Math.max(claim.billed_amount_cents - (claim.covered_amount_cents ?? 0), 0);
}

export function getCoverageRatio(claim: InsuranceClaim) {
  if (claim.billed_amount_cents <= 0) {
    return 0;
  }

  return Math.round(((claim.covered_amount_cents ?? 0) / claim.billed_amount_cents) * 100);
}

export function isAppealableClaim(claim: InsuranceClaim) {
  return claim.status === "denied";
}