import { buildFhirPatient } from "@/lib/fhir/patient";
import { fhirJson, fhirUnauthorized } from "@/lib/fhir/utils";
import { getPortalData } from "@/lib/queries/portal";

export async function GET() {
  const data = await getPortalData();
  if (!data || !data.profile || !data.patient) {
    return fhirUnauthorized();
  }

  return fhirJson(buildFhirPatient(data.profile, data.patient));
}
