import { buildFhirPatient } from "@/lib/fhir/patient";
import { fhirJson, fhirUnauthorized } from "@/lib/fhir/utils";
import { getPortalData } from "@/lib/queries/portal";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  if (!data || !data.profile || !data.patient) {
    return fhirUnauthorized();
  }

  if (id !== data.patient.id) {
    return fhirJson({ error: "Not Found" }, 404);
  }

  return fhirJson(buildFhirPatient(data.profile, data.patient));
}
