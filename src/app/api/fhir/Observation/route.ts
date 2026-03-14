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
    total: data.labResults.length,
    entry: data.labResults.map((result) => ({
      resource: {
        resourceType: "Observation",
        id: result.fhir_id ?? result.id,
        status: result.status,
        code: { text: result.test_name },
        subject: { reference: `Patient/${data.patient!.id}` },
        effectiveDateTime: result.observed_at,
        valueQuantity: result.result_value !== null ? { value: result.result_value, unit: result.unit } : undefined,
        interpretation: result.abnormal_flag ? [{ text: result.abnormal_flag }] : undefined,
      },
    })),
  });
}

