import { filterByLastUpdated, fhirJson, fhirUnauthorized, makeBundle, matchesPatient, paginate, parseLastUpdated, parsePagination } from "@/lib/fhir/utils";
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
  const lastUpdated = parseLastUpdated(url.searchParams.get("_lastUpdated"));
  const filtered = paginate(
    filterByLastUpdated(data.conditions, lastUpdated, (condition) => condition.onset_date),
    count,
    offset,
  );

  return fhirJson(
    makeBundle(
      filtered.map((condition) => ({
        resource: {
          resourceType: "Condition",
          id: condition.fhir_id ?? condition.id,
          subject: { reference: `Patient/${data.patient!.id}` },
          code: {
            text: condition.display_name,
            coding: condition.icd10_code
              ? [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: condition.icd10_code }]
              : [],
          },
          clinicalStatus: { text: condition.clinical_status },
          onsetDateTime: condition.onset_date,
        },
      })),
    ),
  );
}
