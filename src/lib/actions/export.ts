"use server";

import { revalidatePath } from "next/cache";
import { appendPortalEvent, getCurrentUserPatient } from "@/lib/actions/activity";
import { getHealthExportSectionLabels } from "@/lib/exports/health";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/utils";
import {
  healthDataExportSchema,
  normalizeHealthDataExportInput,
  type HealthDataExportInput,
} from "@/lib/validations/export";

export async function requestHealthDataExportAction(
  payload: HealthDataExportInput,
): Promise<ActionResult<{ downloadUrl: string }>> {
  const parsed = healthDataExportSchema.safeParse(normalizeHealthDataExportInput(payload as Record<string, unknown>));
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { patientId, user } = await getCurrentUserPatient(supabase);
  if (!user) {
    return { error: { _form: ["Unauthorized"] } };
  }

  if (!patientId) {
    return { error: { _form: ["Patient record not found"] } };
  }

  const params = new URLSearchParams({
    format: parsed.data.format,
    includeProfile: String(parsed.data.includeProfile),
    includeAppointments: String(parsed.data.includeAppointments),
    includeClinicalHistory: String(parsed.data.includeClinicalHistory),
    includeLabResults: String(parsed.data.includeLabResults),
    includeMedications: String(parsed.data.includeMedications),
    includeDocuments: String(parsed.data.includeDocuments),
    includeConsents: String(parsed.data.includeConsents),
  });

  const selectedSections = getHealthExportSectionLabels(parsed.data).join(", ");
  await appendPortalEvent(supabase, user.id, {
    actionHref: "/data-export",
    detail: `A ${parsed.data.format.replaceAll("_", " ")} export was requested with ${selectedSections}.`,
    notify: false,
    title: "Health data export requested",
    type: "records",
  });

  revalidatePath("/data-export");
  revalidatePath("/dashboard");
  return {
    success: true,
    data: {
      downloadUrl: `/api/exports/health?${params.toString()}`,
    },
    message: "Your export is being prepared.",
  };
}