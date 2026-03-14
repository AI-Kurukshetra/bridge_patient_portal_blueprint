import { describe, expect, it } from "vitest";
import { healthDataExportSchema } from "@/lib/validations/export";

describe("healthDataExportSchema", () => {
  it("accepts a valid export selection", () => {
    const result = healthDataExportSchema.safeParse({
      format: "pdf",
      includeProfile: true,
      includeAppointments: true,
      includeClinicalHistory: false,
      includeLabResults: true,
      includeMedications: false,
      includeDocuments: false,
      includeConsents: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects requests with no selected sections", () => {
    const result = healthDataExportSchema.safeParse({
      format: "csv",
      includeProfile: false,
      includeAppointments: false,
      includeClinicalHistory: false,
      includeLabResults: false,
      includeMedications: false,
      includeDocuments: false,
      includeConsents: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.includeProfile).toBeDefined();
  });

  it("rejects unsupported formats", () => {
    const result = healthDataExportSchema.safeParse({
      format: "xml",
      includeProfile: true,
      includeAppointments: false,
      includeClinicalHistory: false,
      includeLabResults: false,
      includeMedications: false,
      includeDocuments: false,
      includeConsents: false,
    });

    expect(result.success).toBe(false);
  });
});