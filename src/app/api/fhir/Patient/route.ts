import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/queries/portal";

export async function GET() {
  const data = await getPortalData();
  if (!data || !data.profile || !data.patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    resourceType: "Patient",
    id: data.patient.id,
    identifier: [{ system: "https://medconnect.app/mrn", value: data.patient.patient_mrn }],
    name: [{ text: data.profile.full_name }],
    telecom: [{ system: "email", value: data.profile.email }, ...(data.profile.phone ? [{ system: "phone", value: data.profile.phone }] : [])],
    gender: data.profile.gender ?? "unknown",
    birthDate: data.profile.date_of_birth,
  });
}

