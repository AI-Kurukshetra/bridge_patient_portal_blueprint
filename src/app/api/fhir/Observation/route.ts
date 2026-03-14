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
    filterByLastUpdated(data.labResults, lastUpdated, (result) => result.observed_at),
    count,
    offset,
  );

  return fhirJson(
    makeBundle(
      filtered.map((result) => ({
        resource: {
          resourceType: "Observation",
          id: result.fhir_id ?? result.id,
          status: result.status,
          code: { text: result.test_name },
          subject: { reference: `Patient/${data.patient!.id}` },
          effectiveDateTime: result.observed_at,
          valueQuantity:
            result.result_value !== null ? { value: result.result_value, unit: result.unit } : undefined,
          valueString: result.result_text ?? undefined,
          interpretation: result.abnormal_flag ? [{ text: result.abnormal_flag }] : undefined,
          referenceRange: result.reference_range ? [{ text: result.reference_range }] : undefined,
        },
      })),
    ),
  );
}
