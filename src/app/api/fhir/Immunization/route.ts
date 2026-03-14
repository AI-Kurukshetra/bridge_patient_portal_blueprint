import { fhirJson, fhirUnauthorized, makeBundle, matchesPatient, paginate, parsePagination } from "@/lib/fhir/utils";
import { getPortalData } from "@/lib/queries/portal";

export async function GET(request: Request) {
  const data = await getPortalData();
  if (!data || !data.patient) {
    return fhirUnauthorized();
  }

  const url = new URL(request.url);
  if (!matchesPatient(url, data.patient.id)) {
    return fhirJson(makeBundle([]));
  }

  const { count, offset } = parsePagination(url);
  const immunizations = data.procedures.filter((item) => {
    const category = item.category?.toLowerCase() ?? "";
    return category.includes("immun") || category.includes("vaccin");
  });
  const filtered = paginate(immunizations, count, offset);

  return fhirJson(
    makeBundle(
      filtered.map((item) => ({
        resource: {
          resourceType: "Immunization",
          id: item.id,
          status: "completed",
          vaccineCode: { text: item.procedure_name },
          patient: { reference: `Patient/${data.patient!.id}` },
          occurrenceDateTime: item.performed_at,
          note: item.notes ? [{ text: item.notes }] : undefined,
        },
      })),
    ),
  );
}
