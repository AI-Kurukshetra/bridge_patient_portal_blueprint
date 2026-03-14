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
    total: data.allergies.length,
    entry: data.allergies.map((allergy) => ({
      resource: {
        resourceType: "AllergyIntolerance",
        id: allergy.id,
        clinicalStatus: { text: allergy.status },
        code: { text: allergy.allergen },
        patient: { reference: `Patient/${data.patient!.id}` },
        reaction: [{ description: allergy.reaction?.join(", ") ?? undefined }],
      },
    })),
  });
}

