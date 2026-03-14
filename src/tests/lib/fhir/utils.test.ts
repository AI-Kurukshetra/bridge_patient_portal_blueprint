import { describe, expect, it } from "vitest";
import { makeBundle, makeOperationOutcome } from "@/lib/fhir/utils";

describe("FHIR utility helpers", () => {
  it("builds an OperationOutcome payload", () => {
    const outcome = makeOperationOutcome("error", "forbidden", "No patient access");

    expect(outcome.resourceType).toBe("OperationOutcome");
    expect(outcome.issue[0]?.code).toBe("forbidden");
  });

  it("preserves total count in bundles", () => {
    const bundle = makeBundle([{ resource: { resourceType: "Patient", id: "patient-1" } }], 5);

    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.total).toBe(5);
  });
});