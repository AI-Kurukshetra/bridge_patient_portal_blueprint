import { getFhirPatientContextById } from "@/lib/fhir/context";
import { buildFhirPatient } from "@/lib/fhir/patient";
import { fhirJson, fhirNotFound, fhirUnauthorized } from "@/lib/fhir/utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getFhirPatientContextById(id);

  if (result.status === "unauthorized") {
    return fhirUnauthorized();
  }

  if (result.status !== "ok" || !result.context.profile) {
    return fhirNotFound();
  }

  return fhirJson(buildFhirPatient(result.context.profile, result.context.patient));
}