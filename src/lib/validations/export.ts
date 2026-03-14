import { z } from "zod";

export const healthExportFormatSchema = z.enum(["pdf", "csv", "fhir_json"]);

export const healthDataExportSchema = z
  .object({
    format: healthExportFormatSchema,
    includeProfile: z.boolean(),
    includeAppointments: z.boolean(),
    includeClinicalHistory: z.boolean(),
    includeLabResults: z.boolean(),
    includeMedications: z.boolean(),
    includeDocuments: z.boolean(),
    includeConsents: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const selectedSections = [
      value.includeProfile,
      value.includeAppointments,
      value.includeClinicalHistory,
      value.includeLabResults,
      value.includeMedications,
      value.includeDocuments,
      value.includeConsents,
    ];

    if (!selectedSections.some(Boolean)) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one section to export.",
        path: ["includeProfile"],
      });
    }
  });

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "1" || value === "on";
}

export function normalizeHealthDataExportInput(input: Record<string, unknown>) {
  return {
    format: typeof input.format === "string" ? input.format : "pdf",
    includeProfile: parseBoolean(input.includeProfile),
    includeAppointments: parseBoolean(input.includeAppointments),
    includeClinicalHistory: parseBoolean(input.includeClinicalHistory),
    includeLabResults: parseBoolean(input.includeLabResults),
    includeMedications: parseBoolean(input.includeMedications),
    includeDocuments: parseBoolean(input.includeDocuments),
    includeConsents: parseBoolean(input.includeConsents),
  };
}

export type HealthDataExportInput = z.infer<typeof healthDataExportSchema>;
export type HealthExportFormat = z.infer<typeof healthExportFormatSchema>;