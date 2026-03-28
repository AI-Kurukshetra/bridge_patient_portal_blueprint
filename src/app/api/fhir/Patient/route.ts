import { getAccessibleFhirPatients } from "@/lib/fhir/context";
import { buildFhirPatient } from "@/lib/fhir/patient";
import { fhirJson, fhirUnauthorized, makeBundle, paginate, parsePagination } from "@/lib/fhir/utils";

export async function GET(request: Request) {
  const result = await getAccessibleFhirPatients();
  if (result.status !== "ok") {
    return fhirUnauthorized();
  }

  const url = new URL(request.url);
  const idFilter = url.searchParams.get("_id");
  const identifierFilter = url.searchParams.get("identifier");
  const nameFilter = url.searchParams.get("name")?.toLowerCase();

  const resources = result.patients.filter((entry) => entry.profile).filter((entry) => {
    if (idFilter && entry.patient.id !== idFilter) {
      return false;
    }

    if (identifierFilter && entry.patient.patient_mrn !== identifierFilter) {
      return false;
    }

    if (nameFilter && !entry.profile?.full_name.toLowerCase().includes(nameFilter)) {
      return false;
    }

    return true;
  });

  const { count, offset } = parsePagination(url);
  const filtered = paginate(resources, count, offset);

  return fhirJson(
    makeBundle(
      filtered.map((entry) => ({
        resource: buildFhirPatient(entry.profile!, entry.patient),
      })),
      resources.length,
    ),
  );
}