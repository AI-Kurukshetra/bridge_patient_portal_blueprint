import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/queries/portal";

export async function GET() {
  const data = await getPortalData();
  if (!data || !data.patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    resourceType: "Bundle",
    type: "searchset",
    total: data.conditions.length,
    entry: data.conditions.map((condition) => ({
      resource: {
        resourceType: "Condition",
        id: condition.fhir_id ?? condition.id,
        subject: { reference: `Patient/${data.patient!.id}` },
        code: { text: condition.display_name, coding: condition.icd10_code ? [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: condition.icd10_code }] : [] },
        clinicalStatus: { text: condition.clinical_status },
        onsetDateTime: condition.onset_date,
      },
    })),
  });
}

